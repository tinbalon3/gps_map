from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    AZURE_MAPS_KEY: str 
    AZURE_MAPS_CLIENT_ID: str
    AZURE_MAPS_BASE_URL: str = "https://atlas.microsoft.com"
    
    class Config:
        env_file = ".env"

# Create settings instance
settings = Settings()

# Export settings for use in other modules
def get_settings():
    return settings