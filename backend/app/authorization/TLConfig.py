from app.authorization.ltoken import TokenConfig, TokenL
from app.core.config import settings

TLConfig = TokenConfig(prefix="EAAAAAYsX36", algorithm=settings.ALGORITHM)
TL = TokenL(secret_key=settings.SECRET_KEY, config=TLConfig)

# print(TL.create({'ok':2}, 12000))