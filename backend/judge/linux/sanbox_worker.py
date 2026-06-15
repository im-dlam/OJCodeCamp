from sanbox import sandbox_pool
import asyncio
# await sandbox_pool.init()

async def main():
    await sandbox_pool.init()
    
asyncio.run(main())