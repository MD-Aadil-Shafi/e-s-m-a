import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException
):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": str(exc.detail),
            "data": None,
        },
        headers=exc.headers,
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation failed",
            "errors": jsonable_encoder(exc.errors()),
            "data": None,
        },
    )


async def rate_limit_exception_handler(
    request: Request,
    exc: RateLimitExceeded
):
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "message": "Too many requests. Please try again later.",
            "data": None,
        },
    )

async def database_integrity_handler(
    request: Request,
    exc: IntegrityError
):
    error_message = str(exc.orig).lower()

    if "unique constraint" in error_message or "duplicate key" in error_message:
        if "email" in error_message:
            message = "Email already exists"
        else:
            message = "Duplicate record already exists"

        return JSONResponse(
            status_code=409,
            content={
                "success": False,
                "message": message,
                "data": None,
            },
        )

    if "foreign key constraint" in error_message:
        return JSONResponse(
            status_code=409,
            content={
                "success": False,
                "message": "Referenced record does not exist or cannot be deleted",
                "data": None,
            },
        )

    logger.exception(
        "Database integrity error: %s %s",
        request.method,
        request.url.path,
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Database integrity error",
            "data": None,
        },
    )

async def global_exception_handler(
    request: Request,
    exc: Exception
):
    logger.exception(
        "Unhandled exception: %s %s",
        request.method,
        request.url.path,
        exc_info=exc,
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "data": None,
        },
    )