from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL:str
    DATABASE_URL_SYNC:str
    SECRET_KEY:str
    ALGORITHM:str="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES:int=720
    REFRESH_TOKEN_EXPIRE_DAYS:int=1
    
    # class config:
    #     env_file = '.env'
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )
        
settings = Settings()