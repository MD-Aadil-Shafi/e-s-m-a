from pydantic import (
    BaseModel, EmailStr, Field, create_model
) 
from datetime import date

class EmployeeCreate(BaseModel):
    firstname: str = Field(min_length=1, max_length=12)
    lastname: str = Field(min_length=1, max_length=12)
    email: EmailStr
    country: str
    state: str
    city: str
    zipcode: str
    address: str
    phone_number: str
    department: str
    designation: str
    joining_date: date
    
    
#for optional fields (dynamic but pylance type check error)
# EmployeeUpdate = create_model(
#     "EmployeeUpdate",
#     **{
#         field_name: (field.annotation | None, None)
#         for field_name, field in EmployeeCreate.model_fields.items()
#     }
# )  
class EmployeeUpdate(BaseModel):
    firstname: str | None = Field(default=None, min_length=1, max_length=12)
    lastname: str | None = Field(default=None, min_length=1, max_length=12)
    email: EmailStr | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    zipcode: str | None = None
    address: str | None = None
    phone_number: str | None = None
    department: str | None = None
    designation: str | None = None
    joining_date: date | None = None
    
    
class EmployeeResponse(EmployeeCreate):
    id: int
    created_at: date
    added_by: str
    
    class Config: 
        from_attributes = True
