"""Dictionary API routes."""

from fastapi import APIRouter, Depends, Query

from app.schemas.dictionary import LookupResponse, PitchLookupResponse
from app.services.dictionary_service import DictionaryService

router = APIRouter(prefix="/dictionary", tags=["dictionary"])


def get_dictionary_service() -> DictionaryService:
    """Dependency to get DictionaryService singleton."""
    return DictionaryService.get_instance()


@router.get("/lookup", response_model=LookupResponse)
async def lookup(
    query: str = Query(..., min_length=1, description="Word to look up"),
    limit: int = Query(10, ge=1, le=50, description="Max results"),
    service: DictionaryService = Depends(get_dictionary_service),
) -> LookupResponse:
    """
    Look up a word in JMdict dictionary.

    - **query**: Word to look up (kanji or kana)
    - **limit**: Maximum number of entries to return (1-50)

    Returns dictionary entries with readings, senses, and pitch accent.
    """
    return service.lookup(query, limit=limit)


@router.get("/pitch/{reading}", response_model=PitchLookupResponse)
async def get_pitch(
    reading: str,
    service: DictionaryService = Depends(get_dictionary_service),
) -> PitchLookupResponse:
    """
    Get pitch accent patterns for a reading.

    - **reading**: Reading in hiragana or katakana

    Returns pitch accent patterns from Kanjium data.
    """
    return service.get_pitch(reading)
