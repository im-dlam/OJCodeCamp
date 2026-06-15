import shutil
import uuid
import time
import subprocess

from pathlib import Path

from judge.windows.core.compare import normalize
from judge.windows.core.python_runner import run_python
from judge.windows.core.cpp_runner import run_cpp


SUBMISSIONS_DIR = Path("submissions")


def judge_submission(
    language: str,
    source_code: str,
    testcases: list,
):

    submission_id = uuid.uuid4().hex

    folder = SUBMISSIONS_DIR / submission_id

    folder.mkdir(
        parents=True,
        exist_ok=True,
    )

    subtests = []

    passed = 0

    total_runtime = 0

    try:

        for index, testcase in enumerate(
            testcases,
            start=1,
        ):

            try:

                start = time.perf_counter()

                if language == "python":

                    result = run_python(
                        folder,
                        source_code,
                        testcase["input"],
                    )

                elif language == "cpp":

                    result = run_cpp(
                        folder,
                        source_code,
                        testcase["input"],
                    )

                else:

                    return {
                        "status": "LANGUAGE_NOT_SUPPORTED"
                    }

                runtime_ms = round(
                    (time.perf_counter() - start)
                    * 1000,
                    2,
                )

                total_runtime += runtime_ms

            except subprocess.TimeoutExpired:

                subtests.append(
                    {
                        "id": index,
                        "status": "TLE",
                    }
                )

                return {
                    "status": "TLE",
                    "runtime_ms": total_runtime,
                    "subtests": subtests,
                }

            if result.returncode == 137:

                subtests.append(
                    {
                        "id": index,
                        "status": "MLE",
                    }
                )

                return {
                    "status": "MLE",
                    "runtime_ms": total_runtime,
                    "subtests": subtests,
                }

            if result.returncode == 100:

                subtests.append(
                    {
                        "id": index,
                        "status": "CE",
                    }
                )

                return {
                    "status": "CE",
                    "error": result.stderr,
                    "runtime_ms": total_runtime,
                    "subtests": subtests,
                }

            if result.returncode != 0:

                subtests.append(
                    {
                        "id": index,
                        "status": "RE",
                    }
                )

                return {
                    "status": "RE",
                    "error": result.stderr,
                    "runtime_ms": total_runtime,
                    "subtests": subtests,
                }

            actual = normalize(
                result.stdout
            )

            expected = normalize(
                testcase["output"]
            )

            if actual != expected:

                subtests.append(
                    {
                        "id": index,
                        "status": "WA",
                    }
                )

                return {
                    "status": "WA",
                    "failed_case": index,
                    "expected": expected,
                    "actual": actual,
                    "runtime_ms": total_runtime,
                    "subtests": subtests,
                }

            passed += 1

            subtests.append(
                {
                    "id": index,
                    "status": "AC",
                    "runtime_ms": runtime_ms,
                }
            )

        return {
            "status": "AC",
            "passed": passed,
            "total": len(testcases),
            "runtime_ms": total_runtime,
            "memory_mb": 128,
            "subtests": subtests,
        }

    finally:

        shutil.rmtree(
            folder,
            ignore_errors=True,
        )