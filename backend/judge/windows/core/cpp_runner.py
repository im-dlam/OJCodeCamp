from pathlib import Path

from judge.windows.core.docker_runner import run_container
import textwrap


def run_cpp(
    folder: Path,
    source_code: str,
    stdin_data: str
):

    # (folder / "main.cpp").write_text(
    #     source_code,
    #     encoding="utf8"
    # )

    (folder / "main.cpp").write_text(
        textwrap.dedent(source_code),
        encoding="utf8",
    )
    return run_container(
        image="judge-cpp",
        folder=folder,
        stdin_data=stdin_data,
        timeout=10
    )