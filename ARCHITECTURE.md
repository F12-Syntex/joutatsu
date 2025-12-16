# Joutatsu (上達) - Architecture Document

> **Version**: 1.0.0  
> **Status**: LOCKED - Changes require explicit revision  
> **Last Updated**: 2025-01-XX

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [API Specification](#5-api-specification)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Core Services](#7-core-services)
8. [Data Flow](#8-data-flow)
9. [Conventions](#9-conventions)
10. [Implementation Phases](#10-implementation-phases)

---

## 1. Overview

### 1.1 Purpose

Joutatsu is a local-first Japanese learning application focused on reading comprehension with adaptive difficulty, real-world content, and Anki integration.

### 1.2 Core Features

- **Reading Canvas**: Interactive Japanese text display with hoverable tooltips
- **Dictionary Integration**: JMdict lookups with pitch accent data
- **Morphological Analysis**: Text tokenization and parsing
- **Adaptive Scoring**: Weakness detection and content calibration
- **Anki Sync**: Import known vocabulary, track progress
- **TTS Audio**: Edge TTS for listening practice
- **PDF Reader**: Parse and display PDF content
- **Content Library**: Import and manage books, articles, documents

### 1.3 Design Principles

- **Single Responsibility**: Each module/file does one thing well
- **Dependency Injection**: Services receive dependencies, enabling testing
- **Type Safety**: Full TypeScript frontend, typed Python backend
- **Offline-First**: All core features work without internet (except TTS)
- **Data Locality**: All user data stored locally in SQLite

---

## 2. Tech Stack

### 2.1 Backend

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Python 3.11+ | NLP ecosystem, SudachiPy compatibility |
| Framework | FastAPI | Async, auto-docs, Pydantic integration |
| Database | SQLite + SQLModel | Zero config, SQLAlchemy + Pydantic combined |
| Tokenizer | SudachiPy | Best Windows support, compound handling |
| Dictionary | jamdict | JMdict/JMnedict with SQLite backend |
| TTS | edge-tts | Free, high quality, async |
| Testing | pytest + pytest-asyncio | Standard, good async support |

### 2.2 Frontend

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Next.js 14 (App Router) | Static export, React ecosystem |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, accessible components |
| State (Server) | TanStack Query | Caching, background updates |
| State (Client) | Zustand | Minimal boilerplate, good DX |
| Testing | Vitest + Testing Library | Fast, Jest-compatible |

### 2.3 Tooling

| Tool | Purpose |
|------|---------|
| pnpm | Package management (frontend) |
| uv | Python package management |
| Ruff | Python linting + formatting |
| ESLint + Prettier | TypeScript linting + formatting |
| Husky | Git hooks |

---

## 3. Project Structure

```
joutatsu/
├── README.md
├── ARCHITECTURE.md
├── LICENSE
├── .gitignore
├── .env.example
├── package.json                 # Root scripts only
├── pnpm-workspace.yaml
│
├── backend/
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── pytest.ini
│   ├── .env
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry, mounts routes + static
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── dependencies.py      # Dependency injection providers
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── router.py        # Aggregates all route modules
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       ├── tokenize.py
│   │   │       ├── dictionary.py
│   │   │       ├── audio.py
│   │   │       ├── content.py
│   │   │       ├── progress.py
│   │   │       ├── anki.py
│   │   │       └── settings.py
│   │   │
│   │   ├── models/              # SQLModel database models
│   │   │   ├── __init__.py
│   │   │   ├── base.py          # Base model class
│   │   │   ├── user_settings.py
│   │   │   ├── vocabulary.py
│   │   │   ├── content.py
│   │   │   ├── session.py
│   │   │   └── progress.py
│   │   │
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── tokenize.py
│   │   │   ├── dictionary.py
│   │   │   ├── audio.py
│   │   │   ├── content.py
│   │   │   ├── progress.py
│   │   │   ├── anki.py
│   │   │   └── settings.py
│   │   │
│   │   ├── services/            # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── tokenizer_service.py
│   │   │   ├── dictionary_service.py
│   │   │   ├── audio_service.py
│   │   │   ├── content_service.py
│   │   │   ├── progress_service.py
│   │   │   ├── scoring_service.py
│   │   │   ├── anki_service.py
│   │   │   └── pdf_service.py
│   │   │
│   │   ├── repositories/        # Data access layer
│   │   │   ├── __init__.py
│   │   │   ├── base.py          # Generic CRUD operations
│   │   │   ├── vocabulary_repo.py
│   │   │   ├── content_repo.py
│   │   │   ├── session_repo.py
│   │   │   └── progress_repo.py
│   │   │
│   │   ├── core/                # Core utilities
│   │   │   ├── __init__.py
│   │   │   ├── database.py      # DB connection, session management
│   │   │   ├── exceptions.py    # Custom exception classes
│   │   │   ├── logging.py       # Logging configuration
│   │   │   └── events.py        # Startup/shutdown events
│   │   │
│   │   └── utils/               # Pure utility functions
│   │       ├── __init__.py
│   │       ├── text.py          # Text processing helpers
│   │       ├── file.py          # File handling helpers
│   │       └── cache.py         # Caching utilities
│   │
│   ├── data/                    # Reference data (gitignored large files)
│   │   ├── .gitkeep
│   │   ├── jmdict/              # JMdict SQLite (jamdict)
│   │   ├── pitch/               # Kanjium pitch accent data
│   │   └── sudachi/             # SudachiPy dictionaries
│   │
│   ├── scripts/
│   │   ├── setup_data.py        # Downloads/prepares reference data
│   │   ├── migrate.py           # Database migrations
│   │   └── dev.py               # Development server launcher
│   │
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py          # Pytest fixtures
│       ├── unit/
│       │   ├── __init__.py
│       │   ├── services/
│       │   │   ├── test_tokenizer_service.py
│       │   │   ├── test_dictionary_service.py
│       │   │   ├── test_scoring_service.py
│       │   │   └── ...
│       │   └── utils/
│       │       └── test_text.py
│       └── integration/
│           ├── __init__.py
│           ├── test_tokenize_api.py
│           ├── test_dictionary_api.py
│           └── ...
│
├── frontend/
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── .env.local
│   ├── components.json          # shadcn/ui config
│   │
│   ├── public/
│   │   ├── fonts/
│   │   └── icons/
│   │
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Home/Dashboard
│   │   │   ├── read/
│   │   │   │   ├── page.tsx     # Reading mode
│   │   │   │   └── [contentId]/
│   │   │   │       └── page.tsx
│   │   │   ├── library/
│   │   │   │   └── page.tsx     # Content library
│   │   │   ├── progress/
│   │   │   │   └── page.tsx     # Progress/stats
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── listen/
│   │   │       └── page.tsx     # Listening practice
│   │   │
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui primitives
│   │   │   │   ├── button.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   ├── popover.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── layout/          # Layout components
│   │   │   │   ├── header.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── nav-link.tsx
│   │   │   │   └── page-container.tsx
│   │   │   │
│   │   │   ├── canvas/          # Reading canvas components
│   │   │   │   ├── reading-canvas.tsx
│   │   │   │   ├── token-display.tsx
│   │   │   │   ├── sentence-block.tsx
│   │   │   │   └── canvas-controls.tsx
│   │   │   │
│   │   │   ├── tooltip/         # Tooltip system
│   │   │   │   ├── word-tooltip.tsx
│   │   │   │   ├── tooltip-content.tsx
│   │   │   │   ├── definition-list.tsx
│   │   │   │   ├── pitch-display.tsx
│   │   │   │   └── example-sentences.tsx
│   │   │   │
│   │   │   ├── library/         # Content library
│   │   │   │   ├── content-grid.tsx
│   │   │   │   ├── content-card.tsx
│   │   │   │   ├── import-modal.tsx
│   │   │   │   └── content-filters.tsx
│   │   │   │
│   │   │   ├── progress/        # Progress display
│   │   │   │   ├── score-display.tsx
│   │   │   │   ├── stats-card.tsx
│   │   │   │   ├── weakness-chart.tsx
│   │   │   │   └── session-history.tsx
│   │   │   │
│   │   │   ├── audio/           # Audio components
│   │   │   │   ├── audio-player.tsx
│   │   │   │   ├── playback-controls.tsx
│   │   │   │   └── speed-selector.tsx
│   │   │   │
│   │   │   └── settings/        # Settings components
│   │   │       ├── canvas-settings.tsx
│   │   │       ├── font-settings.tsx
│   │   │       ├── tooltip-settings.tsx
│   │   │       └── anki-settings.tsx
│   │   │
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── use-tokenize.ts
│   │   │   ├── use-dictionary.ts
│   │   │   ├── use-audio.ts
│   │   │   ├── use-canvas-settings.ts
│   │   │   ├── use-tooltip-position.ts
│   │   │   ├── use-keyboard-nav.ts
│   │   │   └── use-reading-session.ts
│   │   │
│   │   ├── stores/              # Zustand stores
│   │   │   ├── canvas-store.ts
│   │   │   ├── settings-store.ts
│   │   │   ├── session-store.ts
│   │   │   └── audio-store.ts
│   │   │
│   │   ├── services/            # API client functions
│   │   │   ├── api-client.ts    # Base fetch wrapper
│   │   │   ├── tokenize.ts
│   │   │   ├── dictionary.ts
│   │   │   ├── audio.ts
│   │   │   ├── content.ts
│   │   │   ├── progress.ts
│   │   │   ├── anki.ts
│   │   │   └── settings.ts
│   │   │
│   │   ├── types/               # TypeScript type definitions
│   │   │   ├── api.ts           # API response types
│   │   │   ├── token.ts
│   │   │   ├── dictionary.ts
│   │   │   ├── content.ts
│   │   │   ├── progress.ts
│   │   │   └── settings.ts
│   │   │
│   │   ├── lib/                 # Utility libraries
│   │   │   ├── utils.ts         # General utilities (cn, etc.)
│   │   │   ├── constants.ts
│   │   │   └── query-client.ts  # TanStack Query setup
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   └── tests/
│       ├── setup.ts
│       ├── components/
│       └── hooks/
│
├── shared/                      # Shared types/constants (optional)
│   └── constants.ts
│
└── data/                        # User data directory
    ├── .gitkeep
    ├── joutatsu.db              # SQLite database
    ├── audio_cache/             # Cached TTS audio
    ├── content/                 # Imported books/PDFs
    └── exports/                 # User exports
```

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   UserSettings  │     │    Content      │     │  ReadingSession │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │◄────│ content_id      │
│ canvas_font     │     │ title           │     │ id              │
│ canvas_size     │     │ source_type     │     │ started_at      │
│ tooltip_delay   │     │ file_path       │     │ ended_at        │
│ furigana_mode   │     │ created_at      │     │ tokens_read     │
│ ...             │     │ difficulty_est  │     │ lookups_count   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                               ┌─────────────────────────┘
                               │
                               ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vocabulary    │     │ SessionLookup   │     │ VocabularyScore │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │◄────│ vocabulary_id   │     │ vocabulary_id   │
│ surface         │     │ session_id      │◄────│ score           │
│ reading         │     │ looked_up_at    │     │ last_seen       │
│ dictionary_form │     │ context         │     │ times_seen      │
│ jmdict_id       │     └─────────────────┘     │ times_looked_up │
│ pitch_accent    │                             │ source          │
│ source          │◄────────────────────────────│ (anki/reading)  │
│ anki_note_id    │                             └─────────────────┘
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ GrammarPattern  │     │  ContentChunk   │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ pattern         │     │ content_id      │
│ jlpt_level      │     │ chunk_index     │
│ explanation     │     │ raw_text        │
│ examples        │     │ tokenized_json  │
└─────────────────┘     │ page_number     │
                        └─────────────────┘
```

### 4.2 Model Definitions

```python
# backend/app/models/vocabulary.py

from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class VocabularySource(str, Enum):
    ANKI = "anki"
    READING = "reading"
    MANUAL = "manual"

class Vocabulary(SQLModel, table=True):
    __tablename__ = "vocabulary"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    surface: str = Field(index=True)
    reading: str = Field(index=True)
    dictionary_form: str = Field(index=True)
    jmdict_id: Optional[int] = Field(default=None)
    pitch_accent: Optional[str] = Field(default=None)
    source: VocabularySource = Field(default=VocabularySource.READING)
    anki_note_id: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

```python
# backend/app/models/progress.py

class VocabularyScore(SQLModel, table=True):
    __tablename__ = "vocabulary_scores"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    vocabulary_id: int = Field(foreign_key="vocabulary.id", index=True)
    score: float = Field(default=0.0)  # 0.0 to 1.0
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    times_seen: int = Field(default=0)
    times_looked_up: int = Field(default=0)
    consecutive_correct: int = Field(default=0)
```

```python
# backend/app/models/content.py

class ContentType(str, Enum):
    TEXT = "text"
    PDF = "pdf"
    EPUB = "epub"
    URL = "url"

class Content(SQLModel, table=True):
    __tablename__ = "content"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    source_type: ContentType
    file_path: Optional[str] = Field(default=None)
    original_url: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    difficulty_estimate: Optional[float] = Field(default=None)
    total_tokens: int = Field(default=0)
    unique_vocabulary: int = Field(default=0)
```

```python
# backend/app/models/session.py

class ReadingSession(SQLModel, table=True):
    __tablename__ = "reading_sessions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    content_id: int = Field(foreign_key="content.id", index=True)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = Field(default=None)
    tokens_read: int = Field(default=0)
    lookups_count: int = Field(default=0)
    chunk_position: int = Field(default=0)  # Resume position
```

```python
# backend/app/models/user_settings.py

class FuriganaMode(str, Enum):
    ALWAYS = "always"
    NEVER = "never"
    HOVER = "hover"
    UNKNOWN_ONLY = "unknown_only"

class UserSettings(SQLModel, table=True):
    __tablename__ = "user_settings"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Canvas settings
    canvas_font_family: str = Field(default="Noto Sans JP")
    canvas_font_size: int = Field(default=20)
    canvas_line_height: float = Field(default=1.8)
    canvas_max_width: int = Field(default=800)
    
    # Tooltip settings
    tooltip_delay_ms: int = Field(default=300)
    tooltip_show_pitch: bool = Field(default=True)
    tooltip_show_examples: bool = Field(default=True)
    tooltip_ai_context: bool = Field(default=False)
    
    # Reading settings
    furigana_mode: FuriganaMode = Field(default=FuriganaMode.UNKNOWN_ONLY)
    highlight_unknown: bool = Field(default=True)
    
    # Audio settings
    tts_voice: str = Field(default="ja-JP-NanamiNeural")
    tts_speed: float = Field(default=1.0)
    
    # Anki settings
    anki_enabled: bool = Field(default=False)
    anki_deck_name: Optional[str] = Field(default=None)
    anki_field_expression: str = Field(default="Expression")
    anki_field_reading: str = Field(default="Reading")
```

---

## 5. API Specification

### 5.1 Base URL

```
Development: http://localhost:8000/api
Production:  http://localhost:8000/api
```

### 5.2 Endpoints

#### Tokenization

```yaml
POST /api/tokenize
  description: Tokenize Japanese text
  request:
    body:
      text: string (required)
      mode: "A" | "B" | "C" (default: "C")
  response:
    tokens:
      - surface: string
        dictionary_form: string
        reading: string
        part_of_speech: string[]
        start_pos: number
        end_pos: number
        is_known: boolean
        jmdict_id: number | null

POST /api/tokenize/batch
  description: Tokenize multiple texts
  request:
    body:
      texts: string[]
      mode: "A" | "B" | "C"
  response:
    results: TokenizeResponse[]
```

#### Dictionary

```yaml
GET /api/dictionary/lookup
  description: Look up word in dictionary
  params:
    query: string (required)
    exact: boolean (default: false)
  response:
    entries:
      - id: number
        kanji: string[]
        readings: string[]
        senses:
          - glosses: string[]
            pos: string[]
            misc: string[]
            examples: string[]
        pitch_accent: string | null
        jlpt_level: number | null

GET /api/dictionary/pitch/{reading}
  description: Get pitch accent for reading
  response:
    reading: string
    patterns:
      - kanji: string
        pattern: string
        description: string
```

#### Audio

```yaml
POST /api/audio/synthesize
  description: Generate TTS audio
  request:
    body:
      text: string (required)
      voice: string (default: "ja-JP-NanamiNeural")
      speed: number (default: 1.0)
  response:
    audio_url: string
    cached: boolean
    duration_ms: number

GET /api/audio/cache/{hash}
  description: Retrieve cached audio file
  response: audio/mpeg binary
```

#### Content

```yaml
GET /api/content
  description: List all content
  params:
    type: ContentType (optional)
    sort: "created" | "title" | "difficulty" (default: "created")
    order: "asc" | "desc" (default: "desc")
  response:
    items:
      - id: number
        title: string
        source_type: string
        difficulty_estimate: number | null
        progress_percent: number
        created_at: string

POST /api/content/import
  description: Import new content
  request:
    body (multipart):
      file: File (optional)
      url: string (optional)
      title: string (required)
      type: ContentType (required)
  response:
    id: number
    title: string
    total_chunks: number

GET /api/content/{id}
  description: Get content details
  response:
    id: number
    title: string
    source_type: string
    chunks: ContentChunk[]
    metadata: object

GET /api/content/{id}/chunk/{index}
  description: Get specific chunk with tokens
  response:
    index: number
    raw_text: string
    tokens: Token[]
    has_next: boolean
    has_prev: boolean

DELETE /api/content/{id}
  description: Delete content
  response:
    success: boolean
```

#### Progress

```yaml
GET /api/progress/summary
  description: Get overall progress summary
  response:
    overall_score: number
    vocabulary_known: number
    vocabulary_learning: number
    total_tokens_read: number
    total_sessions: number
    streak_days: number
    weakest_areas:
      - category: string
        score: number
        examples: string[]

GET /api/progress/vocabulary
  description: Get vocabulary progress
  params:
    sort: "score" | "seen" | "recent"
    filter: "known" | "learning" | "new"
    limit: number (default: 50)
    offset: number (default: 0)
  response:
    items:
      - vocabulary_id: number
        surface: string
        reading: string
        score: number
        times_seen: number
        last_seen: string
    total: number

POST /api/progress/record-lookup
  description: Record a dictionary lookup
  request:
    body:
      vocabulary_id: number
      session_id: number
      context: string
  response:
    success: boolean
    new_score: number

POST /api/progress/record-read
  description: Record tokens as read
  request:
    body:
      session_id: number
      token_ids: number[]
  response:
    success: boolean
```

#### Sessions

```yaml
POST /api/sessions/start
  description: Start a reading session
  request:
    body:
      content_id: number
      chunk_index: number (default: 0)
  response:
    session_id: number
    started_at: string

POST /api/sessions/{id}/end
  description: End a reading session
  response:
    duration_seconds: number
    tokens_read: number
    lookups_count: number

GET /api/sessions/history
  description: Get session history
  params:
    limit: number (default: 20)
  response:
    sessions:
      - id: number
        content_title: string
        started_at: string
        duration_seconds: number
        tokens_read: number
```

#### Anki

```yaml
GET /api/anki/status
  description: Check AnkiConnect status
  response:
    connected: boolean
    version: number | null
    error: string | null

POST /api/anki/sync
  description: Sync vocabulary from Anki
  request:
    body:
      deck_name: string
      field_expression: string
      field_reading: string
  response:
    imported: number
    updated: number
    errors: string[]

GET /api/anki/decks
  description: List available Anki decks
  response:
    decks: string[]
```

#### Settings

```yaml
GET /api/settings
  description: Get all settings
  response: UserSettings

PATCH /api/settings
  description: Update settings
  request:
    body: Partial<UserSettings>
  response: UserSettings

POST /api/settings/reset
  description: Reset to defaults
  response: UserSettings
```

---

## 6. Frontend Architecture

### 6.1 Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── ScoreDisplay (mini)
│   └── Sidebar
│       ├── NavLink (Dashboard)
│       ├── NavLink (Read)
│       ├── NavLink (Library)
│       ├── NavLink (Listen)
│       ├── NavLink (Progress)
│       └── NavLink (Settings)
│
├── Pages
│   ├── Dashboard (/)
│   │   ├── WelcomeCard
│   │   ├── RecentActivity
│   │   ├── QuickStats
│   │   └── ContinueReading
│   │
│   ├── Read (/read/[contentId])
│   │   ├── ReadingCanvas
│   │   │   ├── SentenceBlock
│   │   │   │   └── TokenDisplay (×n)
│   │   │   └── CanvasControls
│   │   ├── WordTooltip (portal)
│   │   │   ├── TooltipContent
│   │   │   │   ├── DefinitionList
│   │   │   │   ├── PitchDisplay
│   │   │   │   └── ExampleSentences
│   │   │   └── TooltipActions
│   │   └── ReadingProgress
│   │
│   ├── Library (/library)
│   │   ├── ContentFilters
│   │   ├── ContentGrid
│   │   │   └── ContentCard (×n)
│   │   └── ImportModal
│   │
│   ├── Listen (/listen)
│   │   ├── AudioPlayer
│   │   │   ├── PlaybackControls
│   │   │   └── SpeedSelector
│   │   └── TranscriptDisplay
│   │
│   ├── Progress (/progress)
│   │   ├── ScoreDisplay (full)
│   │   ├── StatsGrid
│   │   │   └── StatsCard (×n)
│   │   ├── WeaknessChart
│   │   ├── VocabularyTable
│   │   └── SessionHistory
│   │
│   └── Settings (/settings)
│       ├── CanvasSettings
│       ├── FontSettings
│       ├── TooltipSettings
│       ├── AudioSettings
│       └── AnkiSettings
```

### 6.2 State Management

#### Zustand Stores

```typescript
// stores/canvas-store.ts
interface CanvasState {
  currentContent: Content | null
  currentChunk: number
  tokens: Token[]
  hoveredToken: Token | null
  selectedToken: Token | null
  
  // Actions
  setContent: (content: Content) => void
  setChunk: (index: number) => void
  setHoveredToken: (token: Token | null) => void
  selectToken: (token: Token | null) => void
}

// stores/session-store.ts
interface SessionState {
  activeSession: Session | null
  tokensRead: Set<number>
  lookups: Lookup[]
  
  // Actions
  startSession: (contentId: number) => Promise<void>
  endSession: () => Promise<void>
  recordRead: (tokenIds: number[]) => void
  recordLookup: (vocabularyId: number, context: string) => void
}

// stores/settings-store.ts
interface SettingsState {
  settings: UserSettings
  isLoading: boolean
  
  // Actions
  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}
```

#### TanStack Query Keys

```typescript
// lib/query-keys.ts
export const queryKeys = {
  tokenize: (text: string) => ['tokenize', text] as const,
  dictionary: {
    lookup: (query: string) => ['dictionary', 'lookup', query] as const,
    pitch: (reading: string) => ['dictionary', 'pitch', reading] as const,
  },
  content: {
    all: ['content'] as const,
    detail: (id: number) => ['content', id] as const,
    chunk: (id: number, index: number) => ['content', id, 'chunk', index] as const,
  },
  progress: {
    summary: ['progress', 'summary'] as const,
    vocabulary: (params: VocabParams) => ['progress', 'vocabulary', params] as const,
  },
  sessions: {
    history: ['sessions', 'history'] as const,
  },
  settings: ['settings'] as const,
  anki: {
    status: ['anki', 'status'] as const,
    decks: ['anki', 'decks'] as const,
  },
}
```

### 6.3 Hook Patterns

```typescript
// hooks/use-dictionary.ts
export function useDictionaryLookup(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.dictionary.lookup(query),
    queryFn: () => dictionaryService.lookup(query),
    enabled: options?.enabled ?? !!query,
    staleTime: Infinity, // Dictionary data doesn't change
  })
}

// hooks/use-tooltip-position.ts
export function useTooltipPosition(
  targetRef: RefObject<HTMLElement>,
  tooltipRef: RefObject<HTMLElement>
) {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [placement, setPlacement] = useState<Placement>('bottom')
  
  // Calculate optimal position avoiding viewport edges
  useEffect(() => {
    // Implementation
  }, [targetRef.current, tooltipRef.current])
  
  return { position, placement }
}

// hooks/use-reading-session.ts
export function useReadingSession(contentId: number) {
  const session = useSessionStore((s) => s.activeSession)
  const startSession = useSessionStore((s) => s.startSession)
  const endSession = useSessionStore((s) => s.endSession)
  
  useEffect(() => {
    startSession(contentId)
    return () => { endSession() }
  }, [contentId])
  
  return { session }
}
```

---

## 7. Core Services

### 7.1 Tokenizer Service

```python
# backend/app/services/tokenizer_service.py

from sudachipy import tokenizer, dictionary
from app.schemas.tokenize import Token, TokenizeRequest, TokenizeResponse
from app.repositories.vocabulary_repo import VocabularyRepository

class TokenizerService:
    def __init__(self, vocab_repo: VocabularyRepository):
        self._tokenizer = dictionary.Dictionary(dict_type="core").create()
        self._vocab_repo = vocab_repo
    
    async def tokenize(self, request: TokenizeRequest) -> TokenizeResponse:
        mode = self._get_mode(request.mode)
        tokens = []
        
        for morpheme in self._tokenizer.tokenize(request.text, mode):
            is_known = await self._vocab_repo.is_known(morpheme.dictionary_form())
            tokens.append(Token(
                surface=morpheme.surface(),
                dictionary_form=morpheme.dictionary_form(),
                reading=morpheme.reading_form(),
                part_of_speech=list(morpheme.part_of_speech()),
                start_pos=morpheme.begin(),
                end_pos=morpheme.end(),
                is_known=is_known,
            ))
        
        return TokenizeResponse(tokens=tokens)
    
    def _get_mode(self, mode_str: str):
        modes = {
            "A": tokenizer.Tokenizer.SplitMode.A,
            "B": tokenizer.Tokenizer.SplitMode.B,
            "C": tokenizer.Tokenizer.SplitMode.C,
        }
        return modes.get(mode_str, tokenizer.Tokenizer.SplitMode.C)
```

### 7.2 Dictionary Service

```python
# backend/app/services/dictionary_service.py

from jamdict import Jamdict
from app.core.cache import cache
from app.schemas.dictionary import DictionaryEntry, LookupResponse

class DictionaryService:
    def __init__(self, pitch_data_path: str):
        self._jam = Jamdict()
        self._pitch_data = self._load_pitch_data(pitch_data_path)
    
    @cache(ttl=3600)
    async def lookup(self, query: str, exact: bool = False) -> LookupResponse:
        result = self._jam.lookup(query)
        entries = []
        
        for entry in result.entries:
            pitch = self._get_pitch_accent(entry.kana_forms[0].text if entry.kana_forms else query)
            entries.append(DictionaryEntry(
                id=entry.idseq,
                kanji=[k.text for k in entry.kanji_forms],
                readings=[r.text for r in entry.kana_forms],
                senses=[...],  # Process senses
                pitch_accent=pitch,
            ))
        
        return LookupResponse(entries=entries)
    
    def _get_pitch_accent(self, reading: str) -> str | None:
        return self._pitch_data.get(reading)
    
    def _load_pitch_data(self, path: str) -> dict[str, str]:
        # Load Kanjium data
        ...
```

### 7.3 Scoring Service

```python
# backend/app/services/scoring_service.py

from datetime import datetime, timedelta
from app.models.progress import VocabularyScore
from app.repositories.progress_repo import ProgressRepository

class ScoringService:
    """
    Scoring algorithm based on:
    - Times seen vs times looked up ratio
    - Recency of last encounter
    - Consecutive correct readings
    - Source weight (Anki mature > Anki learning > reading)
    """
    
    def __init__(self, progress_repo: ProgressRepository):
        self._repo = progress_repo
    
    async def calculate_score(self, vocab_id: int) -> float:
        score_record = await self._repo.get_score(vocab_id)
        if not score_record:
            return 0.0
        
        # Base score from lookup ratio
        if score_record.times_seen == 0:
            lookup_ratio = 1.0
        else:
            lookup_ratio = score_record.times_looked_up / score_record.times_seen
        
        base_score = 1.0 - min(lookup_ratio, 1.0)
        
        # Recency bonus (decays over 30 days)
        days_since = (datetime.utcnow() - score_record.last_seen).days
        recency_factor = max(0, 1 - (days_since / 30))
        
        # Consecutive correct bonus
        streak_bonus = min(score_record.consecutive_correct * 0.05, 0.2)
        
        # Combine factors
        final_score = (base_score * 0.6) + (recency_factor * 0.3) + streak_bonus
        
        return min(max(final_score, 0.0), 1.0)
    
    async def record_lookup(self, vocab_id: int, session_id: int):
        await self._repo.increment_lookup(vocab_id)
        await self._repo.reset_streak(vocab_id)
        await self._repo.update_last_seen(vocab_id)
    
    async def record_read_without_lookup(self, vocab_id: int):
        await self._repo.increment_seen(vocab_id)
        await self._repo.increment_streak(vocab_id)
        await self._repo.update_last_seen(vocab_id)
    
    async def get_weakest_vocabulary(self, limit: int = 20) -> list[VocabularyScore]:
        return await self._repo.get_lowest_scores(limit)
    
    async def get_overall_score(self) -> float:
        """Weighted average of all vocabulary scores."""
        scores = await self._repo.get_all_scores()
        if not scores:
            return 0.0
        
        total_weight = sum(s.times_seen for s in scores)
        if total_weight == 0:
            return 0.0
        
        weighted_sum = sum(s.score * s.times_seen for s in scores)
        return weighted_sum / total_weight
```

### 7.4 Audio Service

```python
# backend/app/services/audio_service.py

import hashlib
import asyncio
from pathlib import Path
import edge_tts
from app.config import settings

class AudioService:
    def __init__(self, cache_dir: Path):
        self._cache_dir = cache_dir
        self._cache_dir.mkdir(parents=True, exist_ok=True)
    
    async def synthesize(
        self, 
        text: str, 
        voice: str = "ja-JP-NanamiNeural",
        speed: float = 1.0
    ) -> tuple[str, bool]:
        """Returns (audio_path, was_cached)."""
        
        cache_key = self._get_cache_key(text, voice, speed)
        cache_path = self._cache_dir / f"{cache_key}.mp3"
        
        if cache_path.exists():
            return str(cache_path), True
        
        rate = f"{int((speed - 1) * 100):+d}%"
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        await communicate.save(str(cache_path))
        
        return str(cache_path), False
    
    def _get_cache_key(self, text: str, voice: str, speed: float) -> str:
        content = f"{text}|{voice}|{speed}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def get_cached_audio(self, cache_key: str) -> Path | None:
        path = self._cache_dir / f"{cache_key}.mp3"
        return path if path.exists() else None
```

---

## 8. Data Flow

### 8.1 Reading Flow

```
User opens content
        │
        ▼
┌─────────────────┐
│ GET /content/1  │
│ /chunk/0        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ TokenizerService│────▶│ VocabularyRepo  │
│ tokenize()      │     │ check is_known  │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Frontend Canvas │
│ renders tokens  │
└────────┬────────┘
         │
    User hovers token
         │
         ▼
┌─────────────────┐
│ GET /dictionary │
│ /lookup?query=  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│DictionaryService│────▶│ Pitch Data      │
│ lookup()        │     │ (Kanjium)       │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ WordTooltip     │
│ displays info   │
└────────┬────────┘
         │
    User reads (no lookup)
    OR looks up definition
         │
         ▼
┌─────────────────┐
│ ScoringService  │
│ record event    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ProgressRepo    │
│ update scores   │
└─────────────────┘
```

### 8.2 Anki Sync Flow

```
User initiates sync
        │
        ▼
┌─────────────────┐
│ GET /anki/status│
└────────┬────────┘
         │
    AnkiConnect running?
         │
    ┌────┴────┐
    No       Yes
    │         │
    ▼         ▼
  Error   ┌─────────────────┐
  shown   │ POST /anki/sync │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ AnkiService     │
          │ fetch cards     │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ For each card:  │
          │ - Extract vocab │
          │ - Check mature  │
          │ - Set source    │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ VocabularyRepo  │
          │ upsert records  │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Return summary  │
          │ imported/updated│
          └─────────────────┘
```

---

## 9. Conventions

### 9.1 File Naming

| Type | Convention | Example |
|------|------------|---------|
| Python modules | snake_case | `tokenizer_service.py` |
| Python classes | PascalCase | `TokenizerService` |
| TypeScript files | kebab-case | `reading-canvas.tsx` |
| React components | PascalCase | `ReadingCanvas` |
| Hooks | camelCase with use- prefix | `useTokenize.ts` |
| Stores | kebab-case with -store suffix | `canvas-store.ts` |
| Types | PascalCase | `Token`, `DictionaryEntry` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_TOKENS_PER_CHUNK` |

### 9.2 Code Organization

#### Python Files (max ~150 lines)

```python
# 1. Imports (stdlib, third-party, local)
# 2. Constants
# 3. Type definitions
# 4. Main class/functions
# 5. Helper functions (private)
```

#### TypeScript Component Files (max ~100 lines)

```typescript
// 1. Imports
// 2. Types/interfaces (component-specific only)
// 3. Component definition
// 4. Export
```

#### TypeScript Hook Files (max ~80 lines)

```typescript
// 1. Imports
// 2. Types
// 3. Hook implementation
// 4. Export
```

### 9.3 Import Order

**Python:**
```python
# Standard library
import os
from datetime import datetime

# Third-party
from fastapi import APIRouter, Depends
from sqlmodel import Session

# Local - absolute imports only
from app.services.tokenizer_service import TokenizerService
from app.schemas.tokenize import TokenizeRequest
```

**TypeScript:**
```typescript
// React/Next
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Third-party
import { useQuery } from '@tanstack/react-query'

// Components
import { Button } from '@/components/ui/button'

// Hooks/stores
import { useTokenize } from '@/hooks/use-tokenize'

// Services/utils
import { tokenizeService } from '@/services/tokenize'

// Types
import type { Token } from '@/types/token'
```

### 9.4 Error Handling

**Backend:**
```python
# Use custom exceptions
from app.core.exceptions import NotFoundError, ValidationError

# In services
if not content:
    raise NotFoundError(f"Content {id} not found")

# Global handler converts to HTTP responses
```

**Frontend:**
```typescript
// Use TanStack Query error handling
const { data, error, isError } = useQuery(...)

// Display with error boundary or inline
if (isError) {
  return <ErrorDisplay error={error} />
}
```

### 9.5 Testing Conventions

**Backend tests:**
```python
# tests/unit/services/test_tokenizer_service.py

import pytest
from app.services.tokenizer_service import TokenizerService

class TestTokenizerService:
    @pytest.fixture
    def service(self, mock_vocab_repo):
        return TokenizerService(mock_vocab_repo)
    
    async def test_tokenize_simple_sentence(self, service):
        result = await service.tokenize(TokenizeRequest(text="日本語"))
        assert len(result.tokens) == 1
        assert result.tokens[0].surface == "日本語"
    
    async def test_tokenize_marks_known_vocabulary(self, service, mock_vocab_repo):
        mock_vocab_repo.is_known.return_value = True
        result = await service.tokenize(TokenizeRequest(text="食べる"))
        assert result.tokens[0].is_known is True
```

---

## 10. Implementation Phases

### Phase 0: Foundation (Week 1)

```
JOUT-001: Initialize monorepo structure
JOUT-002: Setup backend with FastAPI + SQLModel
JOUT-003: Setup frontend with Next.js + Tailwind + shadcn
JOUT-004: Configure development scripts
JOUT-005: Setup pytest + vitest
JOUT-006: Create database models
JOUT-007: Setup reference data download script
JOUT-008: Configure static file serving for production
```

### Phase 1: Core Reading (Week 2-3)

```
JOUT-101: Implement TokenizerService
JOUT-102: Create tokenize API routes
JOUT-103: Implement DictionaryService  
JOUT-104: Create dictionary API routes
JOUT-105: Build ReadingCanvas component
JOUT-106: Build TokenDisplay component
JOUT-107: Build WordTooltip component
JOUT-108: Implement tooltip positioning logic
JOUT-109: Build TooltipContent with definitions
JOUT-110: Add PitchDisplay component
JOUT-111: Create useTokenize hook
JOUT-112: Create useDictionaryLookup hook
JOUT-113: Integrate canvas with API
```

### Phase 2: Data Layer (Week 4)

```
JOUT-201: Setup JMdict with jamdict
JOUT-202: Load Kanjium pitch accent data
JOUT-203: Implement VocabularyRepository
JOUT-204: Implement ContentRepository
JOUT-205: Create ContentService
JOUT-206: Build content import (text)
JOUT-207: Build content import (PDF) 
JOUT-208: Create content API routes
JOUT-209: Build Library page
JOUT-210: Build ContentCard component
JOUT-211: Build ImportModal component
```

### Phase 3: Progress System (Week 5)

```
JOUT-301: Implement ProgressRepository
JOUT-302: Implement ScoringService
JOUT-303: Create progress API routes
JOUT-304: Implement SessionRepository
JOUT-305: Create session API routes
JOUT-306: Build useReadingSession hook
JOUT-307: Integrate scoring with reading
JOUT-308: Build Progress page
JOUT-309: Build ScoreDisplay component
JOUT-310: Build WeaknessChart component
JOUT-311: Build SessionHistory component
```

### Phase 4: Anki Integration (Week 6)

```
JOUT-401: Implement AnkiService
JOUT-402: Create Anki API routes
JOUT-403: Build AnkiSettings component
JOUT-404: Implement vocabulary sync
JOUT-405: Mark known words in canvas
JOUT-406: Build sync status UI
```

### Phase 5: Audio (Week 7)

```
JOUT-501: Implement AudioService
JOUT-502: Create audio API routes
JOUT-503: Build AudioPlayer component
JOUT-504: Build useAudio hook
JOUT-505: Integrate TTS with reading
JOUT-506: Build Listen page
JOUT-507: Implement audio caching
```

### Phase 6: Settings & Polish (Week 8)

```
JOUT-601: Implement SettingsService
JOUT-602: Create settings API routes
JOUT-603: Build Settings page
JOUT-604: Build CanvasSettings component
JOUT-605: Build FontSettings component
JOUT-606: Build TooltipSettings component
JOUT-607: Apply settings to canvas
JOUT-608: Build Dashboard page
JOUT-609: Performance optimization
JOUT-610: Error handling polish
JOUT-611: Loading states polish
JOUT-612: Final testing pass
```

---

## Appendix A: Task Template

```markdown
## Task ID: JOUT-XXX

### Context
- Reference: ARCHITECTURE.md Section X.X
- Depends on: JOUT-XXX | None
- Branch: feature/xxx

### Objective
[Single sentence: what this task produces]

### Input
[Files/state that exist before this task]

### Output
[Exact files to create/modify with full paths]

### Implementation Notes
[Key technical details, patterns to follow]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests pass
- [ ] Types check
- [ ] Lint passes

### Constraints
- Must follow conventions in Section 9
- Max file length: X lines
- Must not modify: [protected files]
```

---

## Appendix B: Environment Variables

```bash
# backend/.env
DATABASE_URL=sqlite:///./data/joutatsu.db
DATA_DIR=./data
AUDIO_CACHE_DIR=./data/audio_cache
CONTENT_DIR=./data/content
JMDICT_PATH=./data/jmdict
PITCH_DATA_PATH=./data/pitch/kanjium.tsv
LOG_LEVEL=INFO

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
```

---

## Appendix B2: OpenRouter Integration

### Configuration

OpenRouter is used for AI-powered features. The SDK is the standard OpenAI SDK pointed at OpenRouter's base URL.

```typescript
// frontend/src/services/ai/openrouter-client.ts
import OpenAI from 'openai'

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'Joutatsu',
  },
})
```

### AI Service Structure

```
/frontend/src/services/ai/
├── openrouter-client.ts    # OpenRouter SDK instance
├── context-meaning.ts      # Contextual word explanations
├── pdf-cleanup.ts          # PDF text reordering
├── difficulty-estimate.ts  # Content difficulty analysis
└── grammar-explain.ts      # Grammar pattern explanations
```

### Service Implementations

```typescript
// frontend/src/services/ai/context-meaning.ts
import { openrouter } from './openrouter-client'

export interface ContextMeaningRequest {
  word: string
  reading: string
  context: string  // Surrounding sentence
}

export interface ContextMeaningResponse {
  explanation: string
  nuance: string | null
  similar_words: string[]
}

export async function getContextualMeaning(
  request: ContextMeaningRequest
): Promise<ContextMeaningResponse> {
  const response = await openrouter.chat.completions.create({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      {
        role: 'system',
        content: `You are a Japanese language expert helping a learner understand vocabulary in context.
Given a word and its surrounding context, explain:
1. The specific meaning in this context
2. Any nuance or connotation
3. 2-3 similar words if relevant

Respond in JSON format:
{"explanation": "...", "nuance": "..." or null, "similar_words": ["...", "..."]}`,
      },
      {
        role: 'user',
        content: `Word: ${request.word} (${request.reading})
Context: ${request.context}`,
      },
    ],
    max_tokens: 300,
    response_format: { type: 'json_object' },
  })
  
  return JSON.parse(response.choices[0].message.content ?? '{}')
}
```

```typescript
// frontend/src/services/ai/pdf-cleanup.ts
import { openrouter } from './openrouter-client'

export async function cleanPdfText(rawText: string): Promise<string> {
  const response = await openrouter.chat.completions.create({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      {
        role: 'system',
        content: `You are a text processing assistant for Japanese documents.
Clean and reorder the following text extracted from a PDF:
- Fix extraction artifacts and garbled characters
- Reorder text for proper reading flow (handle vertical text)
- Remove headers, footers, page numbers
- Preserve paragraph breaks
- Return ONLY the cleaned Japanese text, no explanations`,
      },
      {
        role: 'user',
        content: rawText,
      },
    ],
    max_tokens: 4000,
  })
  
  return response.choices[0].message.content ?? rawText
}
```

```typescript
// frontend/src/services/ai/grammar-explain.ts
import { openrouter } from './openrouter-client'

export interface GrammarExplanation {
  pattern: string
  meaning: string
  formation: string
  examples: string[]
  jlpt_level: string | null
}

export async function explainGrammar(
  sentence: string,
  highlight: string
): Promise<GrammarExplanation> {
  const response = await openrouter.chat.completions.create({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      {
        role: 'system',
        content: `You are a Japanese grammar expert. Explain the grammar pattern used in the highlighted portion.
Respond in JSON:
{"pattern": "...", "meaning": "...", "formation": "...", "examples": ["...", "..."], "jlpt_level": "N3" or null}`,
      },
      {
        role: 'user',
        content: `Sentence: ${sentence}
Explain this part: ${highlight}`,
      },
    ],
    max_tokens: 400,
    response_format: { type: 'json_object' },
  })
  
  return JSON.parse(response.choices[0].message.content ?? '{}')
}
```

### Model Selection

| Feature | Model | Rationale |
|---------|-------|-----------|
| Context meanings | `anthropic/claude-3.5-sonnet` | Best Japanese understanding |
| PDF cleanup | `anthropic/claude-3.5-sonnet` | Good at text reconstruction |
| Grammar explanations | `anthropic/claude-3.5-sonnet` | Detailed, accurate |
| Bulk/cheap operations | `anthropic/claude-3-haiku` | Cost-effective |

### Frontend Integration

```typescript
// hooks/use-context-meaning.ts
import { useQuery } from '@tanstack/react-query'
import { getContextualMeaning } from '@/services/ai/context-meaning'
import { queryKeys } from '@/lib/query-keys'

export function useContextMeaning(
  word: string,
  reading: string,
  context: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.ai.contextMeaning(word, context),
    queryFn: () => getContextualMeaning({ word, reading, context }),
    enabled: options?.enabled ?? false,  // Only fetch when explicitly requested
    staleTime: Infinity,  // Cache indefinitely
  })
}
```

### Query Keys Update

```typescript
// lib/query-keys.ts
export const queryKeys = {
  // ... existing keys
  ai: {
    contextMeaning: (word: string, context: string) => 
      ['ai', 'context-meaning', word, context] as const,
    grammarExplain: (sentence: string, highlight: string) =>
      ['ai', 'grammar', sentence, highlight] as const,
  },
}
```

### Cost Management

- AI features are **opt-in** via settings (tooltip_ai_context: boolean)
- Results are cached aggressively (staleTime: Infinity)
- Batch requests where possible
- User can see estimated cost in settings

---

## Appendix C: Scripts

```json
// Root package.json
{
  "scripts": {
    "dev": "concurrently \"pnpm run dev:backend\" \"pnpm run dev:frontend\"",
    "dev:backend": "cd backend && uv run python -m scripts.dev",
    "dev:frontend": "cd frontend && pnpm dev",
    "build": "pnpm run build:frontend && pnpm run build:backend",
    "build:frontend": "cd frontend && pnpm build",
    "build:backend": "echo 'No build step for backend'",
    "start": "cd backend && uv run python -m app.main",
    "test": "pnpm run test:backend && pnpm run test:frontend",
    "test:backend": "cd backend && uv run pytest",
    "test:frontend": "cd frontend && pnpm test",
    "lint": "pnpm run lint:backend && pnpm run lint:frontend",
    "lint:backend": "cd backend && uv run ruff check .",
    "lint:frontend": "cd frontend && pnpm lint",
    "setup": "pnpm install && cd backend && uv sync && uv run python -m scripts.setup_data"
  }
}
```
