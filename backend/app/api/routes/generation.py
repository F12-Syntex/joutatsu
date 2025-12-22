"""Text generation API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.schemas.generation import (
    GenerateTextRequest,
    GenerateTextResponse,
    ProficiencySettingsRequest,
    ProficiencySettingsResponse,
)
from app.services.proficiency_service import ProficiencyService
from app.services.text_generation_service import GenerationParams, TextGenerationService

router = APIRouter(prefix="/generation", tags=["generation"])

DIFFICULTY_LEVELS = {
    (0.0, 0.2): "Beginner",
    (0.2, 0.4): "Elementary",
    (0.4, 0.6): "Intermediate",
    (0.6, 0.8): "Upper Intermediate",
    (0.8, 1.0): "Advanced",
}


def _get_level_name(difficulty: float) -> str:
    """Get human-readable level name."""
    for (low, high), name in DIFFICULTY_LEVELS.items():
        if low <= difficulty < high:
            return name
    return "Advanced"


@router.post("/text", response_model=GenerateTextResponse)
async def generate_text(
    request: GenerateTextRequest,
    session: AsyncSession = Depends(get_session),
) -> GenerateTextResponse:
    """Generate Japanese text at the specified or user's difficulty level."""
    gen_service = TextGenerationService()

    try:
        if request.use_user_proficiency:
            # Get user's proficiency and generate at their level
            prof_service = ProficiencyService(session)
            stats = await prof_service.get_stats()

            result = await gen_service.generate_at_user_level(
                kanji_proficiency=stats.kanji_proficiency,
                lexical_proficiency=stats.lexical_proficiency,
                grammar_proficiency=stats.grammar_proficiency,
                topic=request.topic,
                genre=request.genre,
                length=request.length,
                challenge_level=request.challenge_level,
            )
        else:
            # Use explicitly provided difficulty levels
            params = GenerationParams(
                topic=request.topic,
                genre=request.genre,
                length=request.length,
                kanji_difficulty=request.kanji_difficulty or 0.3,
                lexical_difficulty=request.lexical_difficulty or 0.3,
                grammar_difficulty=request.grammar_difficulty or 0.3,
            )
            result = await gen_service.generate_text(params)

        return GenerateTextResponse(
            text=result.text,
            topic=result.topic,
            genre=result.genre,
            target_difficulty=result.target_difficulty,
            difficulty_level=_get_level_name(result.target_difficulty),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@router.get("/settings", response_model=ProficiencySettingsResponse)
async def get_proficiency_settings(
    session: AsyncSession = Depends(get_session),
) -> ProficiencySettingsResponse:
    """Get current proficiency-related settings."""
    prof_service = ProficiencyService(session)
    stats = await prof_service.get_stats()

    return ProficiencySettingsResponse(
        auto_adjust_furigana=True,  # TODO: Add to user settings model
        auto_adjust_meanings=True,
        target_kanji_difficulty=stats.target_kanji_difficulty,
        target_lexical_difficulty=stats.target_lexical_difficulty,
        target_grammar_difficulty=stats.target_grammar_difficulty,
        challenge_level=0.1,
        kanji_proficiency=stats.kanji_proficiency,
        lexical_proficiency=stats.lexical_proficiency,
        grammar_proficiency=stats.grammar_proficiency,
        reading_proficiency=stats.reading_proficiency,
    )


@router.post("/settings", response_model=ProficiencySettingsResponse)
async def update_proficiency_settings(
    request: ProficiencySettingsRequest,
    session: AsyncSession = Depends(get_session),
) -> ProficiencySettingsResponse:
    """Update proficiency-related settings."""
    prof_service = ProficiencyService(session)

    # Update target difficulties if provided
    if any([
        request.target_kanji_difficulty is not None,
        request.target_lexical_difficulty is not None,
        request.target_grammar_difficulty is not None,
    ]):
        await prof_service.update_target_difficulties(
            kanji=request.target_kanji_difficulty,
            lexical=request.target_lexical_difficulty,
            grammar=request.target_grammar_difficulty,
        )

    # Get updated stats
    stats = await prof_service.get_stats()

    return ProficiencySettingsResponse(
        auto_adjust_furigana=request.auto_adjust_furigana if request.auto_adjust_furigana is not None else True,
        auto_adjust_meanings=request.auto_adjust_meanings if request.auto_adjust_meanings is not None else True,
        target_kanji_difficulty=stats.target_kanji_difficulty,
        target_lexical_difficulty=stats.target_lexical_difficulty,
        target_grammar_difficulty=stats.target_grammar_difficulty,
        challenge_level=request.challenge_level or 0.1,
        kanji_proficiency=stats.kanji_proficiency,
        lexical_proficiency=stats.lexical_proficiency,
        grammar_proficiency=stats.grammar_proficiency,
        reading_proficiency=stats.reading_proficiency,
    )
