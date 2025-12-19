"""Content repository for data access."""

from typing import Optional, Sequence

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.content import Content, ContentChunk, ContentImage, ContentType
from app.repositories.base import BaseRepository


class ContentRepository(BaseRepository[Content]):
    """Repository for content data access."""

    def __init__(self, session: AsyncSession):
        super().__init__(Content, session)

    async def get_by_title(self, title: str) -> Optional[Content]:
        """Get content by title."""
        statement = select(Content).where(Content.title == title)
        result = await self.session.exec(statement)
        return result.first()

    async def get_by_type(
        self,
        source_type: ContentType,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Content]:
        """Get content by source type."""
        statement = (
            select(Content)
            .where(Content.source_type == source_type)
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.exec(statement)
        return result.all()

    async def list_with_filters(
        self,
        source_type: Optional[ContentType] = None,
        min_difficulty: Optional[float] = None,
        max_difficulty: Optional[float] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[Content]:
        """List content with optional filters."""
        statement = select(Content)

        if source_type is not None:
            statement = statement.where(Content.source_type == source_type)
        if min_difficulty is not None:
            statement = statement.where(Content.difficulty_estimate >= min_difficulty)
        if max_difficulty is not None:
            statement = statement.where(Content.difficulty_estimate <= max_difficulty)

        statement = statement.order_by(Content.created_at.desc())
        statement = statement.offset(offset).limit(limit)

        result = await self.session.exec(statement)
        return result.all()

    async def search(self, query: str, limit: int = 20) -> Sequence[Content]:
        """Search content by title."""
        statement = (
            select(Content)
            .where(Content.title.contains(query))
            .limit(limit)
        )
        result = await self.session.exec(statement)
        return result.all()


class ContentChunkRepository(BaseRepository[ContentChunk]):
    """Repository for content chunk data access."""

    def __init__(self, session: AsyncSession):
        super().__init__(ContentChunk, session)

    async def get_chunks_for_content(
        self, content_id: int
    ) -> Sequence[ContentChunk]:
        """Get all chunks for a content item, ordered by index."""
        statement = (
            select(ContentChunk)
            .where(ContentChunk.content_id == content_id)
            .order_by(ContentChunk.chunk_index)
        )
        result = await self.session.exec(statement)
        return result.all()

    async def get_chunk(
        self, content_id: int, chunk_index: int
    ) -> Optional[ContentChunk]:
        """Get a specific chunk by content ID and index."""
        statement = select(ContentChunk).where(
            ContentChunk.content_id == content_id,
            ContentChunk.chunk_index == chunk_index,
        )
        result = await self.session.exec(statement)
        return result.first()

    async def get_chunk_count(self, content_id: int) -> int:
        """Get the total number of chunks for a content item."""
        from sqlmodel import func

        statement = (
            select(func.count())
            .select_from(ContentChunk)
            .where(ContentChunk.content_id == content_id)
        )
        result = await self.session.exec(statement)
        return result.one() or 0

    async def create_chunks(
        self, content_id: int, chunks: list[str]
    ) -> list[ContentChunk]:
        """Create multiple chunks for a content item."""
        created = []
        for i, text in enumerate(chunks):
            chunk = ContentChunk(
                content_id=content_id,
                chunk_index=i,
                raw_text=text,
            )
            self.session.add(chunk)
            created.append(chunk)

        await self.session.commit()
        for chunk in created:
            await self.session.refresh(chunk)
        return created

    async def delete_chunks_for_content(self, content_id: int) -> int:
        """Delete all chunks for a content item. Returns count deleted."""
        chunks = await self.get_chunks_for_content(content_id)
        count = len(chunks)
        for chunk in chunks:
            await self.session.delete(chunk)
        await self.session.commit()
        return count

    async def update_tokenized_json(
        self, chunk_id: int, tokenized_json: str
    ) -> Optional[ContentChunk]:
        """Update the tokenized JSON for a chunk."""
        chunk = await self.get(chunk_id)
        if chunk:
            chunk.tokenized_json = tokenized_json
            self.session.add(chunk)
            await self.session.commit()
            await self.session.refresh(chunk)
        return chunk


class ContentImageRepository(BaseRepository[ContentImage]):
    """Repository for content image data access."""

    def __init__(self, session: AsyncSession):
        super().__init__(ContentImage, session)

    async def get_images_for_content(
        self, content_id: int
    ) -> Sequence[ContentImage]:
        """Get all images for a content item."""
        statement = (
            select(ContentImage)
            .where(ContentImage.content_id == content_id)
            .order_by(ContentImage.page_number, ContentImage.image_index)
        )
        result = await self.session.exec(statement)
        return result.all()

    async def get_images_for_chunk(
        self, content_id: int, chunk_index: int
    ) -> Sequence[ContentImage]:
        """Get images for a specific chunk."""
        statement = (
            select(ContentImage)
            .where(
                ContentImage.content_id == content_id,
                ContentImage.chunk_index == chunk_index,
            )
            .order_by(ContentImage.image_index)
        )
        result = await self.session.exec(statement)
        return result.all()

    async def get_image(self, image_id: int) -> Optional[ContentImage]:
        """Get a specific image by ID."""
        return await self.get(image_id)

    async def get_image_count(self, content_id: int) -> int:
        """Get total image count for a content item."""
        from sqlmodel import func

        statement = (
            select(func.count())
            .select_from(ContentImage)
            .where(ContentImage.content_id == content_id)
        )
        result = await self.session.exec(statement)
        return result.one() or 0

    async def create_image(
        self,
        content_id: int,
        chunk_index: Optional[int],
        image_index: int,
        page_number: Optional[int],
        extension: str,
        width: int,
        height: int,
        data: bytes,
    ) -> ContentImage:
        """Create a new content image."""
        image = ContentImage(
            content_id=content_id,
            chunk_index=chunk_index,
            image_index=image_index,
            page_number=page_number,
            extension=extension,
            width=width,
            height=height,
            data=data,
        )
        self.session.add(image)
        await self.session.commit()
        await self.session.refresh(image)
        return image

    async def delete_images_for_content(self, content_id: int) -> int:
        """Delete all images for a content item."""
        images = await self.get_images_for_content(content_id)
        count = len(images)
        for image in images:
            await self.session.delete(image)
        await self.session.commit()
        return count
