from typing import Any
from pwdlib import PasswordHash
from datetime import datetime , timedelta, timezone
# import jwt
from app.authorization.TLConfig import TL
from app.core.config import settings

ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
password_hash = PasswordHash.recommended()

def create_access_token(subject: str | Any, expires_timedelta: timedelta) -> str:
    expires = datetime.now(timezone.utc) + expires_timedelta
    # to_encode = {**subject, "exp": expires}
    return TL.create(data=subject, ttl=int(expires.timestamp()))

def create_authorization(subject: str | Any) -> str:
    # to_encode = {**subject, "exp": expires}
    return TL.create_token_micro(data=subject, prefix=settings.PREFIX)

def get_password(pwd: str) -> str:
    return  password_hash.hash(pwd)

def verify_password(plain_pwd, hashed_pwd) -> bool:
    return password_hash.verify(plain_pwd , hashed_pwd)

def to_base36(num: int, min_length: int = 6) -> str:
    if num == 0:
        return "0".rjust(min_length, "0")

    s = ""
    while num:
        num, r = divmod(num, 36)
        s = ALPHABET[r] + s

    return  s.rjust(min_length, "0")

def decode_base36(s: str) -> int:
    if not s.isalnum():
        raise ValueError("Invalid ref_code")
    return int(s.upper(), 36)