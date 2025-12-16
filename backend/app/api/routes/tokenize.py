"""Tokenization API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.schemas.tokenize import (
    BatchTokenizeRequest,
    BatchTokenizeResponse,
    TokenizeRequest,
    TokenizeResponse,
    TokenSchema,
)
from app.services.tokenizer_service import SplitMode, TokenizerService

router = APIRouter(prefix="/tokenize", tags=["tokenize"])


def get_tokenizer_service(
    session: AsyncSession = Depends(get_session),
) -> TokenizerService:
    """Dependency to get TokenizerService with database session."""
    return TokenizerService(session=session)


def token_to_schema(token) -> TokenSchema:
    """Convert Token dataclass to TokenSchema."""
    return TokenSchema(
        surface=token.surface,
        dictionary_form=token.dictionary_form,
        reading=token.reading,
        pos=token.pos,
        pos_short=token.pos_short,
        start=token.start,
        end=token.end,
        is_known=token.is_known,
    )


@router.post("", response_model=TokenizeResponse)
async def tokenize(
    request: TokenizeRequest,
    service: TokenizerService = Depends(get_tokenizer_service),
) -> TokenizeResponse:
    """
    Tokenize Japanese text into morphological units.

    - **text**: Japanese text to tokenize (1-10000 chars)
    - **mode**: Split granularity - A (short), B (medium), C (long/default)
    """
    try:
        mode = SplitMode(request.mode)
    except ValueError:
        raise HTTPException(400, f"Invalid mode: {request.mode}")

    tokens = await service.tokenize_with_known_vocab(request.text, mode)

    return TokenizeResponse(
        text=request.text,
        mode=request.mode,
        token_count=len(tokens),
        tokens=[token_to_schema(t) for t in tokens],
    )


@router.post("/batch", response_model=BatchTokenizeResponse)
async def tokenize_batch(
    request: BatchTokenizeRequest,
    service: TokenizerService = Depends(get_tokenizer_service),
) -> BatchTokenizeResponse:
    """
    Tokenize multiple texts in a single request.

    - **texts**: List of Japanese texts (1-100 texts)
    - **mode**: Split granularity for all texts
    """
    try:
        mode = SplitMode(request.mode)
    except ValueError:
        raise HTTPException(400, f"Invalid mode: {request.mode}")

    results = []
    for text in request.texts:
        tokens = await service.tokenize_with_known_vocab(text, mode)
        results.append(
            TokenizeResponse(
                text=text,
                mode=request.mode,
                token_count=len(tokens),
                tokens=[token_to_schema(t) for t in tokens],
            )
        )

    return BatchTokenizeResponse(
        mode=request.mode,
        count=len(results),
        results=results,
    )
