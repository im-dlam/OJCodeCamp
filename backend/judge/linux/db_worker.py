import asyncio
import json

from sqlalchemy import BigInteger, text, bindparam, Integer, Text
from sqlalchemy.dialects.postgresql import ARRAY, insert as pg_insert
from sqlalchemy import func, case, select, tuple_

from app.core.db import AsyncSessionLocal
from app.core.redis import redis_client

from app.modules.auth.models import UserProblemStats, UserProblemStatus
from app.modules.problems.models import Problems  , ProblemStats

BATCH_SIZE = 500
SLEEP_TIME = 0.1

UPDATE_SUBMISSIONS_SQL = text("""
WITH submission_data AS (
    SELECT *
    FROM unnest(
        :sub_ids,
        :statuses,
        :times
    ) AS t(
        sub_id,
        status,
        execution_time
    )
)
UPDATE submissions s
SET
    status = d.status::submissionstatus,
    execution_time = d.execution_time
FROM submission_data d
WHERE s.id = d.sub_id
""").bindparams(
    bindparam("sub_ids", type_=ARRAY(BigInteger)),
    bindparam("statuses", type_=ARRAY(Text)),
    bindparam("times", type_=ARRAY(Integer)),
)


INSERT_RESULTS_SQL = text("""
INSERT INTO submission_results (
    submission_id,
    test_case_id,
    result,
    output_text,
    expected_output,
    error_message
)
SELECT
    submission_id,
    test_case_id,
    result::submissionresultstatus,
    output_text,
    expected_output,
    error_message
FROM unnest(
    :submission_ids,
    :test_case_ids,
    :results,
    :outputs,
    :expecteds,
    :errors
) AS t(
    submission_id,
    test_case_id,
    result,
    output_text,
    expected_output,
    error_message
)
""").bindparams(
    bindparam("submission_ids", type_=ARRAY(BigInteger)),
    bindparam("test_case_ids", type_=ARRAY(BigInteger)),
    bindparam("results", type_=ARRAY(Text)),
    bindparam("outputs", type_=ARRAY(Text)),
    bindparam("expecteds", type_=ARRAY(Text)),
    bindparam("errors", type_=ARRAY(Text)),
)

ADD_USER_POINTS_SQL = text("""
UPDATE users
SET point = point + d.add_point
FROM unnest(:uids, :points) AS d(uid, add_point)
WHERE users.id = d.uid
""").bindparams(
    bindparam("uids", type_=ARRAY(BigInteger)),
    bindparam("points", type_=ARRAY(Integer))
)


