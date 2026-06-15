from pathlib import Path
import textwrap
from .runner import run_native_code

def run_python(folder: Path, source_code: str, stdin_data: str):
    py_file = folder / "main.py"
    py_file.write_text(textwrap.dedent(source_code), encoding="utf8")
    
    folder.chmod(0o777)
    py_file.chmod(0o777)
    
    return run_native_code(
        folder=folder,
        executable_path=f"python3 {py_file.name}",
        stdin_data=stdin_data,
        timeout_secs=2
    )