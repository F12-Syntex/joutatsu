"""Data exploration routes for visualizing reference data."""

import logging
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/data", tags=["data"])


# Thread-local storage for thread-unsafe services
import threading

_local = threading.local()
_pitch_data: dict[str, list[dict]] | None = None
_pitch_loaded = False
_tokenizer = None


def get_jamdict():
    """Get thread-local Jamdict instance (SQLite is not thread-safe)."""
    if not hasattr(_local, "jamdict"):
        try:
            from jamdict import Jamdict
            _local.jamdict = Jamdict()
        except ImportError:
            _local.jamdict = None
    return _local.jamdict


def get_tokenizer():
    """Get or create Sudachi tokenizer (thread-safe singleton)."""
    global _tokenizer
    if _tokenizer is None:
        try:
            from sudachipy import Dictionary
            _tokenizer = Dictionary().create()
        except ImportError:
            pass
    return _tokenizer


def get_pitch_data() -> dict[str, list[dict]]:
    """Load and cache pitch accent data (thread-safe, immutable after load).

    Kanjium format: kanji[TAB]reading[TAB]pattern
    We key by hiragana reading for lookup.
    """
    global _pitch_data, _pitch_loaded
    if not _pitch_loaded:
        _pitch_data = {}
        pitch_file = settings.pitch_data_path
        if pitch_file.exists():
            with open(pitch_file, encoding="utf-8") as f:
                for line in f:
                    parts = line.strip().split("\t")
                    if len(parts) >= 3:
                        kanji = parts[0]
                        reading = parts[1]  # hiragana reading
                        pattern = parts[2]
                        if reading not in _pitch_data:
                            _pitch_data[reading] = []
                        _pitch_data[reading].append({"kanji": kanji, "pattern": pattern})
        _pitch_loaded = True
    return _pitch_data or {}


# Pre-load pitch data and tokenizer at import (thread-safe)
def _init_services():
    """Background initialization of thread-safe services only."""
    def init():
        get_pitch_data()
        get_tokenizer()
    thread = threading.Thread(target=init, daemon=True)
    thread.start()

_init_services()


@router.get("/status")
async def data_status() -> dict[str, Any]:
    """Get status of all reference data sources."""
    # Check JMdict
    jamdict_db = Path.home() / ".jamdict" / "data" / "jamdict.db"
    jamdict_status = {
        "installed": False,
        "database_exists": jamdict_db.exists(),
        "database_path": str(jamdict_db),
        "entry_count": 0,
        "kanji_count": 0,
        "ready": hasattr(_local, "jamdict") and _local.jamdict is not None,
    }
    try:
        import jamdict
        jamdict_status["installed"] = True
        if jamdict_db.exists():
            import sqlite3
            conn = sqlite3.connect(jamdict_db)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM Entry")
            jamdict_status["entry_count"] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM character")
            jamdict_status["kanji_count"] = cursor.fetchone()[0]
            conn.close()
    except ImportError:
        pass

    # Check Sudachi
    sudachi_status = {
        "installed": False,
        "dictionary": None,
        "ready": _tokenizer is not None,
    }
    try:
        from sudachipy import Dictionary
        sudachi_status["installed"] = True
        sudachi_status["dictionary"] = "core"
    except ImportError:
        pass

    # Check pitch data
    pitch_file = settings.pitch_data_path
    pitch_status = {
        "file_exists": pitch_file.exists(),
        "file_path": str(pitch_file),
        "entry_count": len(_pitch_data) if _pitch_data else 0,
        "ready": _pitch_loaded,
    }

    return {
        "jamdict": jamdict_status,
        "sudachi": sudachi_status,
        "pitch": pitch_status,
    }


@router.get("/dictionary/lookup")
async def dictionary_lookup(
    q: str = Query(..., description="Word to look up"),
    limit: int = Query(10, ge=1, le=50, description="Max results"),
) -> dict[str, Any]:
    """Look up a word in JMdict dictionary."""
    jmd = get_jamdict()
    if jmd is None:
        raise HTTPException(503, "jamdict not available")

    result = jmd.lookup(q)

    entries = []
    for entry in result.entries[:limit]:
        kanji_forms = [k.text for k in entry.kanji_forms] if entry.kanji_forms else []
        kana_forms = [k.text for k in entry.kana_forms] if entry.kana_forms else []

        senses = []
        for sense in entry.senses:
            glosses = [g.text for g in sense.gloss] if sense.gloss else []
            pos = list(sense.pos) if sense.pos else []
            senses.append({"glosses": glosses, "pos": pos})

        entries.append({
            "id": entry.idseq,
            "kanji": kanji_forms,
            "readings": kana_forms,
            "senses": senses,
        })

    # Get pitch accent for readings
    pitch_data = get_pitch_data()
    for entry in entries:
        entry["pitch"] = []
        for reading in entry["readings"]:
            if reading in pitch_data:
                entry["pitch"].extend(pitch_data[reading])

    return {"query": q, "count": len(entries), "entries": entries}


