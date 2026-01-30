import sys
from pathlib import Path

from pydantic_settings import BaseSettings


def _default_data_dir() -> str:
    if getattr(sys, "frozen", False):
        base_dir = Path.home() / "Library" / "Application Support" / "firstNx"
        return str(base_dir / "data")
    return str(Path(__file__).resolve().parents[2] / "data")


class Settings(BaseSettings):
    data_dir: str = _default_data_dir()
    preview_limit: int = 200


settings = Settings()
