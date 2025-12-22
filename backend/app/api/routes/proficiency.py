"""User proficiency API routes."""

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.repositories.proficiency_repo import ProficiencyRepository
from app.schemas.proficiency import (
    DifficultyRatingResponse,
    ProficiencyStatsResponse,
    ReaderRecommendationsResponse,
    RecordDifficultyRequest,
    RecordReadingRequest,
    UpdateThresholdsRequest,
)
from app.services.proficiency_service import ProficiencyService

router = APIRouter(prefix="/proficiency", tags=["proficiency"])


@router.get("/stats", response_model=ProficiencyStatsResponse)
async def get_proficiency_stats(
    session: AsyncSession = Depends(get_session),
) -> ProficiencyStatsResponse:
    """Get user proficiency statistics."""
    service = ProficiencyService(session)
    stats = await service.get_stats()

    return ProficiencyStatsResponse(
        level=stats.level,
        total_characters_read=stats.total_characters_read,
        total_tokens_read=stats.total_tokens_read,
        total_lookups=stats.total_lookups,
        total_reading_time_minutes=stats.total_reading_time_minutes,
        lookup_rate=stats.lookup_rate,
        reading_speed=stats.reading_speed,
        easy_ratings=stats.easy_ratings,
        just_right_ratings=stats.just_right_ratings,
        hard_ratings=stats.hard_ratings,
    )


@router.get("/recommendations", response_model=ReaderRecommendationsResponse)
async def get_reader_recommendations(
    session: AsyncSession = Depends(get_session),
) -> ReaderRecommendationsResponse:
    """Get recommended reader settings based on proficiency."""
    service = ProficiencyService(session)
    recommendations = await service.get_reader_recommendations()

    return ReaderRecommendationsResponse(
        show_furigana=recommendations.show_furigana,
        show_meanings=recommendations.show_meanings,
        furigana_threshold=recommendations.furigana_threshold,
        highlight_unknown=recommendations.highlight_unknown,
        suggested_level=recommendations.suggested_level,
    )


@router.post("/record-reading", response_model=ProficiencyStatsResponse)
async def record_reading_session(
    request: RecordReadingRequest,
    session: AsyncSession = Depends(get_session),
) -> ProficiencyStatsResponse:
    """Record metrics from a reading session."""
    service = ProficiencyService(session)
    await service.record_reading_session(
        characters_read=request.characters_read,
        tokens_read=request.tokens_read,
        lookups=request.lookups,
        reading_time_seconds=request.reading_time_seconds,
    )

    # Return updated stats
    stats = await service.get_stats()
    return ProficiencyStatsResponse(
        level=stats.level,
        total_characters_read=stats.total_characters_read,
        total_tokens_read=stats.total_tokens_read,
        total_lookups=stats.total_lookups,
        total_reading_time_minutes=stats.total_reading_time_minutes,
        lookup_rate=stats.lookup_rate,
        reading_speed=stats.reading_speed,
        easy_ratings=stats.easy_ratings,
        just_right_ratings=stats.just_right_ratings,
        hard_ratings=stats.hard_ratings,
    )


@router.post("/record-difficulty")
async def record_difficulty_rating(
    request: RecordDifficultyRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Record difficulty rating for content."""
    service = ProficiencyService(session)
    await service.record_difficulty_rating(
        content_id=request.content_id,
        rating=request.rating,
        feedback=request.feedback,
        chunk_position=request.chunk_position,
    )
    return {"success": True}


@router.get("/difficulty-ratings", response_model=list[DifficultyRatingResponse])
async def get_difficulty_ratings(
    content_id: int | None = None,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
) -> list[DifficultyRatingResponse]:
    """Get difficulty ratings, optionally filtered by content."""
    repo = ProficiencyRepository(session)
    ratings = await repo.get_difficulty_ratings(content_id=content_id, limit=limit)

    return [
        DifficultyRatingResponse(
            id=r.id,
            content_id=r.content_id,
            rating=r.rating,
            feedback=r.feedback,
            chunk_position=r.chunk_position,
            rated_at=r.rated_at,
        )
        for r in ratings
    ]


@router.post("/thresholds", response_model=ProficiencyStatsResponse)
async def update_thresholds(
    request: UpdateThresholdsRequest,
    session: AsyncSession = Depends(get_session),
) -> ProficiencyStatsResponse:
    """Update auto-adjustment thresholds."""
    service = ProficiencyService(session)
    await service.update_thresholds(
        furigana_threshold=request.furigana_threshold,
        meanings_threshold=request.meanings_threshold,
    )

    # Return updated stats
    stats = await service.get_stats()
    return ProficiencyStatsResponse(
        level=stats.level,
        total_characters_read=stats.total_characters_read,
        total_tokens_read=stats.total_tokens_read,
        total_lookups=stats.total_lookups,
        total_reading_time_minutes=stats.total_reading_time_minutes,
        lookup_rate=stats.lookup_rate,
        reading_speed=stats.reading_speed,
        easy_ratings=stats.easy_ratings,
        just_right_ratings=stats.just_right_ratings,
        hard_ratings=stats.hard_ratings,
    )
