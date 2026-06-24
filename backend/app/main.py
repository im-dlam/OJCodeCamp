from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.exceptions import APIException , api_exception_handler
from app.core.db import Base, engine
from app.api.api import api_router
from app.core.config import settings
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
    


if settings.DEPLOY == "production":
    _docs_url = None
    _redoc_url = None
    _openapi_url = None
    _origins = [settings.BASE_URL]
else:
    _docs_url = "/docs"
    _redoc_url = "/redoc"
    _openapi_url = "/openapi.json"
    _origins = [
        "http://localhost:5173",
        "http://192.168.1.4:5173",
        "http://192.168.1.4:8000"
    ]

app = FastAPI(
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    openapi_url=_openapi_url,
    redirect_slashes=False,
    lifespan=lifespan
)
app.add_exception_handler(APIException, api_exception_handler) # Thêm custom để Raise status
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.add_exception_handler(APIException, api_exception_handler)

app.include_router(api_router, prefix="/api")


