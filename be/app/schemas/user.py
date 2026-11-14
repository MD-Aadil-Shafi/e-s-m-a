from pydantic import (
    BaseModel, EmailStr, Field, field_validator,
    model_validator
) 
from typing import Optional
import re
from uuid import UUID

class UserCreate(BaseModel):
    email: EmailStr
    firstname: str
    lastname: str
    password: str = Field(..., min_length=6, max_length=30)
    country_code: str | None = Field(None, max_length=6)
    phone_number: str | None = Field(None, min_length=10, max_length=10)
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, value:str):
        if not re.search(r"[A-Za-z]", value):
            raise ValueError("Password must contain at least one letter")

        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one number")

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Password must contain at least one special character")

        return value
    
    @field_validator("country_code")
    @classmethod
    def validate_country_code(cls, v):
        if v is None:
            return v
        if not re.fullmatch(r"\+\d{1,4}", v):
            raise ValueError("Country code must be like +91, +1, +971")
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v):
        if v is None:
            return v
        if not re.fullmatch(r"\d{10}", v):
            raise ValueError("Phone number must be exactly 10 digits")
        return v


    @model_validator(mode="after")
    def validate_phone_fields(self):
        if (self.country_code and not self.phone_number) or (
            self.phone_number and not self.country_code
        ):
            raise ValueError(
                "Both country_code and phone_number must be provided together"
            )
        return self
    

class UserUpdate(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    avatar: Optional[str] = None
    country_code: str | None = Field(None, max_length=6)
    phone_number: str | None = Field(None, min_length=10, max_length=10)
    
    @field_validator("country_code")
    @classmethod
    def validate_country_code(cls, v):
        if v is None:
            return v
        if not re.fullmatch(r"\+\d{1,4}", v):
            raise ValueError("Country code must be like +91, +1, +971")
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v):
        if v is None:
            return v
        if not re.fullmatch(r"\d{10}", v):
            raise ValueError("Phone number must be exactly 10 digits")
        return v

    @model_validator(mode="after")
    def validate_phone_pair(self):
        cc_provided = self.country_code is not None
        pn_provided = self.phone_number is not None

        if cc_provided ^ pn_provided:  # XOR
            raise ValueError(
                "Both country_code and phone_number must be provided together when updating"
            )

        return self
    
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=30)
     
    @field_validator("password")
    @classmethod
    def validate_password(cls, value:str):
        if not re.search(r"[A-Za-z]", value):
            raise ValueError("Password must contain at least one letter")

        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one number")

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Password must contain at least one special character")

        return value
    

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    firstname: str 
    lastname: str 
    avatar: Optional[str] = None
    country_code: Optional[str] = None
    phone_number: Optional[str] = None
    role: str
    
    class Config: 
        from_attributes = True
