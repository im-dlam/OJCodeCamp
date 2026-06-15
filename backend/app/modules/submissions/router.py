import json
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func

from app.core.deps import get_db
from app.core.redis import redis_client

from app.modules.problems.models import Problems
from .models import Submissions, SubmissionResults
from .schemas import (
    SubmissionCreateSchema,
    SubmissionListResponseSchema,
    SubmissionDetailResponseSchema,
    SubmissionResultResponseSchema,
    SubmissionCheckedResponseSchema,
    ProblemStatsSchema,
    SubmissionCreateResponseSchema,
    SubmissionStatusSchema,
)

router = APIRouter(prefix="/submissions", tags=["Submissions"])


@router.post("/", response_model=SubmissionCreateResponseSchema)
async def submit_code(
    submission_data: SubmissionCreateSchema,
    user_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Submit code cho một bài toán (Bắn vào Queue, không chờ chấm xong)"""
    try:
        problem = await db.scalar(
            select(Problems).where(Problems.id == submission_data.problem_id)
        )

        if not problem:
            raise HTTPException(status_code=404, detail="Bài toán không tìm thấy")

        new_submission = Submissions(
            user_id=user_id,
            problem_id=submission_data.problem_id,
            code=submission_data.code,
            language=submission_data.language.value,  # Enum sang String
            status=SubmissionStatusSchema.PENDING.value,
        )
        db.add(new_submission)

        await db.commit()
        await db.refresh(new_submission)

        job_data = {
            "submission_id": new_submission.id,
            "user_id": user_id,
            "problem_id": submission_data.problem_id,
            "language": submission_data.language.value,
            "source_code": submission_data.code,
        }

        await redis_client.lpush("judge_queue", json.dumps(job_data))

        return {
            "success": True,
            "message": "Đã đưa code vào hàng đợi chấm điểm",
            "submission_id": new_submission.id,
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))




@router.get("/", response_model=SubmissionListResponseSchema)
async def get_submissions(
    user_id: int,
    problem_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Lấy danh sách submission của user (Có phân trang)"""
    try:
        query = select(Submissions).where(Submissions.user_id == user_id)

        if problem_id:
            query = query.where(Submissions.problem_id == problem_id)

        query = query.order_by(desc(Submissions.submitted_at)).offset(skip).limit(limit)

        # Lấy danh sách record
        submissions = (await db.scalars(query)).all()

        # Đếm tổng số lượng 
        count_query = (
            select(func.count())
            .select_from(Submissions)
            .where(Submissions.user_id == user_id)
        )
        if problem_id:
            count_query = count_query.where(Submissions.problem_id == problem_id)
        total_records = await db.scalar(count_query)

        submission_list = [
            {
                "id": s.id,
                "problem_id": s.problem_id,
                "language": s.language,
                "status": s.status,
                "execution_time": s.execution_time,
                "memory_used": s.memory_used,
                "submitted_at": s.submitted_at,
            }
            for s in submissions
        ]

        return {
            "success": True,
            "data": submission_list,
            "total": total_records,
            "skip": skip,
            "limit": limit,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/problem/{problem_id}/stats", response_model=ProblemStatsSchema)
async def get_problem_stats(problem_id: int, db: AsyncSession = Depends(get_db)):
    """Lấy thống kê bài toán (Sử dụng func.count để tránh tràn RAM)"""
    try:
        total_query = (
            select(func.count())
            .select_from(Submissions)
            .where(Submissions.problem_id == problem_id)
        )
        total_submissions = await db.scalar(total_query) or 0

        accepted_query = (
            select(func.count())
            .select_from(Submissions)
            .where(
                Submissions.problem_id == problem_id,
                Submissions.status == SubmissionStatusSchema.ACCEPTED.value,
            )
        )
        accepted_count = await db.scalar(accepted_query) or 0

        acceptance_rate = (
            (accepted_count / total_submissions * 100) if total_submissions > 0 else 0
        )

        return {
            "success": True,
            "problem_id": problem_id,
            "total_submissions": total_submissions,
            "accepted": accepted_count,
            "acceptance_rate": f"{acceptance_rate:.2f}%",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{submission_id}/result", response_model=SubmissionResultResponseSchema)
async def get_submission_result(submission_id: int, db: AsyncSession = Depends(get_db)):
    """Lấy kết quả chi tiết từng testcase của 1 submission"""
    try:
        submission = await db.scalar(
            select(Submissions).where(Submissions.id == submission_id)
        )
        if not submission:
            raise HTTPException(status_code=404, detail="Submission không tìm thấy")

        results = (
            await db.scalars(
                select(SubmissionResults).where(
                    SubmissionResults.submission_id == submission_id
                )
            )
        ).all()

        passed_count = sum(1 for r in results if r.result == "Passed")

        return {
            "success": True,
            "submission_id": submission_id,
            "status": submission.status,
            "passed": passed_count,
            "total": len(results),
            "execution_time": submission.execution_time,
            "memory_used": submission.memory_used,
            "results": [
                {
                    "submission_id": r.submission_id,
                    "test_case_id": r.test_case_id,
                    "result": r.result,
                    "output_text": r.output_text,
                    "expected_output": r.expected_output,
                    "error_message": r.error_message,
                }
                for r in results
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/user/{user_id}/problem/{problem_id}/accepted",
    response_model=SubmissionCheckedResponseSchema,
)
async def check_user_solved(
    user_id: int, problem_id: int, db: AsyncSession = Depends(get_db)
):
    """Kiểm tra user đã giải bài này chưa"""
    try:
        query = (
            select(Submissions)
            .where(
                Submissions.user_id == user_id,
                Submissions.problem_id == problem_id,
                Submissions.status == SubmissionStatusSchema.ACCEPTED.value,
            )
            .limit(1)
        )

        submission = await db.scalar(query)

        return {
            "success": True,
            "user_id": user_id,
            "problem_id": problem_id,
            "is_solved": submission is not None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
