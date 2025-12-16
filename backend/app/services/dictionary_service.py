"""Dictionary service for JMdict lookups and pitch accent data."""

import threading
from functools import lru_cache
from pathlib import Path
from typing import Optional

from app.config import settings
from app.schemas.dictionary import (
    DictionaryEntry,
    LookupResponse,
    PitchLookupResponse,
    PitchPattern,
    Sense,
)


class DictionaryService:
    """Service for dictionary lookups using jamdict and Kanjium pitch data."""

    _instance: Optional["DictionaryService"] = None
    _lock = threading.Lock()

    def __init__(self, pitch_data_path: Optional[Path] = None):
        """Initialize dictionary service."""
        self._pitch_data_path = pitch_data_path or settings.pitch_data_path
        self._pitch_data: dict[str, list[dict]] = {}
        self._pitch_loaded = False
        self._jamdict = None
        self._jamdict_lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> "DictionaryService":
        """Get singleton instance for shared state."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def _get_jamdict(self):
        """Get or create Jamdict instance (thread-local)."""
        if self._jamdict is None:
            with self._jamdict_lock:
                if self._jamdict is None:
                    try:
                        from jamdict import Jamdict
                        self._jamdict = Jamdict()
                    except ImportError:
                        raise RuntimeError(
                            "jamdict is not installed. Run: uv sync --extra nlp"
                        )
        return self._jamdict

    def _load_pitch_data(self) -> dict[str, list[dict]]:
        """Load pitch accent data from Kanjium TSV file."""
        if self._pitch_loaded:
            return self._pitch_data

        if not self._pitch_data_path.exists():
            self._pitch_loaded = True
            return self._pitch_data

        with open(self._pitch_data_path, encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split("\t")
                if len(parts) >= 2:
                    reading = parts[0]
                    kanji = parts[1] if len(parts) > 1 else ""
                    pattern = parts[2] if len(parts) > 2 else ""
                    if reading not in self._pitch_data:
                        self._pitch_data[reading] = []
                    self._pitch_data[reading].append({
                        "kanji": kanji,
                        "pattern": pattern,
                    })

        self._pitch_loaded = True
        return self._pitch_data

    @lru_cache(maxsize=1024)
    def lookup(self, query: str, limit: int = 10) -> LookupResponse:
        """
        Look up a word in JMdict dictionary.

        Args:
            query: Word to look up (kanji or kana)
            limit: Maximum number of entries to return

        Returns:
            LookupResponse with matching entries
        """
        jam = self._get_jamdict()
        result = jam.lookup(query)
        pitch_data = self._load_pitch_data()

        entries = []
        for entry in result.entries[:limit]:
            kanji_forms = [k.text for k in entry.kanji_forms] if entry.kanji_forms else []
            kana_forms = [k.text for k in entry.kana_forms] if entry.kana_forms else []

            senses = []
            for sense in entry.senses:
                glosses = [g.text for g in sense.gloss] if sense.gloss else []
                pos = list(sense.pos) if sense.pos else []
                misc = list(sense.misc) if sense.misc else []
                senses.append(Sense(glosses=glosses, pos=pos, misc=misc))

            # Get pitch accent for readings
            pitch_patterns = []
            for reading in kana_forms:
                if reading in pitch_data:
                    for p in pitch_data[reading]:
                        pitch_patterns.append(PitchPattern(
                            kanji=p.get("kanji", ""),
                            pattern=p.get("pattern", ""),
                        ))

            entries.append(DictionaryEntry(
                id=entry.idseq,
                kanji=kanji_forms,
                readings=kana_forms,
                senses=senses,
                pitch_accent=pitch_patterns,
            ))

        return LookupResponse(query=query, count=len(entries), entries=entries)

    def get_pitch(self, reading: str) -> PitchLookupResponse:
        """
        Get pitch accent patterns for a reading.

        Args:
            reading: Reading in hiragana or katakana

        Returns:
            PitchLookupResponse with matching patterns
        """
        pitch_data = self._load_pitch_data()
        query = reading

        # Try the reading as-is first
        if reading not in pitch_data:
            # Try converting between hiragana/katakana
            converted = self._convert_kana(reading)
            if converted in pitch_data:
                query = converted

        patterns = []
        for p in pitch_data.get(query, []):
            patterns.append(PitchPattern(
                kanji=p.get("kanji", ""),
                pattern=p.get("pattern", ""),
            ))

        return PitchLookupResponse(reading=query, count=len(patterns), patterns=patterns)

    @staticmethod
    def _convert_kana(text: str) -> str:
        """Convert between hiragana and katakana."""
        converted = ""
        for char in text:
            code = ord(char)
            # Hiragana: 0x3040-0x309F, Katakana: 0x30A0-0x30FF
            if 0x3040 <= code <= 0x309F:
                converted += chr(code + 0x60)  # hiragana to katakana
            elif 0x30A0 <= code <= 0x30FF:
                converted += chr(code - 0x60)  # katakana to hiragana
            else:
                converted += char
        return converted

    def is_available(self) -> bool:
        """Check if the dictionary service is available."""
        try:
            self._get_jamdict()
            return True
        except RuntimeError:
            return False
