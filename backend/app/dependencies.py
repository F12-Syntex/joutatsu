"""Dependency injection providers for FastAPI."""

from typing import AsyncGenerator

from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import async_session_maker


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Provide database session for request."""
    async with async_session_maker() as session:
        yield session