async def bulk_update(rows: list):
    if not rows:
        return

    async with AsyncSessionLocal() as session:
        try:
            rows.sort(key=lambda x: x["sub_id"])
            await session.execute(
                UPDATE_SUBMISSIONS_SQL,
                {
                    "sub_ids": [row["sub_id"] for row in rows],
                    "statuses": [row["final_status"] for row in rows],
                    "times": [int(row["total_time"]) for row in rows],
                },
            )

            # insert submis result
            submission_ids = []
            test_case_ids = []
            results = []
            outputs = []
            expecteds = []
            errors = []

            for row in rows:
                sub_id = row["sub_id"]
                for log in row.get("results_log", []):
                    submission_ids.append(sub_id)
                    test_case_ids.append(log["test_case_id"])
                    results.append(log["result"])
                    outputs.append(log.get("output_text"))
                    expecteds.append(log.get("expected_output"))
                    errors.append(log.get("error_message"))

            if submission_ids:
                await session.execute(
                    INSERT_RESULTS_SQL,
                    {
                        "submission_ids": submission_ids,
                        "test_case_ids": test_case_ids,
                        "results": results,
                        "outputs": outputs,
                        "expecteds": expecteds,
                        "errors": errors,
                    },
                )

            # handle point
            ac_pairs = list({ (r["user_id"], r["prob_id"]) for r in rows if r["final_status"] == "ACCEPTED" })
            
            if ac_pairs:
                # Kiểm tra xem những cặp này đã từng SOLVED trong database trước đó chưa
                check_query = select(UserProblemStats.user_id, UserProblemStats.problem_id).where(
                    tuple_(UserProblemStats.user_id, UserProblemStats.problem_id).in_(ac_pairs),
                    UserProblemStats.status == UserProblemStatus.SOLVED.name
                )
                existing_solved = { (r.user_id, r.problem_id) for r in (await session.execute(check_query)) }

                # lấy những cặp thực sự là lần đầu tiên giải được
                first_time_ac_pairs = [pair for pair in ac_pairs if pair not in existing_solved]

                if first_time_ac_pairs:
                    # select get point problems
                    prob_ids = list({ pid for _, pid in first_time_ac_pairs })
                    prob_query = select(Problems.id, Problems.point).where(Problems.id.in_(prob_ids))
                    prob_points = { r.id: r.point for r in (await session.execute(prob_query)) }

                    # Tính tổng số điểm cần cộng cho từng user
                    user_points_to_add = {}
                    for uid, pid in first_time_ac_pairs:
                        user_points_to_add[uid] = user_points_to_add.get(uid, 0) + prob_points.get(pid, 0)

                    if user_points_to_add:
                        # Sort user_id desc
                        sorted_uids = sorted(user_points_to_add.keys())
                        points = [user_points_to_add[uid] for uid in sorted_uids]
                        print(f"[POINT DEBUG] Users: {sorted_uids}, Điểm cộng: {points} points")
                        await session.execute(ADD_USER_POINTS_SQL, {"uids": sorted_uids, "points": points})

            # upset user 
            stats_map = {}
            problem_stats_map = {}
            # update stats problem
            
            for row in rows:
                # update stats problem
                
                pid = row["prob_id"]

                if pid not in problem_stats_map:
                    problem_stats_map[pid] = {
                        "problem_id": pid,
                        "attempts": 1,
                        "accepted": 1 if row["final_status"] == "ACCEPTED" else 0,
                    }
                else:
                    problem_stats_map[pid]["attempts"] += 1

                    if row["final_status"] == "ACCEPTED":
                        problem_stats_map[pid]["accepted"] += 1
                # end
                
                key = (row["user_id"], row["prob_id"])
                accepted = (row["final_status"] == "ACCEPTED")

                if key not in stats_map:
                    stats_map[key] = {
                        "user_id": row["user_id"],
                        "problem_id": row["prob_id"],
                        "status": UserProblemStatus.SOLVED.name if accepted else UserProblemStatus.ATTEMPTED.name,
                        "attempts": 1,
                        "first_solved_at": func.now() if accepted else None,
                        "last_attempted_at": func.now(),
                    }
                else:
                    stats_map[key]["attempts"] += 1
                    if accepted:
                        stats_map[key]["status"] = UserProblemStatus.SOLVED.name
                        if stats_map[key]["first_solved_at"] is None:
                            stats_map[key]["first_solved_at"] = func.now()

            stats_rows = list(stats_map.values())
            
            #fix BUG [DEADLOCK]: Sort mảng dữ liệu dựa trên (user_id, problem_id)
            stats_rows.sort(key=lambda x: (x["user_id"], x["problem_id"]))
            
            stmt = pg_insert(UserProblemStats).values(stats_rows)
            stmt = stmt.on_conflict_do_update(
                index_elements=["user_id", "problem_id"],
                set_={
                    "attempts": UserProblemStats.attempts + 1,
                    "last_attempted_at": func.now(),
                    "status": case(
                        (UserProblemStats.status == UserProblemStatus.SOLVED.name, UserProblemStats.status),
                        else_=stmt.excluded.status,
                    ),
                    "first_solved_at": case(
                        (UserProblemStats.first_solved_at.isnot(None), UserProblemStats.first_solved_at),
                        else_=stmt.excluded.first_solved_at,
                    ),
                },
            )

            await session.execute(stmt)
            
            if problem_stats_map:
                # execute stats problem
                problem_rows = list(problem_stats_map.values())

                problem_rows.sort(key=lambda x: x["problem_id"])

                problem_stmt = pg_insert(ProblemStats).values(problem_rows)

                problem_stmt = problem_stmt.on_conflict_do_update(
                    index_elements=["problem_id"],
                    set_={
                        "attempts":
                            ProblemStats.attempts +
                            problem_stmt.excluded.attempts,

                        "accepted":
                            ProblemStats.accepted +
                            problem_stmt.excluded.accepted,

                        "updated_at":
                            func.now(),
                    }
                )

                await session.execute(problem_stmt)
            
            await session.commit()
            print(f"[DB] Updated {len(rows)} submissions & Distributed Points.")

        except Exception as e:
            await session.rollback()
            print(f"[DB ERROR] {e}")


async def main():
    print(f"[DB Worker] Started (batch={BATCH_SIZE}) - Multi-processing safe!")

    while True:
        try:
            raw_rows = await redis_client.rpop("judge_queue_result", count=BATCH_SIZE)

            if not raw_rows:
                await asyncio.sleep(SLEEP_TIME)
                continue

            rows = [json.loads(x) for x in raw_rows]
            await bulk_update(rows)

        except Exception as e:
            print(f"[WORKER ERROR] {e}")
            await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())