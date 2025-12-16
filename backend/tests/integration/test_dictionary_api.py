"""Integration tests for dictionary API routes."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    """Create async test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


class TestLookupEndpoint:
    """Tests for GET /api/dictionary/lookup endpoint."""

    @pytest.mark.asyncio
    async def test_lookup_returns_entries(self, client):
        """Test that lookup returns dictionary entries."""
        response = await client.get("/api/dictionary/lookup", params={"query": "食べる"})
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "食べる"
        assert data["count"] > 0
        assert len(data["entries"]) > 0

    @pytest.mark.asyncio
    async def test_lookup_entry_structure(self, client):
        """Test that entries have the correct structure."""
        response = await client.get("/api/dictionary/lookup", params={"query": "日本"})
        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) > 0

        entry = data["entries"][0]
        assert "id" in entry
        assert "kanji" in entry
        assert "readings" in entry
        assert "senses" in entry
        assert "pitch_accent" in entry

    @pytest.mark.asyncio
    async def test_lookup_sense_structure(self, client):
        """Test that senses have glosses and pos."""
        response = await client.get("/api/dictionary/lookup", params={"query": "水"})
        assert response.status_code == 200
        data = response.json()
        entry = data["entries"][0]
        assert len(entry["senses"]) > 0

        sense = entry["senses"][0]
        assert "glosses" in sense
        assert "pos" in sense
        assert "misc" in sense

    @pytest.mark.asyncio
    async def test_lookup_respects_limit(self, client):
        """Test that lookup respects the limit parameter."""
        response = await client.get(
            "/api/dictionary/lookup", params={"query": "日", "limit": 3}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["entries"]) <= 3

    @pytest.mark.asyncio
    async def test_lookup_empty_query(self, client):
        """Test that empty query returns validation error."""
        response = await client.get("/api/dictionary/lookup", params={"query": ""})
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_lookup_missing_query(self, client):
        """Test that missing query returns validation error."""
        response = await client.get("/api/dictionary/lookup")
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_lookup_no_results(self, client):
        """Test lookup with non-existent word."""
        response = await client.get(
            "/api/dictionary/lookup", params={"query": "xyznonexistent123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
        assert len(data["entries"]) == 0

    @pytest.mark.asyncio
    async def test_lookup_by_reading(self, client):
        """Test lookup by hiragana reading."""
        response = await client.get("/api/dictionary/lookup", params={"query": "たべる"})
        assert response.status_code == 200
        data = response.json()
        assert data["count"] > 0


class TestPitchEndpoint:
    """Tests for GET /api/dictionary/pitch/{reading} endpoint."""

    @pytest.mark.asyncio
    async def test_pitch_returns_patterns(self, client):
        """Test that pitch endpoint returns patterns."""
        response = await client.get("/api/dictionary/pitch/にほん")
        assert response.status_code == 200
        data = response.json()
        assert "reading" in data
        assert "count" in data
        assert "patterns" in data

    @pytest.mark.asyncio
    async def test_pitch_pattern_structure(self, client):
        """Test pitch pattern has kanji and pattern fields."""
        response = await client.get("/api/dictionary/pitch/にほん")
        assert response.status_code == 200
        data = response.json()

        if data["count"] > 0:
            pattern = data["patterns"][0]
            assert "kanji" in pattern
            assert "pattern" in pattern

    @pytest.mark.asyncio
    async def test_pitch_not_found(self, client):
        """Test pitch with non-existent reading returns empty."""
        response = await client.get("/api/dictionary/pitch/ざっぷざっぷ")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
        assert len(data["patterns"]) == 0

    @pytest.mark.asyncio
    async def test_pitch_katakana_conversion(self, client):
        """Test that katakana readings are handled."""
        response = await client.get("/api/dictionary/pitch/ニホン")
        assert response.status_code == 200
        # Should convert and find results (if available in pitch data)
