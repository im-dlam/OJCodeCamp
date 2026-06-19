from typing import Literal
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, update
from app.modules.auth.models import Users
from app.modules.auth.schemas import UserSignupSchema
from sqlalchemy.exc import IntegrityError
from app.core.exceptions import APIException



async def create_user(*, user_create: Users, db: AsyncSession) -> bool:
    """
    Tạo user mới trong database.
    
    Args:
        user_create: User object cần tạo
        db: Database session
        
    Returns:
        True : tạo thành công
        
    Example:
        >>> user = User(username="dinhlam", email="dinhlam@example.com", password_hash="hash123")
        >>> success = await create_user(user_create=user, db=db)
    """
    db.add(user_create)
    try:
        await db.flush()  # flush sẽ raise lỗi nếu trùng unique
        return True
    except IntegrityError as e:
        msg = str(e.orig).lower()
        if "email" in msg:
            raise APIException(status_code=status.HTTP_400_BAD_REQUEST, message="Email already exists")
        if "username" in msg:
            raise APIException(status_code=status.HTTP_400_BAD_REQUEST, message="Username already exists")
        raise APIException(status_code=status.HTTP_400_BAD_REQUEST, message="Please double check your username or email.")

async def get_user_by_email(*, email: str, db: AsyncSession) -> UserSignupSchema | None:
    """
    Lấy user theo email.
    
    Args:
        email: Email cần tìm
        db: Database session
        
    Returns:
        User object hoặc None nếu không tìm thấy
        
    Example:
        >>> user = await get_user_by_email(email="dinhlam@example.com", db=db)
    """
    result = await db.execute(text("""
                                select *
                                from users
                                where email = :email;
                                """),
                            params={'email':email})
    return result.first()


async def get_user_by_username(*, username: str, db: AsyncSession) -> Users | None:
    """
    Lấy user theo username.
    
    Args:
        username: Username cần tìm
        db: Database session
        
    Returns:
        User object hoặc None nếu không tìm thấy
        
    Example:
        >>> user = await get_user_by_username(username="dinhlam", db=db)
    """
    result = await db.execute(text("""
                                select *
                                from users 
                                where username = :username
                                """),
                            params={'username':username})
    return result.first()

async def get_user_by_id(*, user_id: str, db: AsyncSession) -> Users | None:
    """
    Lấy user theo user id.
    
    Args:
        user_id: id của user cần tìm
        db: Database session
        
    Returns:
        User object hoặc None nếu không tìm thấy
        
    Example:
        >>> user = await get_user_by_id(user_id="uuuuu-wwww-mmmm-wwww", db=db)
    """
    result = await db.execute(text("""
                                select u.*, w.id as wid, w.balance as balance, w.promotion as promotion
                                from users u join wallets w
                                on u.id = w.user_id
                                where u.id = :user_id;
                                """),
                            params={'user_id':user_id})
    return result.first()

async def update_user(*,
                      user_id: str, 
                      key: Literal["password_hash", "full_name", "role", "is_active"],
                      value: str,
                      db: AsyncSession) -> bool:
    """
    Cập nhật thông tin user.
    
    Args:
        username: username của user cần cập nhật
        key: Tên trường cần cập nhật
        value: Giá trị mới
        db: Database session
        
    Returns:
        True nếu cập nhật thành công
        
    Example:
        >>> success = await update_user(user_id="123", key="full_name", value="John Doe", db=db)
    """
    statement = update(Users).where(Users.id == user_id).values({key: value})
    result = await db.execute(statement)
    await db.commit()
    
    return result.rowcount > 0
    
