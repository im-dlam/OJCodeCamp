from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.encoders import jsonable_encoder
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from app.core.deps import get_db, get_current_user
from app.core.crud import get_user_by_username, get_user_by_email
from .models import Users, UserRole
from .schemas import UserPublicSchema, UserSignupSchema, UserLoginSchema, UserLeaderBoard
from app.core.security import get_password, create_access_token, verify_password
from app.core.crud import create_user
from app.core.exceptions import APIException
from sqlalchemy import select

from datetime import timedelta

router = APIRouter(prefix="/users")

def create_token(new_user: Users):
    return create_access_token(
        subject={
            "id": new_user.id,
            "username": new_user.username,
            "role": new_user.role,
            "is_active": new_user.is_active
        },
        expires_timedelta=timedelta(minutes=30),
    )

@router.get("/me")
async def get_user(current_user = Depends(get_current_user)):
    return current_user

@router.post("/signup")
async def singup(user: UserSignupSchema, db: AsyncSession = Depends(get_db)):
    new_user = Users(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        password_hash=get_password(user.password),
        role=UserRole.MEMBER,
    )
    async with db.begin():
        await create_user(user_create=new_user, db=db)

    access_token = create_token(new_user)

    user_info = UserPublicSchema.model_validate(new_user)
    # print(jsonable_encoder(user_info.model_dump()))
    #NOTE: jsonable_encoder : datetime.datetime(2026, 6, 15, 17, 37, 22, 192279) -> 2026-06-15T17:39:59.021748
    resp = JSONResponse(content=jsonable_encoder(user_info.model_dump()), status_code=201)
    resp.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        path="/",
        secure=False,  # TODO: Change to True in prod
        samesite="lax",
        max_age=1800,
    )  # 30min
    return resp

@router.post("/login")
async def login(user: UserLoginSchema, db: AsyncSession = Depends(get_db)):
    if "@" in user.username:
        user_in = await get_user_by_email(email=user.username, db=db)
    else:
        user_in = await get_user_by_username(username=user.username, db=db)
        
    if not user_in:
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED, message="Invalid credentials"
        )

    if not verify_password(user.password, user_in.password_hash):
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED, message="Invalid credentials"
        )
        

    access_token = create_token(user_in)
    user_info = UserPublicSchema.model_validate(user_in)
    response = JSONResponse(content=jsonable_encoder(user_info.model_dump()),)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        path="/",
        secure=False,
        samesite="lax",
    )
    return response

@router.get("/leaderboard")
async def leaderboard(db: AsyncSession = Depends(get_db)):
    
    limit = 10
    query = select(Users).order_by(Users.point).limit(limit)
    exc = await db.execute(query)
    
    top_users = []
    results = exc.scalars().all()
    if results:
        top_users = [UserLeaderBoard.model_validate(d) for d in results]
    
    return {
        "success": True,
        "leaderboard": top_users,
        "limit": limit
    }

@router.post("/logout")
async def logout():
    res = JSONResponse({"success": True})
    res.delete_cookie(
        key="access_token",
        httponly=True,
        path="/",
        secure=False,
        samesite="lax",
    )
    return res