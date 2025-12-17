"""Unit tests for ContentService."""

import json

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.content import ContentType
from app.services.content_service import ContentService


class TestContentService:
    """Tests for ContentService."""

    @pytest.fixture
    def service(self, test_session: AsyncSession) -> ContentService:
        """Create a ContentService instance."""
        return ContentService(test_session)

    async def test_import_text_basic(self, service: ContentService) -> None:
        """Test importing simple text content."""
        text = "今日は天気がいいです。"
        content = await service.import_text("Test Article", text)

        assert content.id is not None
        assert content.title == "Test Article"
        assert content.source_type == ContentType.TEXT
        assert content.total_tokens > 0

    async def test_import_text_creates_chunks(
        self, service: ContentService
    ) -> None:
        """Test that importing text creates chunks."""
        text = "First sentence。Second sentence。"
        content = await service.import_text("Article", text)

        content_result, chunks = await service.get_content_with_chunks(content.id)
        assert content_result is not None
        assert len(chunks) >= 1

    async def test_import_text_chunking(self, service: ContentService) -> None:
        """Test that long text is chunked properly."""
        # Create text longer than default chunk size
        paragraph = "これは長い段落です。" * 50
        text = paragraph * 5

        content = await service.import_text("Long Article", text, chunk_size=500)

        _, chunks = await service.get_content_with_chunks(content.id)
        assert len(chunks) > 1

    async def test_import_text_pre_tokenizes(
        self, service: ContentService
    ) -> None:
        """Test that chunks are pre-tokenized."""
        text = "日本語を勉強しています。"
        content = await service.import_text("Article", text)

        _, chunks = await service.get_content_with_chunks(content.id)
        assert len(chunks) >= 1

        chunk = chunks[0]
        assert chunk.tokenized_json is not None

        # Verify JSON is valid
        tokens = json.loads(chunk.tokenized_json)
        assert isinstance(tokens, list)
        assert len(tokens) > 0
        assert "surface" in tokens[0]

    async def test_import_text_without_pre_tokenize(
        self, service: ContentService
    ) -> None:
        """Test importing without pre-tokenization."""
        text = "テスト文章。"
        content = await service.import_text("Article", text, pre_tokenize=False)

        _, chunks = await service.get_content_with_chunks(content.id)
        chunk = chunks[0]
        assert chunk.tokenized_json is None

    async def test_import_text_calculates_stats(
        self, service: ContentService
    ) -> None:
        """Test that import calculates token and vocabulary stats."""
        text = "食べる。食べる。飲む。"
        content = await service.import_text("Stats Test", text)

        assert content.total_tokens > 0
        assert content.unique_vocabulary > 0
        assert content.difficulty_estimate is not None
        assert 0 <= content.difficulty_estimate <= 1

    async def test_chunk_text_empty(self, service: ContentService) -> None:
        """Test chunking empty text."""
        chunks = service._chunk_text("", 100)
        assert chunks == []

    async def test_chunk_text_short(self, service: ContentService) -> None:
        """Test chunking short text."""
        text = "Short text。"
        chunks = service._chunk_text(text, 1000)
        assert len(chunks) == 1
        assert chunks[0] == text

    async def test_chunk_text_long(self, service: ContentService) -> None:
        """Test chunking long text at sentence boundaries."""
        text = "First。Second。Third。Fourth。"
        chunks = service._chunk_text(text, 15)

        # Should split at sentence boundaries
        assert len(chunks) >= 2
        for chunk in chunks:
            assert chunk.endswith("。") or chunk == chunks[-1]

    async def test_get_content(self, service: ContentService) -> None:
        """Test getting content by ID."""
        content = await service.import_text("Test", "テスト。")
        found = await service.get_content(content.id)

        assert found is not None
        assert found.id == content.id

    async def test_get_content_not_found(self, service: ContentService) -> None:
        """Test getting non-existent content."""
        found = await service.get_content(99999)
        assert found is None

    async def test_get_chunk(self, service: ContentService) -> None:
        """Test getting a specific chunk."""
        text = "Chunk1。" + "x" * 500 + "。Chunk2。"
        content = await service.import_text("Chunked", text, chunk_size=100)

        _, chunks = await service.get_content_with_chunks(content.id)
        if len(chunks) > 0:
            chunk = await service.get_chunk(content.id, 0)
            assert chunk is not None
            assert chunk.chunk_index == 0

    async def test_list_content(self, service: ContentService) -> None:
        """Test listing content."""
        await service.import_text("Article 1", "Text 1。")
        await service.import_text("Article 2", "Text 2。")

        results = await service.list_content()
        assert len(results) >= 2

    async def test_list_content_with_filter(self, service: ContentService) -> None:
        """Test listing content with type filter."""
        await service.import_text("Text Article", "Text。", source_type=ContentType.TEXT)

        results = await service.list_content(source_type=ContentType.TEXT)
        assert all(c.source_type == ContentType.TEXT for c in results)

    async def test_delete_content(self, service: ContentService) -> None:
        """Test deleting content."""
        content = await service.import_text("To Delete", "Delete me。")

        deleted = await service.delete_content(content.id)
        assert deleted is True

        found = await service.get_content(content.id)
        assert found is None

    async def test_delete_content_not_found(
        self, service: ContentService
    ) -> None:
        """Test deleting non-existent content."""
        deleted = await service.delete_content(99999)
        assert deleted is False

    async def test_search_content(self, service: ContentService) -> None:
        """Test searching content."""
        await service.import_text("Japanese Reading", "日本語。")
        await service.import_text("English Article", "English。")

        results = await service.search_content("Japanese")
        assert len(results) >= 1
        assert any("Japanese" in c.title for c in results)

    async def test_difficulty_estimate_empty(
        self, service: ContentService
    ) -> None:
        """Test difficulty estimation with empty content."""
        difficulty = service._estimate_difficulty(0, set())
        assert difficulty == 0.0

    async def test_difficulty_estimate_simple(
        self, service: ContentService
    ) -> None:
        """Test difficulty estimation with simple content."""
        # Few unique words relative to total tokens = easy
        difficulty = service._estimate_difficulty(100, {"a", "b"})
        assert difficulty < 0.5

    async def test_difficulty_estimate_complex(
        self, service: ContentService
    ) -> None:
        """Test difficulty estimation with complex content."""
        # Many unique words relative to total tokens = hard
        unique = {f"word{i}" for i in range(50)}
        difficulty = service._estimate_difficulty(100, unique)
        assert difficulty >= 0.5
