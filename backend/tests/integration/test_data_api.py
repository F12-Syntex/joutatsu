"""Integration tests for /data API routes."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client() -> AsyncClient:
    """Create test HTTP client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestDataStatus:
    """Tests for /api/data/status endpoint."""

    @pytest.mark.asyncio
    async def test_status_returns_all_sources(self, client: AsyncClient) -> None:
        """Verify status endpoint returns all data source info."""
        response = await client.get("/api/data/status")
        assert response.status_code == 200
        data = response.json()

        assert "jamdict" in data
        assert "sudachi" in data
        assert "pitch" in data

    @pytest.mark.asyncio
    async def test_jamdict_status_fields(self, client: AsyncClient) -> None:
        """Verify jamdict status has expected fields."""
        response = await client.get("/api/data/status")
        data = response.json()

        jamdict = data["jamdict"]
        assert "installed" in jamdict
        assert "database_exists" in jamdict
        assert "entry_count" in jamdict

    @pytest.mark.asyncio
    async def test_pitch_status_shows_entries(self, client: AsyncClient) -> None:
        """Verify pitch status shows entry count."""
        response = await client.get("/api/data/status")
        data = response.json()

        pitch = data["pitch"]
        assert pitch["file_exists"] is True
        assert pitch["entry_count"] > 0


class TestDictionaryLookup:
    """Tests for /api/data/dictionary/lookup endpoint."""

    @pytest.mark.asyncio
    async def test_lookup_english_word(self, client: AsyncClient) -> None:
        """Verify lookup works for English words."""
        response = await client.get("/api/data/dictionary/lookup", params={"q": "run"})
        assert response.status_code == 200
        data = response.json()

        assert data["query"] == "run"
        assert data["count"] > 0
        assert len(data["entries"]) > 0

    @pytest.mark.asyncio
    async def test_lookup_returns_readings(self, client: AsyncClient) -> None:
        """Verify lookup entries have readings."""
        response = await client.get("/api/data/dictionary/lookup", params={"q": "run"})
        data = response.json()

        entry = data["entries"][0]
        assert "readings" in entry
        assert len(entry["readings"]) > 0

    @pytest.mark.asyncio
    async def test_lookup_returns_senses(self, client: AsyncClient) -> None:
        """Verify lookup entries have senses."""
        response = await client.get("/api/data/dictionary/lookup", params={"q": "run"})
        data = response.json()

        entry = data["entries"][0]
        assert "senses" in entry
        assert len(entry["senses"]) > 0
        assert "glosses" in entry["senses"][0]

    @pytest.mark.asyncio
    async def test_lookup_limit_param(self, client: AsyncClient) -> None:
        """Verify limit parameter works."""
        response = await client.get(
            "/api/data/dictionary/lookup", params={"q": "run", "limit": 1}
        )
        data = response.json()
        assert len(data["entries"]) <= 1


class TestKanjiLookup:
    """Tests for /api/data/dictionary/kanji endpoint."""

    @pytest.mark.asyncio
    async def test_kanji_lookup(self, client: AsyncClient) -> None:
        """Verify kanji lookup returns character info."""
        response = await client.get(
            "/api/data/dictionary/kanji", params={"q": "\u65e5"}
        )  # 日
        assert response.status_code == 200
        data = response.json()

        assert data["count"] > 0
        assert len(data["characters"]) > 0

    @pytest.mark.asyncio
    async def test_kanji_has_readings(self, client: AsyncClient) -> None:
        """Verify kanji entries have readings."""
        response = await client.get(
            "/api/data/dictionary/kanji", params={"q": "\u65e5"}
        )  # 日
        data = response.json()

        char = data["characters"][0]
        assert "readings" in char
        assert "on" in char["readings"] or "kun" in char["readings"]

    @pytest.mark.asyncio
    async def test_kanji_not_found(self, client: AsyncClient) -> None:
        """Verify 404 for invalid kanji."""
        response = await client.get("/api/data/dictionary/kanji", params={"q": "xyz"})
        assert response.status_code == 404


