"""Tests to verify reference data is properly set up."""

from pathlib import Path

import pytest

from app.config import settings


class TestKanjiumPitchData:
    """Tests for Kanjium pitch accent data."""

    def test_pitch_file_exists(self) -> None:
        """Verify Kanjium pitch data file exists."""
        pitch_file = settings.pitch_data_path
        assert pitch_file.exists(), f"Pitch data file not found at {pitch_file}"

    def test_pitch_file_has_content(self) -> None:
        """Verify pitch data file is not empty."""
        pitch_file = settings.pitch_data_path
        assert pitch_file.stat().st_size > 0, "Pitch data file is empty"

    def test_pitch_file_format(self) -> None:
        """Verify pitch data file has expected format."""
        pitch_file = settings.pitch_data_path
        with open(pitch_file, encoding="utf-8") as f:
            first_line = f.readline().strip()
            # Kanjium format: reading<tab>kanji<tab>pitch_pattern
            parts = first_line.split("\t")
            assert len(parts) >= 2, f"Unexpected format: {first_line}"


class TestJamdict:
    """Tests for JMdict dictionary database."""

    @pytest.fixture
    def jamdict(self):
        """Get Jamdict instance."""
        try:
            from jamdict import Jamdict

            return Jamdict()
        except ImportError:
            pytest.skip("jamdict not installed (requires nlp extras)")

    def test_jamdict_database_exists(self) -> None:
        """Verify JMdict database file exists."""
        jamdict_db = Path.home() / ".jamdict" / "data" / "jamdict.db"
        assert jamdict_db.exists(), f"JMdict database not found at {jamdict_db}"

    def test_jamdict_lookup_english(self, jamdict) -> None:
        """Verify JMdict can look up English words."""
        result = jamdict.lookup("run")
        assert len(result.entries) > 0, "No entries found for 'run'"

    def test_jamdict_lookup_returns_readings(self, jamdict) -> None:
        """Verify JMdict entries have readings."""
        result = jamdict.lookup("run")
        assert result.entries[0].kana_forms, "Entry should have kana readings"

    def test_jamdict_lookup_returns_senses(self, jamdict) -> None:
        """Verify JMdict entries have sense/meaning data."""
        result = jamdict.lookup("run")
        assert result.entries[0].senses, "Entry should have senses"

    def test_jamdict_kanji_lookup(self, jamdict) -> None:
        """Verify KanjiDic2 character lookup works."""
        result = jamdict.lookup("日")
        assert len(result.chars) > 0, "No kanji found for '日'"

    def test_jamdict_kanji_has_readings(self, jamdict) -> None:
        """Verify kanji entries have readings."""
        result = jamdict.lookup("日")
        char = result.chars[0]
        assert char.rm_groups, "Kanji should have reading groups"


class TestSudachi:
    """Tests for Sudachi tokenizer."""

    @pytest.fixture
    def tokenizer(self):
        """Get Sudachi tokenizer instance."""
        try:
            from sudachipy import Dictionary

            return Dictionary().create()
        except ImportError:
            pytest.skip("sudachipy not installed (requires nlp extras)")

    def test_sudachi_tokenizes_japanese(self, tokenizer) -> None:
        """Verify Sudachi can tokenize Japanese text."""
        from sudachipy import Tokenizer

        tokens = tokenizer.tokenize("東京に行きます", Tokenizer.SplitMode.C)
        assert len(tokens) > 0, "No tokens returned"

    def test_sudachi_returns_surface_forms(self, tokenizer) -> None:
        """Verify tokens have surface forms."""
        from sudachipy import Tokenizer

        tokens = tokenizer.tokenize("食べる", Tokenizer.SplitMode.C)
        surfaces = [t.surface() for t in tokens]
        assert "食べる" in surfaces, f"Expected '食べる' in {surfaces}"

    def test_sudachi_returns_dictionary_forms(self, tokenizer) -> None:
        """Verify tokens have dictionary forms."""
        from sudachipy import Tokenizer

        tokens = tokenizer.tokenize("食べました", Tokenizer.SplitMode.C)
        dict_forms = [t.dictionary_form() for t in tokens]
        assert "食べる" in dict_forms, f"Expected '食べる' in dict forms: {dict_forms}"

    def test_sudachi_returns_readings(self, tokenizer) -> None:
        """Verify tokens have readings."""
        from sudachipy import Tokenizer

        tokens = tokenizer.tokenize("東京", Tokenizer.SplitMode.C)
        readings = [t.reading_form() for t in tokens]
        assert "トウキョウ" in readings, f"Expected 'トウキョウ' in {readings}"

    def test_sudachi_returns_pos(self, tokenizer) -> None:
        """Verify tokens have part-of-speech tags."""
        from sudachipy import Tokenizer

        tokens = tokenizer.tokenize("走る", Tokenizer.SplitMode.C)
        pos = tokens[0].part_of_speech()
        assert len(pos) > 0, "Expected part-of-speech tags"
        assert "動詞" in pos[0], f"Expected verb POS, got {pos}"
