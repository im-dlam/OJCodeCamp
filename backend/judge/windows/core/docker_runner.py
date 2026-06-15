from pathlib import Path
import subprocess


def run_container(
    image: str,
    folder: Path,
    stdin_data: str,
    timeout: int,
):

    mount_path = str(
        folder.resolve()
    ).replace("\\", "/")

    return subprocess.run(
        [
            "docker",
            "run",
            "--rm",

            "-i",

            "--network",
            "none",

            "--memory",
            "128m",

            "--cpus",
            "1",

            "-v",
            f"{mount_path}:/judge",

            image,
        ],
        input=stdin_data,
        capture_output=True,
        text=True,
        timeout=timeout,
    )