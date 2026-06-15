from fastapi.responses import JSONResponse
from fastapi import Request


class APIException(Exception):
    def __init__(self, message: str, status_code = 400) :
        self.message = message
        self.status_code = status_code

async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": False,
            "code": exc.status_code,
            "message": exc.message
            },
    )