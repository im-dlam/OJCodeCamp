import asyncio
import platform
from pathlib import Path

async def run_native_code_async(
    folder: Path,
    executable_path: str,
    stdin_data: str,
    timeout_secs: int = 10,
    memory_mb: int = 128
):
    if platform.system() == "Windows":
        if executable_path.startswith("./"):
            executable_path = executable_path.replace("./", "")
            if "run.sh" not in executable_path and not executable_path.endswith(".exe"):
                 executable_path += ".exe"
        cmd = executable_path.split()
    else:
        memory_bytes = memory_mb * 1024 * 1024
        
        # Ghép chuỗi lệnh mục tiêu
        target_cmd = " ".join(executable_path.split())
        
        cmd = [
            "unshare", "-n",
            "su", "-s", "/bin/sh", "nobody", "-c",
            f"prlimit --as={memory_bytes} --cpu={timeout_secs} --nproc=64 --fsize=10485760 -- {target_cmd}"
        ]

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(folder)
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(input=stdin_data.encode('utf-8')),
            timeout=timeout_secs + 1
        )
        
        class Result:
            pass
        res = Result()
        res.returncode = process.returncode
        res.stdout = stdout.decode('utf-8', errors='ignore')
        res.stderr = stderr.decode('utf-8', errors='ignore')
        return res

    except asyncio.TimeoutError:
        try:
            process.kill()
        except Exception:
            pass
            
        class FakeResult:
            returncode = 124 
            stdout = ""
            stderr = "Time Limit Exceeded"
        return FakeResult()