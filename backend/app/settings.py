from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    data_dir: str = "./data"
    preview_limit: int = 200


settings = Settings()
