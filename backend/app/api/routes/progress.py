"""Progress and scoring API routes."""

from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.schemas.progress import (
    ProgressSummaryResponse,
    RecordLookupRequest,
    RecordReadRequest,
    ScoreUpdateResponse,
    VocabularyScoreResponse,
    WeakVocabularyResponse,
)
from app.services.scoring_service import ScoringService

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/summary", response_model=ProgressSummaryResponse)
async def get_progress_summary(
    session: AsyncSession = Depends(get_session),
) -> ProgressSummaryResponse:
    """Get overall progress summary."""
    service = ScoringService(session)
    summary = await service.get_progress_summary()

    return ProgressSummaryResponse(
        total_vocabulary=summary["total_vocabulary"],
        known_words=summary["known_words"],
        learning_words=summary["learning_words"],
        average_score=summary["average_score"],
        mastery_percentage=summary["mastery_percentage"],
        total_lookups=summary["total_lookups"],
        total_words_seen=summary["total_words_seen"],
    )


@router.get("/weakest", response_model=WeakVocabularyResponse)
async def get_weakest_vocabulary(
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
) -> WeakVocabularyResponse:
    """Get vocabulary items with lowest scores."""
    service = ScoringService(session)
    items = await service.get_weakest_vocabulary(limit)

    responses = [
        VocabularyScoreResponse(
            vocabulary_id=score.vocabulary_id,
            dictionary_form=vocab.dictionary_form,
            surface=vocab.surface,
            reading=vocab.reading,
            score=score.score,
            times_seen=score.times_seen,
            times_looked_up=score.times_looked_up,
            consecutive_correct=score.consecutive_correct,
            last_seen=score.last_seen,
        )
        for score, vocab in items
    ]

    return WeakVocabularyResponse(items=responses, total=len(responses))


@router.post("/record-lookup", response_model=ScoreUpdateResponse)
async def record_lookup(
    request: RecordLookupRequest,
    session: AsyncSession = Depends(get_session),
) -> ScoreUpdateResponse:
    """Record that a word was looked up (decreases score)."""
    service = ScoringService(session)
    update = await service.record_lookup(request.dictionary_form)

    return ScoreUpdateResponse(
        vocabulary_id=update.vocabulary_id,
        old_score=update.old_score,
        new_score=update.new_score,
        times_seen=update.times_seen,
        times_looked_up=update.times_looked_up,
        consecutive_correct=update.consecutive_correct,
    )


@router.post("/record-read", response_model=list[ScoreUpdateResponse])
async def record_read(
    request: RecordReadRequest,
    session: AsyncSession = Depends(get_session),
) -> list[ScoreUpdateResponse]:
    """Record words read, some with lookups."""
    service = ScoringService(session)
    updates = await service.record_batch_read(
        request.dictionary_forms,
        set(request.looked_up_forms),
    )

    return [
        ScoreUpdateResponse(
            vocabulary_id=u.vocabulary_id,
            old_score=u.old_score,
            new_score=u.new_score,
            times_seen=u.times_seen,
            times_looked_up=u.times_looked_up,
            consecutive_correct=u.consecutive_correct,
        )
        for u in updates
    ]


@router.get("/score", response_model=float)
async def get_overall_score(
    session: AsyncSession = Depends(get_session),
) -> float:
    """Get overall mastery score (average of all vocabulary)."""
    service = ScoringService(session)
    return await service.get_overall_score()