class TestPitchAccent:
    """Tests for /api/data/pitch endpoint."""

    @pytest.mark.asyncio
    async def test_pitch_lookup(self, client: AsyncClient) -> None:
        """Verify pitch accent lookup works."""
        response = await client.get(
            "/api/data/pitch", params={"q": "\u3068\u3046\u304d\u3087\u3046"}
        )  # とうきょう
        assert response.status_code == 200
        data = response.json()

        assert "patterns" in data

    @pytest.mark.asyncio
    async def test_pitch_search(self, client: AsyncClient) -> None:
        """Verify pitch accent search works."""
        response = await client.get(
            "/api/data/pitch/search", params={"q": "\u3042", "limit": 10}
        )  # あ
        assert response.status_code == 200
        data = response.json()

        assert "results" in data


class TestTokenize:
    """Tests for /api/data/tokenize endpoint."""

    @pytest.mark.asyncio
    async def test_tokenize_japanese(self, client: AsyncClient) -> None:
        """Verify tokenization of Japanese text."""
        response = await client.get(
            "/api/data/tokenize",
            params={"text": "\u6771\u4eac\u306b\u884c\u304d\u307e\u3059"},
        )  # 東京に行きます
        assert response.status_code == 200
        data = response.json()

        assert data["token_count"] > 0
        assert len(data["tokens"]) > 0

    @pytest.mark.asyncio
    async def test_tokenize_returns_readings(self, client: AsyncClient) -> None:
        """Verify tokens have readings."""
        response = await client.get(
            "/api/data/tokenize",
            params={"text": "\u6771\u4eac"},
        )  # 東京
        data = response.json()

        token = data["tokens"][0]
        assert "reading" in token
        assert token["reading"] == "\u30c8\u30a6\u30ad\u30e7\u30a6"  # トウキョウ

    @pytest.mark.asyncio
    async def test_tokenize_returns_dictionary_form(self, client: AsyncClient) -> None:
        """Verify tokens have dictionary forms."""
        response = await client.get(
            "/api/data/tokenize",
            params={"text": "\u98df\u3079\u307e\u3057\u305f"},
        )  # 食べました
        data = response.json()

        # Find the verb token
        verb_token = next(
            (t for t in data["tokens"] if t["pos_short"] == "\u52d5\u8a5e"), None
        )  # 動詞
        assert verb_token is not None
        assert verb_token["dictionary_form"] == "\u98df\u3079\u308b"  # 食べる

    @pytest.mark.asyncio
    async def test_tokenize_mode_param(self, client: AsyncClient) -> None:
        """Verify split mode parameter works."""
        # Mode A produces more tokens (shorter units)
        response_a = await client.get(
            "/api/data/tokenize",
            params={"text": "\u56fd\u969b\u9023\u5408", "mode": "A"},
        )  # 国際連合
        response_c = await client.get(
            "/api/data/tokenize",
            params={"text": "\u56fd\u969b\u9023\u5408", "mode": "C"},
        )  # 国際連合

        data_a = response_a.json()
        data_c = response_c.json()

        # Mode A should produce more tokens than Mode C
        assert data_a["token_count"] >= data_c["token_count"]


class TestAnalyze:
    """Tests for /api/data/tokenize/analyze endpoint."""

    @pytest.mark.asyncio
    async def test_analyze_includes_dictionary(self, client: AsyncClient) -> None:
        """Verify analyze includes dictionary definitions."""
        response = await client.get(
            "/api/data/tokenize/analyze",
            params={"text": "\u65e5\u672c\u8a9e"},
        )  # 日本語
        assert response.status_code == 200
        data = response.json()

        assert len(data["analysis"]) > 0
        # The main token should have dictionary entries
        main_token = data["analysis"][0]
        assert "dictionary" in main_token


