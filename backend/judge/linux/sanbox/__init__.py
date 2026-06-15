from .sandbox_pool import SandboxPool

sandbox_pool = SandboxPool(
    root="/dev/shm/submissions",
    size=64
)