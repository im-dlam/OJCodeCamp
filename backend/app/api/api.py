from fastapi import  APIRouter

from app.modules.problems import router as problems
from app.modules.submissions import router as submissions
from app.modules.auth import router as auth

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(problems.router)
api_router.include_router(submissions.router)
