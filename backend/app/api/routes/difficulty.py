"""Difficulty analysis API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.schemas.difficulty import (
    DifficultyAnalysisRequest,
    DifficultyMetricsResponse,
    ContentDifficultyRequest,
)
from app.services.difficulty_service import DifficultyAnalysisService
from app.services.content_service import ContentService

router = APIRouter(prefix="/difficulty", tags=["difficulty"])


@router.post("/analyze", response_model=DifficultyMetricsResponse)
async def analyze_text_difficulty(
    request: DifficultyAnalysisRequest,
) -> DifficultyMetricsResponse:
    """Analyze difficulty metrics for given text."""
    service = DifficultyAnalysisService()
    metrics = await service.analyze_text(request.text)

    return DifficultyMetricsResponse(
        overall_difficulty=metrics.overall_difficulty,
        kanji_difficulty=metrics.kanji_difficulty,
        lexical_difficulty=metrics.lexical_difficulty,
        grammar_complexity=metrics.grammar_complexity,
        sentence_complexity=metrics.sentence_complexity,
        difficulty_level=metrics.difficulty_level,
        total_characters=metrics.total_characters,
        kanji_count=metrics.kanji_count,
        unique_kanji=metrics.unique_kanji,
        avg_sentence_length=metrics.avg_sentence_length,
    )


@router.post("/content", response_model=DifficultyMetricsResponse)
async def analyze_content_difficulty(
    request: ContentDifficultyRequest,
    session: AsyncSession = Depends(get_session),
) -> DifficultyMetricsResponse:
    """Analyze difficulty for stored content."""
    content_service = ContentService(session)

    if request.chunk_index is not None:
        chunk = await content_service.get_chunk(request.content_id, request.chunk_index)
        if not chunk:
            raise HTTPException(status_code=404, detail="Chunk not found")
        text = chunk.raw_text
    else:
        content, chunks = await content_service.get_content_with_chunks(request.content_id)
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")
        text = " ".join(c.raw_text for c in chunks)

    difficulty_service = DifficultyAnalysisService()
    metrics = await difficulty_service.analyze_text(text)

    return DifficultyMetricsResponse(
        overall_difficulty=metrics.overall_difficulty,
        kanji_difficulty=metrics.kanji_difficulty,
        lexical_difficulty=metrics.lexical_difficulty,
        grammar_complexity=metrics.grammar_complexity,
        sentence_complexity=metrics.sentence_complexity,
        difficulty_level=metrics.difficulty_level,
        total_characters=metrics.total_characters,
        kanji_count=metrics.kanji_count,
        unique_kanji=metrics.unique_kanji,
        avg_sentence_length=metrics.avg_sentence_length,
    )
