"""Application configuration via pydantic-settings."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = "sqlite:///./data/joutatsu.db"

    # Data directories
    data_dir: Path = Path("./data")
    audio_cache_dir: Path = Path("./data/audio_cache")
    content_dir: Path = Path("./data/content")
    jmdict_path: Path = Path("./data/jmdict")
    pitch_data_path: Path = Path("./data/pitch/kanjium.tsv")

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # Logging
    log_level: str = "INFO"

    # Frontend static files (for production)
    static_dir: Path = Path("../frontend/out")

    def ensure_directories(self) -> None:
        """Create required directories if they don't exist."""
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.audio_cache_dir.mkdir(parents=True, exist_ok=True)
        self.content_dir.mkdir(parents=True, exist_ok=True)


settings = Settings()
