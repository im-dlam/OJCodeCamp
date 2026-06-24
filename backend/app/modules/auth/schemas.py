from pydantic import BaseModel, Field, field_validator, EmailStr, model_validator
from typing import Annotated
from datetime import datetime


class UserSignupSchema(BaseModel):
    username: Annotated[
        str, Field(min_length=5, max_length=18, pattern=r"^[a-z0-9_]+$")
    ]
    email: EmailStr 
    password: Annotated[
        str, Field(min_length=5, description="Mật khẩu tối thiểu 5 ký tự")
    ]
    full_name: Annotated[
        str, Field(min_length=1, max_length=50, description="Họ và tên")
    ]

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.lower().strip()

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower().strip()

    @field_validator("full_name", mode="before")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        return " ".join(value.strip().split())

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "username": "lamdinh",
                "email": "user@example.com",
                "password": "12345abc",
                "full_name": "Le Dinh Lam",
            }
        }

class UserPublicSchema(BaseModel):
    id: int
    username: str 
    email: str 
    point: int 
    full_name: str
    role: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
    
    @field_validator("role",mode="before")
    @classmethod
    def to_upper(cls, value: str) -> str:
        return value.upper()


class UserLoginSchema(BaseModel):
    username: str
    password: Annotated[str, Field(min_length=5, max_length=18)]

    @model_validator(mode="after")
    def check_username_or_email(self):
        if not self.username:
            raise ValueError("You must enter your username or email address.")
        return self
    
    class Config:
        from_attributes = True
        
        
class UserLeaderBoard(BaseModel):
    username: str
    point: float
    full_name: str
    
    class Config:
        from_attributes = True