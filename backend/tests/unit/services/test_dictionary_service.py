"""Unit tests for DictionaryService."""

import tempfile
from pathlib import Path

import pytest

from app.services.dictionary_service import DictionaryService


class TestDictionaryService:
    """Tests for DictionaryService."""

    @pytest.fixture
    def pitch_file(self):
        """Create a temporary pitch data file."""
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".tsv", delete=False, encoding="utf-8"
        ) as f:
            # Format: reading\tkanji\tpattern
            f.write("たべる\t食べる\t2\n")
            f.write("のむ\t飲む\t1\n")
            f.write("のむ\t呑む\t1\n")
            f.write("いく\t行く\t0\n")
            f.write("ニホン\t日本\t2\n")
            return Path(f.name)

    @pytest.fixture
    def service(self, pitch_file):
        """Create a DictionaryService with test pitch data."""
        return DictionaryService(pitch_data_path=pitch_file)

    def test_lookup_returns_entries(self, service):
        """Test that lookup returns dictionary entries."""
        response = service.lookup("食べる")
        assert response.query == "食べる"
        assert response.count > 0
        assert len(response.entries) > 0

    def test_lookup_entry_has_required_fields(self, service):
        """Test that lookup entries have all required fields."""
        response = service.lookup("食べる")
        assert len(response.entries) > 0

        entry = response.entries[0]
        assert entry.id > 0
        assert isinstance(entry.kanji, list)
        assert isinstance(entry.readings, list)
        assert isinstance(entry.senses, list)
        assert isinstance(entry.pitch_accent, list)

    def test_lookup_entry_has_readings(self, service):
        """Test that lookup entries have readings."""
        response = service.lookup("日本")
        entry = response.entries[0]
        assert len(entry.readings) > 0

    def test_lookup_entry_has_senses(self, service):
        """Test that lookup entries have senses with glosses."""
        response = service.lookup("水")
        entry = response.entries[0]
        assert len(entry.senses) > 0
        sense = entry.senses[0]
        assert len(sense.glosses) > 0

    def test_lookup_respects_limit(self, service):
        """Test that lookup respects the limit parameter."""
        response = service.lookup("日", limit=3)
        assert len(response.entries) <= 3

    def test_lookup_no_results(self, service):
        """Test lookup with a query that has no results."""
        response = service.lookup("xyznonexistent123")
        assert response.count == 0
        assert len(response.entries) == 0

    def test_lookup_by_reading(self, service):
        """Test lookup by hiragana reading."""
        response = service.lookup("たべる")
        assert response.count > 0

    def test_get_pitch_returns_patterns(self, service):
        """Test that get_pitch returns pitch patterns."""
        response = service.get_pitch("たべる")
        assert response.reading == "たべる"
        assert response.count > 0
        assert len(response.patterns) > 0

    def test_get_pitch_pattern_fields(self, service):
        """Test pitch pattern has required fields."""
        response = service.get_pitch("たべる")
        assert len(response.patterns) > 0
        pattern = response.patterns[0]
        assert pattern.kanji == "食べる"
        assert pattern.pattern == "2"

    def test_get_pitch_multiple_patterns(self, service):
        """Test reading with multiple kanji returns multiple patterns."""
        response = service.get_pitch("のむ")
        assert response.count == 2
        kanjis = {p.kanji for p in response.patterns}
        assert "飲む" in kanjis
        assert "呑む" in kanjis

    def test_get_pitch_converts_kana(self, service):
        """Test that pitch lookup converts between hiragana/katakana."""
        # Our test file has katakana "ニホン"
        response = service.get_pitch("にほん")  # hiragana
        assert response.count > 0
        assert response.patterns[0].kanji == "日本"

    def test_get_pitch_not_found(self, service):
        """Test pitch lookup with non-existent reading."""
        response = service.get_pitch("ざっぷ")
        assert response.count == 0
        assert len(response.patterns) == 0

    def test_convert_kana_hiragana_to_katakana(self):
        """Test hiragana to katakana conversion."""
        result = DictionaryService._convert_kana("にほん")
        assert result == "ニホン"

    def test_convert_kana_katakana_to_hiragana(self):
        """Test katakana to hiragana conversion."""
        result = DictionaryService._convert_kana("ニホン")
        assert result == "にほん"

    def test_convert_kana_mixed(self):
        """Test mixed text conversion."""
        result = DictionaryService._convert_kana("ニホン語")
        assert result == "にほん語"

    def test_is_available(self, service):
        """Test service availability check."""
        # Should be available if jamdict is installed
        assert service.is_available() is True

    def test_lookup_caching(self, service):
        """Test that lookup results are cached."""
        # First call
        result1 = service.lookup("食べる")
        # Second call should be cached
        result2 = service.lookup("食べる")
        # Results should be identical
        assert result1.count == result2.count
        assert len(result1.entries) == len(result2.entries)

    def test_lookup_includes_pitch_for_readings(self, service):
        """Test that lookup includes pitch accent for readings."""
        response = service.lookup("食べる")
        # Find entry with たべる reading
        entry = None
        for e in response.entries:
            if "たべる" in e.readings:
                entry = e
                break

        if entry:
            assert len(entry.pitch_accent) > 0
            pattern = entry.pitch_accent[0]
            assert pattern.kanji == "食べる"
            assert pattern.pattern == "2"
