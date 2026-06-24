from app.core.db import AsyncSessionLocal
from .redis import redis_client
from app.core.config import settings
from app.core.exceptions import APIException
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, Request
from app.authorization.TLConfig import TL
from app.core.crud import get_user_by_username
from app.modules.auth.schemas import UserPublicSchema

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
            
async def get_redis():
    yield redis_client
    
    
async def get_current_user(
    request: Request, 
    db: AsyncSession = Depends(get_db)
) -> UserPublicSchema:
    
    auth_header = request.headers.get("Authorization")
    token = (
        auth_header.split(" ")[1] if auth_header and auth_header.startswith("OAuth ") 
        else request.cookies.get("access_token")
    )

    if not token:
        raise APIException(status_code=401, message="Missing authentication token")
    try:
        payload = (
            TL.decode_token_micro(token, settings.PREFIX) if token.startswith(settings.PREFIX)
            else TL.verify(token)
        )
    except:
        raise APIException(status_code=401, message="Token is invalid, expired, or malformed")
        

    if not payload or not (username := payload.get("username")):
        raise APIException(status_code=401, message="Token is invalid, expired, or malformed")
    
        
    user = await get_user_by_username(username=username, db=db)
    if not user:
        raise APIException(status_code=404, message="User not found")
    
    if not user.is_active:
        raise APIException(status_code=403, message="User account is disabled")
        
    
    return UserPublicSchema(
        id=user.id,
        username=user.username,
        email=user.email,
        point=user.point,
        full_name=user.full_name,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )