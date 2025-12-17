"""Unit tests for ContentRepository and ContentChunkRepository."""

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.content import Content, ContentType
from app.repositories.content_repo import ContentChunkRepository, ContentRepository


class TestContentRepository:
    """Tests for ContentRepository."""

    @pytest.fixture
    def repo(self, test_session: AsyncSession) -> ContentRepository:
        """Create a ContentRepository instance."""
        return ContentRepository(test_session)

    @pytest.fixture
    async def sample_content(self, repo: ContentRepository) -> Content:
        """Create a sample content entry."""
        content = Content(
            title="Sample Article",
            source_type=ContentType.TEXT,
            total_tokens=100,
            unique_vocabulary=50,
            difficulty_estimate=0.5,
        )
        return await repo.create(content)

    async def test_create_content(self, repo: ContentRepository) -> None:
        """Test creating a content entry."""
        content = Content(
            title="Test Article",
            source_type=ContentType.TEXT,
            total_tokens=200,
        )
        created = await repo.create(content)

        assert created.id is not None
        assert created.title == "Test Article"
        assert created.source_type == ContentType.TEXT

    async def test_get_by_id(
        self,
        repo: ContentRepository,
        sample_content: Content,
    ) -> None:
        """Test getting content by ID."""
        found = await repo.get(sample_content.id)

        assert found is not None
        assert found.id == sample_content.id
        assert found.title == sample_content.title

    async def test_get_by_title(
        self,
        repo: ContentRepository,
        sample_content: Content,
    ) -> None:
        """Test getting content by title."""
        found = await repo.get_by_title("Sample Article")

        assert found is not None
        assert found.title == "Sample Article"

    async def test_get_by_title_not_found(
        self, repo: ContentRepository
    ) -> None:
        """Test getting non-existent content."""
        found = await repo.get_by_title("Non-existent")
        assert found is None

    async def test_get_by_type(
        self,
        repo: ContentRepository,
        sample_content: Content,
    ) -> None:
        """Test getting content by type."""
        results = await repo.get_by_type(ContentType.TEXT)

        assert len(results) >= 1
        assert all(c.source_type == ContentType.TEXT for c in results)

    async def test_list_with_filters_type(
        self, repo: ContentRepository
    ) -> None:
        """Test listing content with type filter."""
        # Create content with different types
        text_content = Content(
            title="Text Content",
            source_type=ContentType.TEXT,
        )
        pdf_content = Content(
            title="PDF Content",
            source_type=ContentType.PDF,
        )
        await repo.create(text_content)
        await repo.create(pdf_content)

        results = await repo.list_with_filters(source_type=ContentType.PDF)
        assert all(c.source_type == ContentType.PDF for c in results)

    async def test_list_with_filters_difficulty(
        self, repo: ContentRepository
    ) -> None:
        """Test listing content with difficulty filter."""
        # Create content with different difficulties
        easy = Content(
            title="Easy Content",
            source_type=ContentType.TEXT,
            difficulty_estimate=0.2,
        )
        hard = Content(
            title="Hard Content",
            source_type=ContentType.TEXT,
            difficulty_estimate=0.8,
        )
        await repo.create(easy)
        await repo.create(hard)

        results = await repo.list_with_filters(
            min_difficulty=0.5, max_difficulty=1.0
        )
        assert all(c.difficulty_estimate >= 0.5 for c in results)

    async def test_search(
        self,
        repo: ContentRepository,
        sample_content: Content,
    ) -> None:
        """Test searching content by title."""
        results = await repo.search("Sample")

        assert len(results) >= 1
        assert any("Sample" in c.title for c in results)

    async def test_delete(
        self,
        repo: ContentRepository,
        sample_content: Content,
    ) -> None:
        """Test deleting content."""
        deleted = await repo.delete(sample_content.id)
        assert deleted is True

        found = await repo.get(sample_content.id)
        assert found is None

    async def test_get_all_with_pagination(
        self, repo: ContentRepository
    ) -> None:
        """Test getting all content with pagination."""
        # Create multiple entries
        for i in range(5):
            content = Content(
                title=f"Content {i}",
                source_type=ContentType.TEXT,
            )
            await repo.create(content)

        page1 = await repo.get_all(limit=2, offset=0)
        page2 = await repo.get_all(limit=2, offset=2)

        assert len(page1) == 2
        assert len(page2) == 2


