"""Content API routes."""

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.models.content import ContentType
from app.repositories.content_repo import (
    ContentChunkRepository,
    ContentImageRepository,
)
from app.schemas.content import (
    ContentChunkResponse,
    ContentDetailResponse,
    ContentImageResponse,
    ContentImportRequest,
    ContentListResponse,
    ContentResponse,
    ReadingPracticeResponse,
)
from app.services.content_service import ContentService
from app.services.pdf_service import PDFService
from app.services.proficiency_service import ProficiencyService

router = APIRouter(prefix="/content", tags=["content"])


def _content_to_response(
    content, chunk_count: int = 0, image_count: int = 0
) -> ContentResponse:
    """Convert Content model to response schema."""
    return ContentResponse(
        id=content.id,
        title=content.title,
        source_type=content.source_type,
        file_path=content.file_path,
        original_url=content.original_url,
        cover_image_id=content.cover_image_id,
        created_at=content.created_at,
        difficulty_estimate=content.difficulty_estimate,
        total_tokens=content.total_tokens,
        unique_vocabulary=content.unique_vocabulary,
        chunk_count=chunk_count,
        image_count=image_count,
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

    Parses the PDF, extracts text and images, and creates content with chunks.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty PDF file")

    # Extract text and images from PDF
    pdf_service = PDFService()
    try:
        pages = pdf_service.extract_text_from_bytes(pdf_bytes, extract_images=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")

    if not pages:
        raise HTTPException(status_code=400, detail="No content found in PDF")

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

    # Save images and set cover
    image_repo = ContentImageRepository(session)
    first_image_id = None
    image_count = 0

    for page in pages:
        for img in page.images:
            saved_image = await image_repo.create_image(
                content_id=content.id,
                chunk_index=None,  # Will be mapped to chunks later if needed
                image_index=img.image_index,
                page_number=img.page_number,
                extension=img.extension,
                width=img.width,
                height=img.height,
                data=img.data,
            )
            if first_image_id is None:
                first_image_id = saved_image.id
            image_count += 1

    # Set cover image to first image found
    if first_image_id:
        content.cover_image_id = first_image_id
        session.add(content)
        await session.commit()
        await session.refresh(content)

    chunk_repo = ContentChunkRepository(session)
    chunk_count = await chunk_repo.get_chunk_count(content.id)

    return _content_to_response(content, chunk_count, image_count)


@router.get("/practice", response_model=ReadingPracticeResponse)
async def get_reading_practice(
    exclude_content_id: Optional[int] = None,
    session: AsyncSession = Depends(get_session),
) -> ReadingPracticeResponse:
    """
    Get a random text chunk matched to user's skill level.

    Returns content closest to the user's target difficulty,
    with a random chunk selected for reading practice.
    """
    # Get user's target difficulty
    proficiency_service = ProficiencyService(session)
    proficiency = await proficiency_service.get_proficiency()

    # Average the target difficulties to get overall target
    target_difficulty = (
        proficiency.target_kanji_difficulty
        + proficiency.target_lexical_difficulty
        + proficiency.target_grammar_difficulty
    ) / 3

    # Get content matched to skill level
    content_service = ContentService(session)
    result = await content_service.get_reading_practice(
        target_difficulty=target_difficulty,
        exclude_content_id=exclude_content_id,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="No content available. Import some content first.",
        )

    content, chunk = result

    # Get total chunk count for context
    chunk_repo = ContentChunkRepository(session)
    total_chunks = await chunk_repo.get_chunk_count(content.id)

    return ReadingPracticeResponse(
        content_id=content.id,
        content_title=content.title,
        chunk_index=chunk.chunk_index,
        text=chunk.raw_text,
        tokenized_json=chunk.tokenized_json,
        difficulty_estimate=content.difficulty_estimate,
        total_chunks=total_chunks,
    )


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

    # Get images for this chunk (by page number if available)
    image_repo = ContentImageRepository(session)
    images = []
    if chunk.page_number:
        all_images = await image_repo.get_images_for_content(content_id)
        images = [
            ContentImageResponse(
                id=img.id,
                content_id=img.content_id,
                chunk_index=img.chunk_index,
                image_index=img.image_index,
                page_number=img.page_number,
                extension=img.extension,
                width=img.width,
                height=img.height,
            )
            for img in all_images
            if img.page_number == chunk.page_number
        ]

    return ContentChunkResponse(
        id=chunk.id,
        content_id=chunk.content_id,
        chunk_index=chunk.chunk_index,
        raw_text=chunk.raw_text,
        tokenized_json=chunk.tokenized_json,
        page_number=chunk.page_number,
        images=images,
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


@router.get("/image/{image_id}")
async def get_image(
    image_id: int,
    session: AsyncSession = Depends(get_session),
) -> Response:
    """Get an image by ID. Returns the raw image data."""
    image_repo = ContentImageRepository(session)
    image = await image_repo.get_image(image_id)

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Determine content type
    content_type_map = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "gif": "image/gif",
        "webp": "image/webp",
    }
    content_type = content_type_map.get(image.extension.lower(), "image/jpeg")

    return Response(
        content=image.data,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=31536000",  # Cache for 1 year
        },
    )


@router.get("/{content_id}/images", response_model=list[ContentImageResponse])
async def get_content_images(
    content_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[ContentImageResponse]:
    """Get all images for a content item."""
    image_repo = ContentImageRepository(session)
    images = await image_repo.get_images_for_content(content_id)

    return [
        ContentImageResponse(
            id=img.id,
            content_id=img.content_id,
            chunk_index=img.chunk_index,
            image_index=img.image_index,
            page_number=img.page_number,
            extension=img.extension,
            width=img.width,
            height=img.height,
        )
        for img in images
    ]
