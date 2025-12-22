"""Reading session API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.repositories.session_repo import SessionRepository
from app.schemas.session import (
    EndSessionRequest,
    SessionHistoryResponse,
    SessionResponse,
    SessionStatsResponse,
    SessionWithContentResponse,
    StartSessionRequest,
    UpdateProgressRequest,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _session_to_response(session) -> SessionResponse:
    """Convert ReadingSession model to response."""
    return SessionResponse(
        id=session.id,
        content_id=session.content_id,
        started_at=session.started_at,
        ended_at=session.ended_at,
        tokens_read=session.tokens_read,
        lookups_count=session.lookups_count,
        chunk_position=session.chunk_position,
    )


@router.post("/start", response_model=SessionResponse)
async def start_session(
    request: StartSessionRequest,
    session: AsyncSession = Depends(get_session),
) -> SessionResponse:
    """Start a new reading session."""
    repo = SessionRepository(session)
    reading_session = await repo.start_session(
        content_id=request.content_id,
        chunk_position=request.chunk_position,
    )
    return _session_to_response(reading_session)


# Static routes must come BEFORE dynamic /{session_id} routes
@router.get("/history", response_model=SessionHistoryResponse)
async def get_session_history(
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
) -> SessionHistoryResponse:
    """Get recent session history with content info."""
    repo = SessionRepository(session)
    sessions = await repo.get_recent_sessions(limit)

    responses = [
        SessionWithContentResponse(
            id=s.id,
            content_id=s.content_id,
            content_title=c.title,
            started_at=s.started_at,
            ended_at=s.ended_at,
            tokens_read=s.tokens_read,
            lookups_count=s.lookups_count,
            chunk_position=s.chunk_position,
        )
        for s, c in sessions
    ]

    return SessionHistoryResponse(sessions=responses, total=len(responses))


@router.get("/stats", response_model=SessionStatsResponse)
async def get_session_stats(
    session: AsyncSession = Depends(get_session),
) -> SessionStatsResponse:
    """Get aggregate session statistics."""
    repo = SessionRepository(session)
    stats = await repo.get_session_stats()

    return SessionStatsResponse(
        total_sessions=stats["total_sessions"],
        completed_sessions=stats["completed_sessions"],
        total_tokens_read=stats["total_tokens_read"],
        total_lookups=stats["total_lookups"],
    )


@router.get("/content/{content_id}/active", response_model=SessionResponse)
async def get_active_session(
    content_id: int,
    session: AsyncSession = Depends(get_session),
) -> SessionResponse:
    """Get active session for content (for resuming)."""
    repo = SessionRepository(session)
    reading_session = await repo.get_active_session(content_id)

    if not reading_session:
        raise HTTPException(status_code=404, detail="No active session")

    return _session_to_response(reading_session)


# Dynamic routes must come AFTER static routes
@router.get("/{session_id}", response_model=SessionResponse)
async def get_session_by_id(
    session_id: int,
    session: AsyncSession = Depends(get_session),
) -> SessionResponse:
    """Get a session by ID."""
    repo = SessionRepository(session)
    reading_session = await repo.get(session_id)

    if not reading_session:
        raise HTTPException(status_code=404, detail="Session not found")

    return _session_to_response(reading_session)


@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: int,
    request: EndSessionRequest,
    session: AsyncSession = Depends(get_session),
) -> SessionResponse:
    """End a reading session."""
    repo = SessionRepository(session)
    reading_session = await repo.end_session(
        session_id=session_id,
        tokens_read=request.tokens_read,
        lookups_count=request.lookups_count,
        chunk_position=request.chunk_position,
    )

    if not reading_session:
        raise HTTPException(status_code=404, detail="Session not found")

    return _session_to_response(reading_session)


@router.post("/{session_id}/progress", response_model=SessionResponse)
async def update_progress(
    session_id: int,
    request: UpdateProgressRequest,
    session: AsyncSession = Depends(get_session),
) -> SessionResponse:
    """Update session progress without ending it."""
    repo = SessionRepository(session)
    reading_session = await repo.update_progress(
        session_id=session_id,
        tokens_read=request.tokens_read,
        lookups_count=request.lookups_count,
        chunk_position=request.chunk_position,
    )

    if not reading_session:
        raise HTTPException(status_code=404, detail="Session not found")

    return _session_to_response(reading_session)
