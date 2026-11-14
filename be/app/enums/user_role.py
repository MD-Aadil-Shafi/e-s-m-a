from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    HR = "hr"