class TestDataIntegrity:
    """Tests to verify reference data is properly loaded and accessible."""

    @pytest.mark.asyncio
    async def test_jamdict_has_sufficient_entries(self, client: AsyncClient) -> None:
        """Verify JMdict has expected number of entries."""
        response = await client.get("/api/data/status")
        data = response.json()

        # JMdict should have over 200k entries
        assert data["jamdict"]["entry_count"] > 200000
        assert data["jamdict"]["database_exists"] is True

    @pytest.mark.asyncio
    async def test_kanji_dict_has_sufficient_entries(self, client: AsyncClient) -> None:
        """Verify KanjiDic has expected number of kanji."""
        response = await client.get("/api/data/status")
        data = response.json()

        # KanjiDic should have over 13k kanji
        assert data["jamdict"]["kanji_count"] > 13000

    @pytest.mark.asyncio
    async def test_pitch_data_has_sufficient_entries(self, client: AsyncClient) -> None:
        """Verify pitch accent data has expected entries."""
        response = await client.get("/api/data/status")
        data = response.json()

        # Kanjium should have over 100k entries
        assert data["pitch"]["entry_count"] > 100000
        assert data["pitch"]["file_exists"] is True

    @pytest.mark.asyncio
    async def test_sudachi_is_ready(self, client: AsyncClient) -> None:
        """Verify Sudachi tokenizer is available."""
        response = await client.get("/api/data/status")
        data = response.json()

        assert data["sudachi"]["installed"] is True
        assert data["sudachi"]["dictionary"] == "core"

    @pytest.mark.asyncio
    async def test_dictionary_lookup_returns_complete_data(
        self, client: AsyncClient
    ) -> None:
        """Verify dictionary lookup returns all expected fields."""
        response = await client.get(
            "/api/data/dictionary/lookup",
            params={"q": "\u98df\u3079\u308b"},  # 食べる
        )
        assert response.status_code == 200
        data = response.json()

        assert data["count"] > 0
        entry = data["entries"][0]

        # Verify all expected fields are present
        assert "id" in entry
        assert "kanji" in entry
        assert "readings" in entry
        assert "senses" in entry
        assert "pitch" in entry

        # Verify entry has actual data
        assert len(entry["readings"]) > 0
        assert len(entry["senses"]) > 0
        assert "glosses" in entry["senses"][0]
        assert len(entry["senses"][0]["glosses"]) > 0

    @pytest.mark.asyncio
    async def test_kanji_lookup_returns_complete_data(
        self, client: AsyncClient
    ) -> None:
        """Verify kanji lookup returns all expected fields."""
        response = await client.get(
            "/api/data/dictionary/kanji",
            params={"q": "\u65e5"},  # 日
        )
        assert response.status_code == 200
        data = response.json()

        char = data["characters"][0]

        # Verify all expected fields
        assert char["literal"] == "\u65e5"
        assert "readings" in char
        assert "meanings" in char
        assert len(char["meanings"]) > 0
        assert "stroke_count" in char

    @pytest.mark.asyncio
    async def test_tokenize_returns_complete_token_data(
        self, client: AsyncClient
    ) -> None:
        """Verify tokenization returns all expected token fields."""
        response = await client.get(
            "/api/data/tokenize",
            params={"text": "\u79c1\u306f\u5b66\u751f\u3067\u3059"},  # 私は学生です
        )
        assert response.status_code == 200
        data = response.json()

        assert data["token_count"] > 0

        for token in data["tokens"]:
            assert "surface" in token
            assert "dictionary_form" in token
            assert "reading" in token
            assert "pos" in token
            assert "pos_short" in token
            assert "pitch" in token

    @pytest.mark.asyncio
    async def test_analyze_returns_enriched_data(self, client: AsyncClient) -> None:
        """Verify analyze endpoint returns enriched token data."""
        response = await client.get(
            "/api/data/tokenize/analyze",
            params={"text": "\u52c9\u5f37"},  # 勉強
        )
        assert response.status_code == 200
        data = response.json()

        assert len(data["analysis"]) > 0
        token = data["analysis"][0]

        assert "surface" in token
        assert "dictionary_form" in token
        assert "reading" in token
        assert "pos" in token
        assert "dictionary" in token
        assert "pitch" in token

        # Verify dictionary data is present for a common word
        if len(token["dictionary"]) > 0:
            dict_entry = token["dictionary"][0]
            assert "glosses" in dict_entry
            assert len(dict_entry["glosses"]) > 0
