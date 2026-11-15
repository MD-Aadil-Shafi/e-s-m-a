from enum import Enum

class EmploymentType(str, Enum):
    FULLTIME = "fulltime"
    PARTTIME = "parttime"
    CONTRACT = "contract"