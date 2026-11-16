from pydantic import BaseModel
from datetime import datetime

class LogCreate(BaseModel):
    employee_id: int
    log: str

class LogUpdate(BaseModel):
    employee_id: int
    log: str

class LogResponse(BaseModel):
    id: int
    employee_id: int
    logs: list[str] | None
    updated_at: datetime