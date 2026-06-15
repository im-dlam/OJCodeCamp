from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.exceptions import APIException , api_exception_handler
from app.core.db import Base, engine
from app.api.api import api_router

from app.modules.auth.models import *
from app.modules.problems.models import * 
from app.modules.submissions.models import * 
from app.modules.bookmarks.models import *
from app.modules.discussions.models import *

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Create DB OK")
    
    yield 
    
    await engine.dispose()
    print("Close DB OK")
    
app = FastAPI(lifespan=lifespan)

app.add_exception_handler(APIException, api_exception_handler)

app.include_router(api_router, prefix="/api")