class TestContentChunkRepository:
    """Tests for ContentChunkRepository."""

    @pytest.fixture
    def content_repo(self, test_session: AsyncSession) -> ContentRepository:
        """Create a ContentRepository instance."""
        return ContentRepository(test_session)

    @pytest.fixture
    def chunk_repo(self, test_session: AsyncSession) -> ContentChunkRepository:
        """Create a ContentChunkRepository instance."""
        return ContentChunkRepository(test_session)

    @pytest.fixture
    async def sample_content(
        self, content_repo: ContentRepository
    ) -> Content:
        """Create a sample content entry."""
        content = Content(
            title="Article with Chunks",
            source_type=ContentType.TEXT,
        )
        return await content_repo.create(content)

    async def test_create_chunks(
        self,
        chunk_repo: ContentChunkRepository,
        sample_content: Content,
    ) -> None:
        """Test creating multiple chunks."""
        chunks_text = [
            "First paragraph of the article.",
            "Second paragraph continues here.",
            "Third and final paragraph.",
        ]
        chunks = await chunk_repo.create_chunks(sample_content.id, chunks_text)

        assert len(chunks) == 3
        assert chunks[0].chunk_index == 0
        assert chunks[1].chunk_index == 1
        assert chunks[2].chunk_index == 2

    async def test_get_chunks_for_content(
        self,
        chunk_repo: ContentChunkRepository,
        sample_content: Content,
    ) -> None:
        """Test getting all chunks for content."""
        chunks_text = ["Para 1", "Para 2"]
        await chunk_repo.create_chunks(sample_content.id, chunks_text)

        chunks = await chunk_repo.get_chunks_for_content(sample_content.id)

        assert len(chunks) == 2
        assert chunks[0].raw_text == "Para 1"
        assert chunks[1].raw_text == "Para 2"

    async def test_get_chunk(
        self,
        chunk_repo: ContentChunkRepository,
        sample_content: Content,
    ) -> None:
        """Test getting a specific chunk."""
        await chunk_repo.create_chunks(sample_content.id, ["A", "B", "C"])

        chunk = await chunk_repo.get_chunk(sample_content.id, 1)

        assert chunk is not None
        assert chunk.raw_text == "B"
        assert chunk.chunk_index == 1

    async def test_get_chunk_not_found(
        self,
        chunk_repo: ContentChunkRepository,
        sample_content: Content,
    ) -> None:
        """Test getting non-existent chunk."""
        chunk = await chunk_repo.get_chunk(sample_content.id, 999)
        assert chunk is None

    async def test_get_chunk_count(
        self,
        chunk_repo: ContentChunkRepository,
        sample_content: Content,
    ) -> None:
        """Test counting chunks."""
        await chunk_repo.create_chunks(sample_content.id, ["A", "B", "C", "D"])

        count = await chunk_repo.get_chunk_count(sample_content.id)
        assert count == 4

    async def test_delete_chunks_for_content(
        self,
        chunk_repo: ContentChunkRepository,
        sample_content: Content,
    ) -> None:
        """Test deleting all chunks for content."""
        await chunk_repo.create_chunks(sample_content.id, ["X", "Y", "Z"])

        deleted_count = await chunk_repo.delete_chunks_for_content(sample_content.id)
        assert deleted_count == 3

        remaining = await chunk_repo.get_chunks_for_content(sample_content.id)
        assert len(remaining) == 0

    async def test_update_tokenized_json(
        self,
        chunk_repo: ContentChunkRepository,
        sample_content: Content,
    ) -> None:
        """Test updating tokenized JSON for a chunk."""
        chunks = await chunk_repo.create_chunks(sample_content.id, ["Text"])
        chunk = chunks[0]

        tokenized = '{"tokens": [{"surface": "Text"}]}'
        updated = await chunk_repo.update_tokenized_json(chunk.id, tokenized)

        assert updated is not None
        assert updated.tokenized_json == tokenized
