from pathlib import Path

import textwrap
from judge.windows.core.docker_runner import run_container


def run_python(
    folder: Path,
    source_code: str,
    stdin_data: str,
):

    # (folder / "main.py").write_text(
    #     source_code,
    #     encoding="utf8",
    # )

    (folder / "main.py").write_text(
        textwrap.dedent(source_code),
        encoding="utf8",
    )
    return run_container(
        image="judge-python",
        folder=folder,
        stdin_data=stdin_data,
        timeout=2,
    )