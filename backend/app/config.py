"""TrustLabel application configuration."""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration."""

    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    SQLALCHEMY_DATABASE_URI: str = os.environ.get("DATABASE_URL", "sqlite:///trustlabel.db")
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False

    TESSERACT_CMD: str = os.environ.get("TESSERACT_CMD", "tesseract")
    UPLOAD_FOLDER: str = os.environ.get("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16 MB

    EXTERNAL_LOOKUP_URL: str = os.environ.get("EXTERNAL_LOOKUP_URL", "")
    EXTERNAL_LOOKUP_TIMEOUT: int = int(os.environ.get("EXTERNAL_LOOKUP_TIMEOUT", "5"))

    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG: bool = True


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG: bool = False


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}


def get_config():
    """Return configuration class based on FLASK_ENV."""
    env = os.environ.get("FLASK_ENV", "development")
    return config_map.get(env, DevelopmentConfig)
