"""Aozora Bunko API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.models.content import ContentType
from app.schemas.aozora import (
    AozoraAuthorResponse,
    AozoraAuthorsResponse,
    AozoraImportRequest,
    AozoraSearchResponse,
    AozoraTextResponse,
    AozoraWorkResponse,
)
from app.schemas.content import ContentResponse
from app.services.aozora_service import AozoraService
from app.services.content_service import ContentService

router = APIRouter(prefix="/aozora", tags=["aozora"])

# Singleton service instance
_aozora_service: AozoraService | None = None


async def get_aozora_service() -> AozoraService:
    """Get or create Aozora service instance."""
    global _aozora_service
    if _aozora_service is None:
        _aozora_service = AozoraService()
        await _aozora_service.load_catalog()
    return _aozora_service


@router.get("/search", response_model=AozoraSearchResponse)
async def search_works(
    query: str = "",
    author: str = "",
    author_id: str = "",
    limit: int = 50,
    modern_only: bool = True,
    service: AozoraService = Depends(get_aozora_service),
) -> AozoraSearchResponse:
    """Search Aozora Bunko works."""
    works = service.search(
        query=query,
        author=author,
        author_id=author_id,
        limit=limit,
        modern_only=modern_only,
    )

    return AozoraSearchResponse(
        works=[
            AozoraWorkResponse(
                work_id=w.work_id,
                title=w.title,
                author_name=w.author_name,
                author_id=w.author_id,
                text_url=w.text_url,
                html_url=w.html_url,
                first_published=w.first_published,
                character_type=w.character_type,
            )
            for w in works
        ],
        total=len(works),
    )


@router.get("/authors", response_model=AozoraAuthorsResponse)
async def get_popular_authors(
    service: AozoraService = Depends(get_aozora_service),
) -> AozoraAuthorsResponse:
    """Get popular authors."""
    authors = service.get_popular_authors()

    return AozoraAuthorsResponse(
        authors=[
            AozoraAuthorResponse(
                author_id=aid,
                author_name=name,
                work_count=count,
            )
            for aid, name, count in authors
        ]
    )


@router.get("/work/{work_id}", response_model=AozoraTextResponse)
async def get_work_text(
    work_id: str,
    service: AozoraService = Depends(get_aozora_service),
) -> AozoraTextResponse:
    """Get the text content of a work."""
    # Find the work
    works = [w for w in service._catalog if w.work_id == work_id]
    if not works:
        raise HTTPException(status_code=404, detail="Work not found")

    work = works[0]

    try:
        text = await service.fetch_work_text(work)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch work: {e}")

    return AozoraTextResponse(
        work_id=work.work_id,
        title=work.title,
        author_name=work.author_name,
        text=text,
    )


@router.post("/import", response_model=ContentResponse)
async def import_work(
    request: AozoraImportRequest,
    service: AozoraService = Depends(get_aozora_service),
    session: AsyncSession = Depends(get_session),
) -> ContentResponse:
    """Import an Aozora work into the library."""
    # Find the work
    works = [w for w in service._catalog if w.work_id == request.work_id]
    if not works:
        raise HTTPException(status_code=404, detail="Work not found")

    work = works[0]

    try:
        text = await service.fetch_work_text(work)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch work: {e}")

    # Import using content service
    content_service = ContentService(session)
    title = f"{work.title} - {work.author_name}"

    content = await content_service.import_text(
        title=title,
        text=text,
        source_type=ContentType.TEXT,
        pre_tokenize=request.pre_tokenize,
    )

    # Get actual chunk count
    _, chunks = await content_service.get_content_with_chunks(content.id)
    chunk_count = len(chunks)

    # Build Aozora URL for reference
    aozora_url = work.html_url or work.text_url

    return ContentResponse(
        id=content.id,
        title=content.title,
        source_type=content.source_type,
        file_path=content.file_path,
        original_url=aozora_url,
        cover_image_id=content.cover_image_id,
        created_at=content.created_at,
        difficulty_estimate=content.difficulty_estimate,
        total_tokens=content.total_tokens or 0,
        unique_vocabulary=content.unique_vocabulary or 0,
        chunk_count=chunk_count,
        image_count=0,
    )


@router.post("/refresh-catalog")
async def refresh_catalog() -> dict:
    """Refresh the Aozora catalog from source."""
    global _aozora_service
    # Reset singleton to force reload
    _aozora_service = AozoraService()
    catalog = await _aozora_service.load_catalog(force_refresh=False)
    return {"message": "Catalog reloaded", "work_count": len(catalog)}
