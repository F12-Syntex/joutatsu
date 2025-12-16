"""Integration tests for /tokenize API routes."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client() -> AsyncClient:
    """Create test HTTP client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestTokenizeEndpoint:
    """Tests for POST /api/tokenize endpoint."""

    @pytest.mark.asyncio
    async def test_tokenize_basic_text(self, client: AsyncClient) -> None:
        """Test basic tokenization."""
        response = await client.post(
            "/api/tokenize",
            json={"text": "東京に行きます", "mode": "C"},
        )
        assert response.status_code == 200
        data = response.json()

        assert data["text"] == "東京に行きます"
        assert data["mode"] == "C"
        assert data["token_count"] > 0
        assert len(data["tokens"]) > 0

    @pytest.mark.asyncio
    async def test_tokenize_returns_token_fields(self, client: AsyncClient) -> None:
        """Verify tokens have all required fields."""
        response = await client.post(
            "/api/tokenize",
            json={"text": "食べる"},
        )
        data = response.json()

        token = data["tokens"][0]
        assert "surface" in token
        assert "dictionary_form" in token
        assert "reading" in token
        assert "pos" in token
        assert "pos_short" in token
        assert "start" in token
        assert "end" in token
        assert "is_known" in token

    @pytest.mark.asyncio
    async def test_tokenize_mode_a(self, client: AsyncClient) -> None:
        """Test short split mode."""
        response = await client.post(
            "/api/tokenize",
            json={"text": "国際連合", "mode": "A"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "A"

    @pytest.mark.asyncio
    async def test_tokenize_mode_b(self, client: AsyncClient) -> None:
        """Test medium split mode."""
        response = await client.post(
            "/api/tokenize",
            json={"text": "国際連合", "mode": "B"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "B"

    @pytest.mark.asyncio
    async def test_tokenize_default_mode_c(self, client: AsyncClient) -> None:
        """Test default mode is C."""
        response = await client.post(
            "/api/tokenize",
            json={"text": "東京"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["mode"] == "C"

    @pytest.mark.asyncio
    async def test_tokenize_invalid_mode(self, client: AsyncClient) -> None:
        """Test invalid mode returns error."""
        response = await client.post(
            "/api/tokenize",
            json={"text": "東京", "mode": "X"},
        )
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_tokenize_empty_text(self, client: AsyncClient) -> None:
        """Test empty text returns validation error."""
        response = await client.post(
            "/api/tokenize",
            json={"text": ""},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_tokenize_long_text(self, client: AsyncClient) -> None:
        """Test tokenization of longer text."""
        text = "日本語を勉強しています。毎日漢字を練習します。"
        response = await client.post(
            "/api/tokenize",
            json={"text": text},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["token_count"] > 5


class TestBatchTokenizeEndpoint:
    """Tests for POST /api/tokenize/batch endpoint."""

    @pytest.mark.asyncio
    async def test_batch_tokenize(self, client: AsyncClient) -> None:
        """Test batch tokenization."""
        response = await client.post(
            "/api/tokenize/batch",
            json={"texts": ["東京", "大阪", "京都"], "mode": "C"},
        )
        assert response.status_code == 200
        data = response.json()

        assert data["mode"] == "C"
        assert data["count"] == 3
        assert len(data["results"]) == 3

    @pytest.mark.asyncio
    async def test_batch_tokenize_single_text(self, client: AsyncClient) -> None:
        """Test batch with single text."""
        response = await client.post(
            "/api/tokenize/batch",
            json={"texts": ["東京"]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1

    @pytest.mark.asyncio
    async def test_batch_tokenize_empty_list(self, client: AsyncClient) -> None:
        """Test batch with empty list returns error."""
        response = await client.post(
            "/api/tokenize/batch",
            json={"texts": []},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_batch_results_have_correct_structure(
        self, client: AsyncClient
    ) -> None:
        """Verify batch results match single tokenize structure."""
        response = await client.post(
            "/api/tokenize/batch",
            json={"texts": ["猫", "犬"]},
        )
        data = response.json()

        for result in data["results"]:
            assert "text" in result
            assert "mode" in result
            assert "token_count" in result
            assert "tokens" in result


class TestTokenizeTokenData:
    """Tests for token data accuracy."""

    @pytest.mark.asyncio
    async def test_verb_dictionary_form(self, client: AsyncClient) -> None:
        """Verify verb returns correct dictionary form."""
        response = await client.post(
            "/api/tokenize",
            json={"text": "食べました"},
        )
        data = response.json()

        # Find the verb token
        verb = next(
            (t for t in data["tokens"] if t["pos_short"] == "動詞"),
            None,
        )
        assert verb is not None
        assert verb["dictionary_form"] == "食べる"

    @pytest.mark.asyncio
    async def test_reading_is_katakana(self, client: AsyncClient) -> None:
        """Verify readings are in katakana."""
        response = await client.post(
            "/api/tokenize",
            json={"text": "漢字"},
        )
        data = response.json()

        for token in data["tokens"]:
            reading = token["reading"]
            if reading:
                for char in reading:
                    code = ord(char)
                    # Allow katakana (0x30A0-0x30FF) and prolonged sound mark
                    assert 0x30A0 <= code <= 0x30FF or char == "ー", (
                        f"Reading '{reading}' has non-katakana"
                    )

    @pytest.mark.asyncio
    async def test_token_positions_are_correct(self, client: AsyncClient) -> None:
        """Verify token positions match text."""
        text = "東京に行く"
        response = await client.post(
            "/api/tokenize",
            json={"text": text},
        )
        data = response.json()

        for token in data["tokens"]:
            extracted = text[token["start"] : token["end"]]
            assert extracted == token["surface"], (
                f"Position mismatch: {extracted} != {token['surface']}"
            )

    @pytest.mark.asyncio
    async def test_is_known_defaults_to_false(self, client: AsyncClient) -> None:
        """Verify is_known is false by default."""
        response = await client.post(
            "/api/tokenize",
            json={"text": "東京"},
        )
        data = response.json()

        for token in data["tokens"]:
            # Without vocabulary data, should be false
            assert token["is_known"] is False
