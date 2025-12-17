"""Content API routes."""

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.models.content import ContentType
from app.repositories.content_repo import ContentChunkRepository
from app.schemas.content import (
    ContentChunkResponse,
    ContentDetailResponse,
    ContentImportRequest,
    ContentListResponse,
    ContentResponse,
)
from app.services.content_service import ContentService
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/content", tags=["content"])


def _content_to_response(content, chunk_count: int = 0) -> ContentResponse:
    """Convert Content model to response schema."""
    return ContentResponse(
        id=content.id,
        title=content.title,
        source_type=content.source_type,
        file_path=content.file_path,
        original_url=content.original_url,
        created_at=content.created_at,
        difficulty_estimate=content.difficulty_estimate,
        total_tokens=content.total_tokens,
        unique_vocabulary=content.unique_vocabulary,
        chunk_count=chunk_count,
    )


@router.post("/import", response_model=ContentResponse)
async def import_text_content(
    request: ContentImportRequest,
    session: AsyncSession = Depends(get_session),
) -> ContentResponse:
    """
    Import text content.

    Creates a new content entry, chunks the text, and optionally pre-tokenizes.
    """
    service = ContentService(session)
    content = await service.import_text(
        title=request.title,
        text=request.text,
        source_type=request.source_type,
        chunk_size=request.chunk_size,
        pre_tokenize=request.pre_tokenize,
    )

    chunk_repo = ContentChunkRepository(session)
    chunk_count = await chunk_repo.get_chunk_count(content.id)

    return _content_to_response(content, chunk_count)


@router.post("/import/pdf", response_model=ContentResponse)
async def import_pdf_content(
    file: UploadFile = File(...),
    title: Optional[str] = Form(default=None),
    pre_tokenize: bool = Form(default=True),
    session: AsyncSession = Depends(get_session),
) -> ContentResponse:
    """
    Import PDF content.

    Parses the PDF, extracts text, and creates content with chunks.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty PDF file")

    # Extract text from PDF
    pdf_service = PDFService()
    try:
        pages = pdf_service.extract_text_from_bytes(pdf_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")

    if not pages:
        raise HTTPException(status_code=400, detail="No text found in PDF")

    # Get title from metadata or filename
    if not title:
        metadata = pdf_service.get_metadata(pdf_bytes)
        title = metadata.get("title") or file.filename.rsplit(".", 1)[0]

    # Combine text and import
    full_text = pdf_service.get_full_text(pages)
    service = ContentService(session)
    content = await service.import_text(
        title=title,
        text=full_text,
        source_type=ContentType.PDF,
        pre_tokenize=pre_tokenize,
    )

    chunk_repo = ContentChunkRepository(session)
    chunk_count = await chunk_repo.get_chunk_count(content.id)

    return _content_to_response(content, chunk_count)


@router.get("", response_model=ContentListResponse)
async def list_content(
    source_type: Optional[ContentType] = None,
    min_difficulty: Optional[float] = None,
    max_difficulty: Optional[float] = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
) -> ContentListResponse:
    """List all content with optional filters."""
    service = ContentService(session)
    items = await service.list_content(
        source_type=source_type,
        min_difficulty=min_difficulty,
        max_difficulty=max_difficulty,
        limit=limit,
        offset=offset,
    )

    chunk_repo = ContentChunkRepository(session)
    responses = []
    for item in items:
        chunk_count = await chunk_repo.get_chunk_count(item.id)
        responses.append(_content_to_response(item, chunk_count))

    return ContentListResponse(
        items=responses,
        total=len(responses),
        limit=limit,
        offset=offset,
    )


@router.get("/{content_id}", response_model=ContentDetailResponse)
async def get_content(
    content_id: int,
    session: AsyncSession = Depends(get_session),
) -> ContentDetailResponse:
    """Get content by ID with all chunks."""
    service = ContentService(session)
    content, chunks = await service.get_content_with_chunks(content_id)

    if not content:
        raise HTTPException(status_code=404, detail="Content not found")

    chunk_responses = [
        ContentChunkResponse(
            id=c.id,
            content_id=c.content_id,
            chunk_index=c.chunk_index,
            raw_text=c.raw_text,
            tokenized_json=c.tokenized_json,
            page_number=c.page_number,
        )
        for c in chunks
    ]

    return ContentDetailResponse(
        content=_content_to_response(content, len(chunks)),
        chunks=chunk_responses,
    )


@router.get("/{content_id}/chunk/{chunk_index}", response_model=ContentChunkResponse)
async def get_chunk(
    content_id: int,
    chunk_index: int,
    session: AsyncSession = Depends(get_session),
) -> ContentChunkResponse:
    """Get a specific chunk by content ID and index."""
    service = ContentService(session)
    chunk = await service.get_chunk(content_id, chunk_index)

    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")

    return ContentChunkResponse(
        id=chunk.id,
        content_id=chunk.content_id,
        chunk_index=chunk.chunk_index,
        raw_text=chunk.raw_text,
        tokenized_json=chunk.tokenized_json,
        page_number=chunk.page_number,
    )


@router.delete("/{content_id}")
async def delete_content(
    content_id: int,
    session: AsyncSession = Depends(get_session),
) -> dict[str, bool]:
    """Delete content and all its chunks."""
    service = ContentService(session)
    deleted = await service.delete_content(content_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Content not found")

    return {"success": True}


@router.get("/search/{query}", response_model=list[ContentResponse])
async def search_content(
    query: str,
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
) -> list[ContentResponse]:
    """Search content by title."""
    service = ContentService(session)
    items = await service.search_content(query, limit)

    chunk_repo = ContentChunkRepository(session)
    responses = []
    for item in items:
        chunk_count = await chunk_repo.get_chunk_count(item.id)
        responses.append(_content_to_response(item, chunk_count))

    return responses
