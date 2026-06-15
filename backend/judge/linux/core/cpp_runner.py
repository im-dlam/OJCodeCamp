from pathlib import Path
import textwrap
import subprocess
from .runner import run_native_code

def run_cpp(folder: Path, source_code: str, stdin_data: str):
    cpp_file = folder / "main.cpp"
    exe_file = folder / "main"
    
    cpp_file.write_text(textwrap.dedent(source_code), encoding="utf8")
    
    # Compile
    compile_cmd = ["g++", "-std=c++17", str(cpp_file), "-O2", "-o", str(exe_file)]
    compile_process = subprocess.run(compile_cmd, capture_output=True, text=True)
    
    if compile_process.returncode != 0:
        class FakeResult:
            returncode = 100 # Mã lỗi CE
            stdout = ""
            stderr = compile_process.stderr
        return FakeResult()
        
    # Phân quyền để user "nobody" có thể đọc/chạy file này
    folder.chmod(0o777)
    cpp_file.chmod(0o777)
    exe_file.chmod(0o777)
    
    # Run trong Sandbox
    return run_native_code(
        folder=folder,
        executable_path="./main",
        stdin_data=stdin_data,
        timeout_secs=2
    )