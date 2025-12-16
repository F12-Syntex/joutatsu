"""Unit tests for TokenizerService."""

import pytest

from app.services.tokenizer_service import SplitMode, Token, TokenizerService


class TestTokenizerService:
    """Tests for TokenizerService."""

    @pytest.fixture
    def service(self) -> TokenizerService:
        """Create a TokenizerService instance."""
        return TokenizerService()

    def test_tokenize_simple_text(self, service: TokenizerService) -> None:
        """Test basic tokenization of Japanese text."""
        tokens = service.tokenize("東京に行きます")

        assert len(tokens) > 0
        # Should contain: 東京, に, 行き, ます
        surfaces = [t.surface for t in tokens]
        assert "東京" in surfaces

    def test_tokenize_returns_token_objects(self, service: TokenizerService) -> None:
        """Verify tokens have all required fields."""
        tokens = service.tokenize("食べる")

        assert len(tokens) > 0
        token = tokens[0]

        assert isinstance(token, Token)
        assert token.surface == "食べる"
        assert token.dictionary_form == "食べる"
        assert token.reading == "タベル"
        assert len(token.pos) > 0
        assert token.pos_short != ""
        assert token.start >= 0
        assert token.end > token.start

    def test_tokenize_with_mode_a(self, service: TokenizerService) -> None:
        """Test short split mode produces more tokens."""
        text = "国際連合"

        tokens_a = service.tokenize(text, mode=SplitMode.A)
        tokens_c = service.tokenize(text, mode=SplitMode.C)

        # Mode A should produce more (or equal) tokens than Mode C
        assert len(tokens_a) >= len(tokens_c)

    def test_tokenize_with_mode_b(self, service: TokenizerService) -> None:
        """Test medium split mode."""
        tokens = service.tokenize("東京都庁", mode=SplitMode.B)
        assert len(tokens) > 0

    def test_tokenize_with_mode_c(self, service: TokenizerService) -> None:
        """Test long split mode (default)."""
        tokens = service.tokenize("東京都庁", mode=SplitMode.C)
        assert len(tokens) > 0

    def test_tokenize_empty_string(self, service: TokenizerService) -> None:
        """Test tokenizing empty string."""
        tokens = service.tokenize("")
        assert tokens == []

    def test_tokenize_punctuation(self, service: TokenizerService) -> None:
        """Test that punctuation is tokenized."""
        tokens = service.tokenize("こんにちは。")

        # Should include the period as a token
        surfaces = [t.surface for t in tokens]
        assert "。" in surfaces

    def test_tokenize_batch(self, service: TokenizerService) -> None:
        """Test batch tokenization."""
        texts = ["東京", "大阪", "京都"]
        results = service.tokenize_batch(texts)

        assert len(results) == 3
        assert all(len(tokens) > 0 for tokens in results)

    def test_is_content_word_noun(self, service: TokenizerService) -> None:
        """Test content word detection for nouns."""
        tokens = service.tokenize("猫")
        assert len(tokens) == 1
        assert service.is_content_word(tokens[0])

    def test_is_content_word_verb(self, service: TokenizerService) -> None:
        """Test content word detection for verbs."""
        tokens = service.tokenize("食べる")
        assert len(tokens) == 1
        assert service.is_content_word(tokens[0])

    def test_is_content_word_particle(self, service: TokenizerService) -> None:
        """Test content word detection returns false for particles."""
        tokens = service.tokenize("私は")
        # Find the particle は
        particle = next((t for t in tokens if t.surface == "は"), None)
        assert particle is not None
        assert not service.is_content_word(particle)

    def test_is_punctuation(self, service: TokenizerService) -> None:
        """Test punctuation detection."""
        tokens = service.tokenize("こんにちは。")
        period = next((t for t in tokens if t.surface == "。"), None)
        assert period is not None
        assert service.is_punctuation(period)

    def test_extract_sentences(self, service: TokenizerService) -> None:
        """Test sentence extraction."""
        text = "今日は天気がいい。明日も晴れるでしょう。"
        sentences = service.extract_sentences(text)

        assert len(sentences) == 2
        assert "今日は天気がいい。" in sentences
        assert "明日も晴れるでしょう。" in sentences

    def test_extract_sentences_with_question(self, service: TokenizerService) -> None:
        """Test sentence extraction with question marks."""
        text = "何を食べますか？私はラーメンです。"
        sentences = service.extract_sentences(text)

        assert len(sentences) == 2

    def test_token_positions(self, service: TokenizerService) -> None:
        """Test that token positions are correct."""
        text = "東京に行く"
        tokens = service.tokenize(text)

        # Verify positions don't overlap and cover the text
        for i, token in enumerate(tokens):
            # Check start/end are valid
            assert token.start >= 0
            assert token.end <= len(text)
            assert token.start < token.end

            # Check token text matches position
            assert text[token.start : token.end] == token.surface

    def test_reading_is_katakana(self, service: TokenizerService) -> None:
        """Test that readings are in katakana."""
        tokens = service.tokenize("漢字")

        for token in tokens:
            # Reading should be katakana (or empty for some tokens)
            if token.reading:
                # Check if all characters are katakana or special chars
                for char in token.reading:
                    code = ord(char)
                    # Katakana range: 0x30A0-0x30FF
                    assert 0x30A0 <= code <= 0x30FF or char in "ー", (
                        f"Reading '{token.reading}' contains non-katakana"
                    )

    def test_merge_conjugations_masu_form(self, service: TokenizerService) -> None:
        """Test that verb + ます is merged into single token."""
        tokens = service.tokenize("たくさんあります")

        surfaces = [t.surface for t in tokens]
        # Should be: たくさん, あります (not たくさん, あり, ます)
        assert "あります" in surfaces
        assert "ます" not in surfaces

    def test_merge_conjugations_mashita_form(self, service: TokenizerService) -> None:
        """Test that verb + ました is merged."""
        tokens = service.tokenize("食べました")

        surfaces = [t.surface for t in tokens]
        assert "食べました" in surfaces

    def test_merge_conjugations_disabled(self, service: TokenizerService) -> None:
        """Test that merge_conjugations=False keeps morphemes separate."""
        tokens = service.tokenize("食べます", merge_conjugations=False)

        surfaces = [t.surface for t in tokens]
        # Should have separate morphemes
        assert "食べ" in surfaces
        assert "ます" in surfaces

    def test_merge_conjugations_nai_form(self, service: TokenizerService) -> None:
        """Test that verb + ない is merged."""
        tokens = service.tokenize("食べない")

        surfaces = [t.surface for t in tokens]
        assert "食べない" in surfaces

    def test_merge_conjugations_particle_preserved(self, service: TokenizerService) -> None:
        """Test that particles are not merged into verbs."""
        tokens = service.tokenize("たくさんありますが")

        surfaces = [t.surface for t in tokens]
        # が should be separate
        assert "が" in surfaces
        assert "あります" in surfaces
