import json, sys, os
import shutil
import time
import asyncio
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(ROOT_DIR))

from judge.linux.core.compare import normalize
from app.core.redis import redis_client
from app.core.db import AsyncSessionLocal
from app.modules.problems.models import TestCases
from sqlalchemy import select
import platform

from judge.linux.core.runner import run_native_code_async

if platform.system() == "Linux":
    SUBMISSIONS_DIR = Path("/dev/shm/submissions")
else:
    SUBMISSIONS_DIR = Path("./temp_submissions")

TESTCASE_CACHE = {}

STATUS_MAP = {
    "Accepted": "ACCEPTED",
    "Wrong Answer": "WRONG_ANSWER",
    "Time Limit Exceeded": "TIME_LIMIT_EXCEEDED",
    "Runtime Error": "RUNTIME_ERROR",
    "Compilation Error": "COMPILATION_ERROR",
    "Pending": "PENDING",
}

RESULT_MAP = {
    "Passed": "PASSED",
    "Failed": "FAILED",
    "Runtime Error": "RUNTIME_ERROR",
    "Time Limit Exceeded": "TIME_LIMIT_EXCEEDED",
    "Compilation Error": "COMPILATION_ERROR",
}

async def get_testcases_from_db(problem_id):
    async with AsyncSessionLocal() as session:
        query = select(TestCases).where(TestCases.problem_id == problem_id)
        _exc = await session.execute(query)
        testcases = _exc.scalars().all()
        return [{"id": tc.id, "input": tc.input_text, "output": tc.output_text} for tc in testcases]


