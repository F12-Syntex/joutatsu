"""Session repository for reading session data access."""

from datetime import datetime
from typing import Optional, Sequence

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.progress import SessionLookup
from app.models.session import ReadingSession
from app.models.content import Content
from app.repositories.base import BaseRepository


class SessionRepository(BaseRepository[ReadingSession]):
    """Repository for reading session data access."""

    def __init__(self, session: AsyncSession):
        super().__init__(ReadingSession, session)

    async def start_session(
        self, content_id: int, chunk_position: int = 0
    ) -> ReadingSession:
        """Start a new reading session."""
        reading_session = ReadingSession(
            content_id=content_id,
            chunk_position=chunk_position,
        )
        self.session.add(reading_session)
        await self.session.commit()
        await self.session.refresh(reading_session)
        return reading_session

    async def end_session(
        self,
        session_id: int,
        tokens_read: int = 0,
        lookups_count: int = 0,
        chunk_position: int = 0,
    ) -> Optional[ReadingSession]:
        """End a reading session."""
        reading_session = await self.get(session_id)
        if reading_session:
            reading_session.ended_at = datetime.utcnow()
            reading_session.tokens_read = tokens_read
            reading_session.lookups_count = lookups_count
            reading_session.chunk_position = chunk_position
            self.session.add(reading_session)
            await self.session.commit()
            await self.session.refresh(reading_session)
        return reading_session

    async def update_progress(
        self,
        session_id: int,
        tokens_read: int,
        lookups_count: int,
        chunk_position: int,
    ) -> Optional[ReadingSession]:
        """Update session progress without ending it."""
        reading_session = await self.get(session_id)
        if reading_session:
            reading_session.tokens_read = tokens_read
            reading_session.lookups_count = lookups_count
            reading_session.chunk_position = chunk_position
            self.session.add(reading_session)
            await self.session.commit()
            await self.session.refresh(reading_session)
        return reading_session

    async def get_active_session(
        self, content_id: int
    ) -> Optional[ReadingSession]:
        """Get active (not ended) session for content."""
        statement = (
            select(ReadingSession)
            .where(
                ReadingSession.content_id == content_id,
                ReadingSession.ended_at.is_(None),
            )
            .order_by(ReadingSession.started_at.desc())
        )
        result = await self.session.exec(statement)
        return result.first()

    async def get_sessions_for_content(
        self, content_id: int, limit: int = 20
    ) -> Sequence[ReadingSession]:
        """Get all sessions for a content item."""
        statement = (
            select(ReadingSession)
            .where(ReadingSession.content_id == content_id)
            .order_by(ReadingSession.started_at.desc())
            .limit(limit)
        )
        result = await self.session.exec(statement)
        return result.all()

    async def get_recent_sessions(
        self, limit: int = 20
    ) -> Sequence[tuple[ReadingSession, Content]]:
        """Get recent sessions with content info."""
        statement = (
            select(ReadingSession, Content)
            .join(Content, Content.id == ReadingSession.content_id)
            .order_by(ReadingSession.started_at.desc())
            .limit(limit)
        )
        result = await self.session.exec(statement)
        return result.all()

    async def get_session_stats(self) -> dict:
        """Get aggregate session statistics."""
        # Total sessions
        total_stmt = select(func.count(ReadingSession.id))
        total_result = await self.session.exec(total_stmt)
        total_sessions = total_result.one()

        # Completed sessions
        completed_stmt = select(func.count(ReadingSession.id)).where(
            ReadingSession.ended_at.isnot(None)
        )
        completed_result = await self.session.exec(completed_stmt)
        completed_sessions = completed_result.one()

        # Total tokens read
        tokens_stmt = select(func.sum(ReadingSession.tokens_read))
        tokens_result = await self.session.exec(tokens_stmt)
        total_tokens = tokens_result.one() or 0

        # Total lookups
        lookups_stmt = select(func.sum(ReadingSession.lookups_count))
        lookups_result = await self.session.exec(lookups_stmt)
        total_lookups = lookups_result.one() or 0

        return {
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "total_tokens_read": total_tokens,
            "total_lookups": total_lookups,
        }


class SessionLookupRepository(BaseRepository[SessionLookup]):
    """Repository for session lookup data access."""

    def __init__(self, session: AsyncSession):
        super().__init__(SessionLookup, session)

    async def record_lookup(
        self,
        vocabulary_id: int,
        session_id: int,
        context: Optional[str] = None,
    ) -> SessionLookup:
        """Record a vocabulary lookup during a session."""
        lookup = SessionLookup(
            vocabulary_id=vocabulary_id,
            session_id=session_id,
            context=context,
        )
        self.session.add(lookup)
        await self.session.commit()
        await self.session.refresh(lookup)
        return lookup

    async def get_lookups_for_session(
        self, session_id: int
    ) -> Sequence[SessionLookup]:
        """Get all lookups for a session."""
        statement = (
            select(SessionLookup)
            .where(SessionLookup.session_id == session_id)
            .order_by(SessionLookup.looked_up_at.desc())
        )
        result = await self.session.exec(statement)
        return result.all()

    async def get_lookup_count_for_vocabulary(
        self, vocabulary_id: int
    ) -> int:
        """Get total lookup count for a vocabulary item."""
        statement = select(func.count(SessionLookup.id)).where(
            SessionLookup.vocabulary_id == vocabulary_id
        )
        result = await self.session.exec(statement)
        return result.one()
