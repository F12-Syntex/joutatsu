"""Database connection and session management."""

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Convert sqlite URL to async version
database_url = settings.database_url
if database_url.startswith("sqlite:///"):
    database_url = database_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

engine = create_async_engine(
    database_url,
    echo=settings.debug,
    future=True,
)

async_session_maker = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> None:
    """Initialize database and create tables."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def close_db() -> None:
    """Close database connection."""
    await engine.dispose()


async def get_session() -> AsyncSession:
    """Dependency to get database session."""
    async with async_session_maker() as session:
        yield session
