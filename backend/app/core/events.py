"""Application startup and shutdown event handlers."""

from app.config import settings
from app.core.logging import get_logger, setup_logging

logger = get_logger(__name__)


async def on_startup() -> None:
    """Execute on application startup."""
    setup_logging()
    settings.ensure_directories()
    logger.info("Joutatsu backend starting up...")
    logger.info(f"Database: {settings.database_url}")
    logger.info(f"Data directory: {settings.data_dir}")


async def on_shutdown() -> None:
    """Execute on application shutdown."""
    logger.info("Joutatsu backend shutting down...")
