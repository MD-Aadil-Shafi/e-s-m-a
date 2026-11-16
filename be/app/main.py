import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import IntegrityError
from app.core.limiter import limiter
from app.core.exceptions import (
    http_exception_handler,
    validation_exception_handler,
    rate_limit_exception_handler,
    global_exception_handler,
    database_integrity_handler,
)
# from app import models
from app.routes.auth import router as auth_router
from app.routes.employee import router as employee_router
from app.routes.salary import router as salary_router


logging.basicConfig(level=logging.INFO)

app = FastAPI(title = "Employee Salary Management")

origins = [
    "*",
    # "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SlowAPI configuration
app.state.limiter = limiter

# Global exception handlers
app.add_exception_handler(
    StarletteHTTPException,
    http_exception_handler,
)

app.add_exception_handler(
    RateLimitExceeded,
    rate_limit_exception_handler,
)

app.add_exception_handler(
    422,
    validation_exception_handler,
)

app.add_exception_handler(
    IntegrityError,
    database_integrity_handler,
)

app.add_exception_handler(
    Exception,
    global_exception_handler,
)

@app.get("/api/v1/test")
async def test()->dict:
    return {"message": "test route working fine."}

app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(salary_router)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)