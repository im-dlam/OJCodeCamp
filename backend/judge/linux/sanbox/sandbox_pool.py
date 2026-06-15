import asyncio
from pathlib import Path
import shutil

class SandboxPool:

    def __init__(
        self,
        root="/dev/shm/submissions",
        size=64
    ):
        self.root = Path(root)

        self.queue = asyncio.Queue()

        self.size = size

    async def init(self):

        self.root.mkdir(
            parents=True,
            exist_ok=True
        )

        for i in range(self.size):

            sandbox = self.root / f"sandbox_{i}"

            sandbox.mkdir(
                exist_ok=True
            )

            await self.queue.put(
                sandbox
            )


    async def cleanup(self, sandbox: Path):

        for item in sandbox.iterdir():

            try:

                if item.is_file():
                    item.unlink()

                elif item.is_dir():
                    shutil.rmtree(item)

            except Exception:
                pass

    async def acquire(self):

        return await self.queue.get()
    
    async def release(self, sandbox):

        await self.cleanup(sandbox)

        await self.queue.put(sandbox)