@router.get("/dictionary/kanji")
async def kanji_lookup(
    q: str = Query(..., description="Kanji character to look up"),
) -> dict[str, Any]:
    """Look up a kanji character in KanjiDic2."""
    jmd = get_jamdict()
    if jmd is None:
        raise HTTPException(503, "jamdict not available")

    result = jmd.lookup(q)

    if not result.chars:
        raise HTTPException(404, f"Kanji '{q}' not found")

    chars = []
    for char in result.chars:
        readings = {"on": [], "kun": [], "nanori": []}
        for rm in char.rm_groups:
            for reading in rm.readings:
                if reading.r_type == "ja_on":
                    readings["on"].append(reading.value)
                elif reading.r_type == "ja_kun":
                    readings["kun"].append(reading.value)

        meanings = []
        for rm in char.rm_groups:
            for meaning in rm.meanings:
                # m_lang is None, empty string, or "en" for English meanings
                if meaning.m_lang in (None, "", "en"):
                    meanings.append(meaning.value)

        chars.append({
            "literal": char.literal,
            "readings": readings,
            "meanings": meanings,
            "stroke_count": char.stroke_count,
            "grade": char.grade,
            "jlpt": char.jlpt,
            "frequency": char.freq,
        })

    return {"query": q, "count": len(chars), "characters": chars}


@router.get("/pitch")
async def pitch_lookup(
    q: str = Query(..., description="Reading (in hiragana/katakana) to look up"),
) -> dict[str, Any]:
    """Look up pitch accent patterns for a reading."""
    pitch_data = get_pitch_data()
    query = q

    if q not in pitch_data:
        # Try converting between hiragana/katakana
        converted = ""
        for char in q:
            code = ord(char)
            # Hiragana: 0x3040-0x309F, Katakana: 0x30A0-0x30FF
            if 0x3040 <= code <= 0x309F:
                converted += chr(code + 0x60)  # hiragana to katakana
            elif 0x30A0 <= code <= 0x30FF:
                converted += chr(code - 0x60)  # katakana to hiragana
            else:
                converted += char

        if converted in pitch_data:
            query = converted

    patterns = pitch_data.get(query, [])
    return {"reading": query, "count": len(patterns), "patterns": patterns}


@router.get("/pitch/search")
async def pitch_search(
    q: str = Query(..., description="Search term (partial match)"),
    limit: int = Query(50, ge=1, le=200, description="Max results"),
) -> dict[str, Any]:
    """Search pitch accent data by partial reading match."""
    pitch_data = get_pitch_data()

    results = []
    for reading, patterns in pitch_data.items():
        if q in reading:
            results.append({"reading": reading, "patterns": patterns})
            if len(results) >= limit:
                break

    return {"query": q, "count": len(results), "results": results}


@router.get("/tokenize")
async def tokenize_text(
    text: str = Query(..., description="Japanese text to tokenize"),
    mode: str = Query("C", description="Split mode: A (short), B (medium), C (long)"),
) -> dict[str, Any]:
    """Tokenize Japanese text using Sudachi."""
    from sudachipy import Tokenizer

    tokenizer = get_tokenizer()
    if tokenizer is None:
        raise HTTPException(503, "sudachipy not available")

    modes = {
        "A": Tokenizer.SplitMode.A,
        "B": Tokenizer.SplitMode.B,
        "C": Tokenizer.SplitMode.C,
    }
    split_mode = modes.get(mode.upper(), Tokenizer.SplitMode.C)

    morphemes = tokenizer.tokenize(text, split_mode)

    tokens = []
    for m in morphemes:
        pos = list(m.part_of_speech())
        tokens.append({
            "surface": m.surface(),
            "dictionary_form": m.dictionary_form(),
            "reading": m.reading_form(),
            "pos": pos,
            "pos_short": pos[0] if pos else "",
            "start": m.begin(),
            "end": m.end(),
        })

    # Enrich with pitch data
    pitch_data = get_pitch_data()
    for token in tokens:
        reading = token["reading"]
        token["pitch"] = pitch_data.get(reading, [])

    return {"text": text, "mode": mode, "token_count": len(tokens), "tokens": tokens}


@router.get("/tokenize/analyze")
async def analyze_text(
    text: str = Query(..., description="Japanese text to analyze"),
) -> dict[str, Any]:
    """Comprehensive analysis of Japanese text."""
    from sudachipy import Tokenizer

    tokenizer = get_tokenizer()
    jmd = get_jamdict()
    pitch_data = get_pitch_data()

    if tokenizer is None:
        raise HTTPException(503, "sudachipy not available")

    morphemes = tokenizer.tokenize(text, Tokenizer.SplitMode.C)

    analysis = []
    for m in morphemes:
        pos = list(m.part_of_speech())
        surface = m.surface()
        dict_form = m.dictionary_form()
        reading = m.reading_form()

        # Get dictionary entries (only if jamdict available)
        dict_entries = []
        if jmd:
            result = jmd.lookup(dict_form)
            for entry in result.entries[:3]:
                kanji = [k.text for k in entry.kanji_forms] if entry.kanji_forms else []
                kana = [k.text for k in entry.kana_forms] if entry.kana_forms else []
                glosses = []
                for sense in entry.senses[:2]:
                    glosses.extend([g.text for g in sense.gloss][:3])
                dict_entries.append({"kanji": kanji, "kana": kana, "glosses": glosses})

        # Get pitch patterns
        pitch = pitch_data.get(reading, [])

        analysis.append({
            "surface": surface,
            "dictionary_form": dict_form,
            "reading": reading,
            "pos": pos[0] if pos else "",
            "dictionary": dict_entries,
            "pitch": pitch[:3],
        })

    return {"text": text, "token_count": len(analysis), "analysis": analysis}
