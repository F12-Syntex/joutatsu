"""Integration tests for content API routes."""

import pytest
from httpx import AsyncClient


class TestContentAPI:
    """Tests for content API endpoints."""

    @pytest.fixture
    async def sample_content(self, client: AsyncClient) -> dict:
        """Create sample content for testing."""
        response = await client.post(
            "/api/content/import",
            json={
                "title": "Test Article",
                "text": "これはテスト記事です。日本語の文章です。",
            },
        )
        assert response.status_code == 200
        return response.json()

    async def test_import_text(self, client: AsyncClient) -> None:
        """Test importing text content."""
        response = await client.post(
            "/api/content/import",
            json={
                "title": "My Article",
                "text": "日本語のテキストです。",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] is not None
        assert data["title"] == "My Article"
        assert data["source_type"] == "text"
        assert data["total_tokens"] > 0

    async def test_import_text_with_options(self, client: AsyncClient) -> None:
        """Test importing text with custom options."""
        response = await client.post(
            "/api/content/import",
            json={
                "title": "Custom Article",
                "text": "テスト。" * 100,
                "chunk_size": 500,
                "pre_tokenize": False,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Custom Article"

    async def test_import_text_empty_title_fails(
        self, client: AsyncClient
    ) -> None:
        """Test that empty title fails validation."""
        response = await client.post(
            "/api/content/import",
            json={
                "title": "",
                "text": "Some text.",
            },
        )
        assert response.status_code == 422

    async def test_import_text_empty_text_fails(
        self, client: AsyncClient
    ) -> None:
        """Test that empty text fails validation."""
        response = await client.post(
            "/api/content/import",
            json={
                "title": "Article",
                "text": "",
            },
        )
        assert response.status_code == 422

    async def test_list_content(
        self, client: AsyncClient, sample_content: dict
    ) -> None:
        """Test listing all content."""
        response = await client.get("/api/content")

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) >= 1
        assert any(c["id"] == sample_content["id"] for c in data["items"])

    async def test_list_content_with_filters(
        self, client: AsyncClient
    ) -> None:
        """Test listing content with filters."""
        # Create some content
        await client.post(
            "/api/content/import",
            json={"title": "Filter Test", "text": "テスト文章。"},
        )

        response = await client.get("/api/content?source_type=text&limit=10")

        assert response.status_code == 200
        data = response.json()
        assert all(c["source_type"] == "text" for c in data["items"])

    async def test_list_content_pagination(
        self, client: AsyncClient
    ) -> None:
        """Test content list pagination."""
        # Create multiple content items
        for i in range(3):
            await client.post(
                "/api/content/import",
                json={"title": f"Paginated {i}", "text": f"Text {i}。"},
            )

        response = await client.get("/api/content?limit=2&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 2
        assert data["offset"] == 0

    async def test_get_content_detail(
        self, client: AsyncClient, sample_content: dict
    ) -> None:
        """Test getting content details."""
        content_id = sample_content["id"]
        response = await client.get(f"/api/content/{content_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["content"]["id"] == content_id
        assert "chunks" in data
        assert len(data["chunks"]) >= 1

    async def test_get_content_not_found(self, client: AsyncClient) -> None:
        """Test getting non-existent content."""
        response = await client.get("/api/content/99999")
        assert response.status_code == 404

    async def test_get_chunk(
        self, client: AsyncClient, sample_content: dict
    ) -> None:
        """Test getting a specific chunk."""
        content_id = sample_content["id"]
        response = await client.get(f"/api/content/{content_id}/chunk/0")

        assert response.status_code == 200
        data = response.json()
        assert data["content_id"] == content_id
        assert data["chunk_index"] == 0
        assert "raw_text" in data

    async def test_get_chunk_not_found(
        self, client: AsyncClient, sample_content: dict
    ) -> None:
        """Test getting non-existent chunk."""
        content_id = sample_content["id"]
        response = await client.get(f"/api/content/{content_id}/chunk/999")
        assert response.status_code == 404

    async def test_delete_content(
        self, client: AsyncClient, sample_content: dict
    ) -> None:
        """Test deleting content."""
        content_id = sample_content["id"]
        response = await client.delete(f"/api/content/{content_id}")

        assert response.status_code == 200
        assert response.json()["success"] is True

        # Verify deletion
        get_response = await client.get(f"/api/content/{content_id}")
        assert get_response.status_code == 404

    async def test_delete_content_not_found(
        self, client: AsyncClient
    ) -> None:
        """Test deleting non-existent content."""
        response = await client.delete("/api/content/99999")
        assert response.status_code == 404

    async def test_search_content(
        self, client: AsyncClient, sample_content: dict
    ) -> None:
        """Test searching content by title."""
        response = await client.get("/api/content/search/Test")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert any("Test" in c["title"] for c in data)

    async def test_content_has_tokenized_json(
        self, client: AsyncClient
    ) -> None:
        """Test that pre-tokenized content has tokenized_json."""
        # Create content with pre-tokenization
        response = await client.post(
            "/api/content/import",
            json={
                "title": "Tokenized Content",
                "text": "漢字を読む。",
                "pre_tokenize": True,
            },
        )
        content_id = response.json()["id"]

        # Get the chunk
        chunk_response = await client.get(f"/api/content/{content_id}/chunk/0")
        data = chunk_response.json()

        assert data["tokenized_json"] is not None
        # Verify it's valid JSON with tokens
        import json
        tokens = json.loads(data["tokenized_json"])
        assert isinstance(tokens, list)
        assert len(tokens) > 0

    async def test_content_without_tokenized_json(
        self, client: AsyncClient
    ) -> None:
        """Test that non-pre-tokenized content has no tokenized_json."""
        response = await client.post(
            "/api/content/import",
            json={
                "title": "Not Tokenized",
                "text": "テスト。",
                "pre_tokenize": False,
            },
        )
        content_id = response.json()["id"]

        chunk_response = await client.get(f"/api/content/{content_id}/chunk/0")
        data = chunk_response.json()

        assert data["tokenized_json"] is None
