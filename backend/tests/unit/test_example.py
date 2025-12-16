"""Example unit tests."""

from app.config import Settings


def test_settings_defaults() -> None:
    """Test that settings have sensible defaults."""
    settings = Settings()
    assert settings.debug is False
    assert settings.host == "0.0.0.0"
    assert settings.port == 8000


def test_settings_database_url() -> None:
    """Test database URL configuration."""
    settings = Settings()
    assert "joutatsu.db" in settings.database_url