async def evaluate_submission_async(lang, code, testcases, folder):
    total_time = 0
    final_status = "Accepted"
    results_log = [] 
    
    if lang == "C++":
        source_path = folder / "main.cpp"
        source_path.write_text(code, encoding="utf-8")
        
        #NOTE: dùng ccache & -pipe
        compile_cmd = ["ccache", "g++", "-O2", "-pipe", "-std=c++17", "main.cpp", "-o", "main"]
        comp_process = await asyncio.create_subprocess_exec(
            *compile_cmd, cwd=str(folder), stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        comp_stdout, comp_stderr = await comp_process.communicate()
        
        if comp_process.returncode != 0:
            return "Compilation Error", 0, [{
                "test_case_id": testcases[0]["id"] if testcases else 0,
                "result": "COMPILATION_ERROR",
                "output_text": "",
                "expected_output": "",
                "error_message": comp_stderr.decode('utf-8', errors='ignore')
            }]
        executable = "./main"
        
    elif lang == "Python":
        script_path = folder / "main.py"
        script_path.write_text(code, encoding="utf-8")
        executable = "python3 main.py"

    # đẩy test vào ram
    for i, tc in enumerate(testcases):
        (folder / f"{i}.in").write_text(tc["input"], encoding="utf-8")
        
    if lang == "Python":
        # IN-MEMORY PYTHON RUNNER: Biên dịch Python 1 lần, lặp n testcase trên RAM
        wrapper_code = f"""import sys, io, time, traceback

with open('main.py', 'r', encoding='utf-8') as f:
    student_code = f.read()

try:
    compiled_code = compile(student_code, 'main.py', 'exec')
except Exception as e:
    with open('0.exit', 'w') as f: f.write('1')
    with open('0.err', 'w') as f: f.write(str(e))
    sys.exit(0)

num_tcs = {len(testcases)}

for i in range(num_tcs):
    with open(f"{{i}}.in", "r") as fin:
        sys.stdin = fin
        fout = io.StringIO()
        sys.stdout = fout
        
        exit_code = 0
        err_msg = ""
        
        start = time.perf_counter_ns()
        try:
            exec(compiled_code, {{'__name__': '__main__', '__builtins__': __builtins__}})
        except SystemExit:
            pass
        except Exception:
            exit_code = 1
            err_msg = traceback.format_exc()
            
        end = time.perf_counter_ns()
        
    sys.stdout = sys.__stdout__
    
    with open(f"{{i}}.out", "w") as f_res: f_res.write(fout.getvalue())
    with open(f"{{i}}.time", "w") as f_time: f_time.write(str((end - start) // 1000000))
    with open(f"{{i}}.exit", "w") as f_exit: f_exit.write(str(exit_code))
    
    if exit_code != 0:
        with open(f"{{i}}.err", "w") as ferr: ferr.write(err_msg)
        break
"""
        (folder / "wrapper.py").write_text(wrapper_code, encoding="utf-8")
        run_script = """#!/bin/bash\nCMD="$@"\ntimeout 10s $CMD"""
        executable = "python3 wrapper.py"
        
    else:
        # Bash loop C++
        run_script = """#!/bin/bash
CMD="$@"
for f in *.in; do
    base=$(basename $f .in)
    start=$(date +%s%3N)
    timeout 2s $CMD < $f > $base.out 2> $base.err
    echo $? > $base.exit
    end=$(date +%s%3N)
    echo $((end-start)) > $base.time
done
"""

    (folder / "run.sh").write_text(run_script, encoding="utf-8")
    (folder / "run.sh").chmod(0o777)

    # call 1 lần sanbox
    await run_native_code_async(folder, f"./run.sh {executable}", "", timeout_secs=10)

    for i, tc in enumerate(testcases):
        out_file = folder / f"{i}.out"
        err_file = folder / f"{i}.err"
        exit_file = folder / f"{i}.exit"
        time_file = folder / f"{i}.time"
        
        tc_status = "Passed"
        error_msg = None
        actual = ""
        expected = normalize(tc["output"])
        runtime_ms = 0
        
        if not exit_file.exists():
            tc_status = "Time Limit Exceeded"
            final_status = "Time Limit Exceeded"
            error_msg = "Batch Process Killed (TLE)"
            runtime_ms = 2000
        else:
            res_code = int(exit_file.read_text().strip())
            actual = normalize(out_file.read_text(errors='ignore')) if out_file.exists() else ""
            error_msg = err_file.read_text(errors='ignore') if err_file.exists() else None
            runtime_ms = int(time_file.read_text().strip()) if time_file.exists() else 0
            
            # lấy max time
            total_time = max(total_time, runtime_ms)
            
            if res_code == 124:
                tc_status = "Time Limit Exceeded"
                final_status = "Time Limit Exceeded"
                error_msg = "Time Limit Exceeded"
            elif res_code != 0:
                tc_status = "Runtime Error"
                final_status = "Runtime Error"
            elif actual != expected:
                tc_status = "Failed"
                final_status = "Wrong Answer"

        results_log.append({
            "test_case_id": tc["id"],
            "result": RESULT_MAP.get(tc_status, "FAILED"),
            "output_text": actual,
            "expected_output": expected,
            "error_message": error_msg
        })
        
        if final_status != "Accepted":
            break

    return final_status, total_time, results_log


async def process_job(job_data):
    sub_id = job_data['submission_id']
    user_id = job_data['user_id']
    lang = job_data['language']
    code = job_data['source_code']
    prob_id = job_data['problem_id']
    
    print(f"[*] Đang chấm submission {sub_id} - {lang} (User: {user_id})")
    
    if prob_id not in TESTCASE_CACHE:
        TESTCASE_CACHE[prob_id] = await get_testcases_from_db(prob_id)
        
    testcases = TESTCASE_CACHE[prob_id]
    
    folder = SUBMISSIONS_DIR / str(sub_id)
    folder.mkdir(parents=True, exist_ok=True)
    folder.chmod(0o777)
    
    try:
        final_status, total_time, results_log = await evaluate_submission_async(
            lang, code, testcases, folder
        )

        print(f"    -> Kết quả: {final_status} | Time: {total_time}ms")
        
        await redis_client.lpush("judge_queue_result", json.dumps({
            "sub_id": sub_id,
            "user_id": user_id,
            "prob_id": prob_id,
            "final_status": STATUS_MAP[final_status],
            "total_time": total_time,
            "results_log": results_log
        }))
        
    finally:
        shutil.rmtree(folder, ignore_errors=True)

# BACKPRESSURE
# Set limit = số nhân CPU của Server 
MAX_CONCURRENT_JUDGES = max(1, os.cpu_count() or 2) 
semaphore = asyncio.Semaphore(MAX_CONCURRENT_JUDGES)

async def process_with_limit(job):
    try:
        await process_job(job)
    except Exception as e:
        print(f"[!] Judge Error: {e}")
    finally:
        # Giải phóng Slot cho bài nộp 
        semaphore.release()

async def main():
    print(f"[Worker Judge] Running.. BATCHING MODE | CPU CORES: {MAX_CONCURRENT_JUDGES}")
    
    while True:
        try:
            # get job khi ram/cpu trống
            await semaphore.acquire()
            
            result = await redis_client.brpop("judge_queue", timeout=0)
            
            if not result:
                semaphore.release()
                continue
                
            _, msg = result
            job = json.loads(msg)
            
            asyncio.create_task(process_with_limit(job))
            
        except Exception as e:
            print(f"[Loop Error]: {e}")
            semaphore.release() # release slot nếu JSON error
            await asyncio.sleep(1)
        except KeyboardInterrupt:
            print("[Keyboard] Exit.")
            break

if __name__ == "__main__":
    asyncio.run(main())