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
    
    
#for optional fields
EmployeeUpdate = create_model(
    "EmployeeUpdate",
    **{
        field_name: (field.annotation | None, None)
        for field_name, field in EmployeeCreate.model_fields.items()
    }
)  
    
    
class EmployeeResponse(EmployeeCreate):
    id: int
    created_at: date
    
    class Config: 
        from_attributes = True
