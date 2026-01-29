from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    data_dir: str = str(Path(__file__).resolve().parents[2] / "data")
    preview_limit: int = 200


settings = Settings()
