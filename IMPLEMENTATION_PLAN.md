# Joutatsu - Implementation Plan

> **Reference**: ARCHITECTURE.md v1.0.0
> **Total Tasks**: 82
> **Estimated Duration**: 10 weeks

---

## How to Use This Document

Each task follows a strict template. When assigning a task to AI:

1. Copy the entire task block
2. Include relevant sections from ARCHITECTURE.md
3. AI produces only the specified outputs
4. Verify acceptance criteria before marking complete

---

## Phase 0: Foundation (Week 1)

### JOUT-001: Initialize monorepo structure

**Context**
- Reference: ARCHITECTURE.md Section 3
- Depends on: None
- Branch: main

**Objective**
Create the base monorepo folder structure with configuration files.

**Output**
```
/joutatsu
├── README.md
├── .gitignore
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── backend/.gitkeep
├── frontend/.gitkeep
├── shared/constants.ts
└── data/.gitkeep
```

**Acceptance Criteria**
- [ ] All folders created
- [ ] pnpm install works from root
- [ ] .gitignore covers Python, Node, IDE, data/*

---

### JOUT-002: Setup backend with FastAPI + SQLModel

**Context**
- Reference: ARCHITECTURE.md Section 2.1, 3
- Depends on: JOUT-001
- Branch: feature/backend-setup

**Objective**
Initialize Python backend with FastAPI, SQLModel, and core structure.

**Output**
```
/backend
├── pyproject.toml
├── pytest.ini
├── .env
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── dependencies.py
│   ├── api/__init__.py
│   ├── api/router.py
│   ├── models/__init__.py
│   ├── models/base.py
│   ├── schemas/__init__.py
│   ├── services/__init__.py
│   ├── repositories/__init__.py
│   ├── repositories/base.py
│   ├── core/__init__.py
│   ├── core/database.py
│   ├── core/exceptions.py
│   ├── core/logging.py
│   ├── core/events.py
│   └── utils/__init__.py
└── tests/
    ├── __init__.py
    └── conftest.py
```

**Key Dependencies**
- fastapi>=0.109.0
- uvicorn[standard]>=0.27.0
- sqlmodel>=0.0.14
- pydantic-settings>=2.1.0
- aiosqlite>=0.19.0

**Acceptance Criteria**
- [ ] `uv sync` installs dependencies
- [ ] `uv run python -m app.main` starts on port 8000
- [ ] GET /health returns {"status": "ok"}
- [ ] Database created on startup

---

### JOUT-003: Setup frontend with Next.js + Tailwind + shadcn

**Context**
- Reference: ARCHITECTURE.md Section 2.2, 3
- Depends on: JOUT-001
- Branch: feature/frontend-setup

**Objective**
Initialize Next.js 14 with static export, Tailwind, shadcn/ui, TanStack Query, Zustand.

**Output**
```
/frontend
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── components.json
├── .env.local
├── src/app/layout.tsx
├── src/app/page.tsx
├── src/app/globals.css
├── src/components/ui/button.tsx
├── src/services/api-client.ts
├── src/types/api.ts
├── src/lib/utils.ts
└── src/lib/query-client.ts
```

**Acceptance Criteria**
- [ ] `pnpm dev` starts on port 3000
- [ ] `pnpm build` produces static export
- [ ] shadcn components work
- [ ] TypeScript compiles

---

### JOUT-004: Configure development scripts

**Context**
- Reference: ARCHITECTURE.md Appendix C
- Depends on: JOUT-002, JOUT-003
- Branch: feature/dev-scripts

**Objective**
Setup root scripts for concurrent dev and production serving.

**Output**
```
Modified: /package.json
Created: /backend/scripts/dev.py
Modified: /backend/app/main.py (static file mounting)
```

**Acceptance Criteria**
- [ ] `pnpm dev` runs frontend + backend concurrently
- [ ] `pnpm build` builds frontend
- [ ] `pnpm start` serves via FastAPI
- [ ] `pnpm test` runs all tests
- [ ] `pnpm lint` lints all code

---

### JOUT-005: Setup pytest + vitest

**Context**
- Reference: ARCHITECTURE.md Section 9.5
- Depends on: JOUT-002, JOUT-003
- Branch: feature/testing-setup

**Objective**
Configure testing frameworks with fixtures.

**Output**
```
/backend/tests/conftest.py (fixtures)
/backend/tests/unit/test_example.py
/backend/tests/integration/test_health.py
/frontend/vitest.config.ts
/frontend/tests/setup.ts
/frontend/tests/components/button.test.tsx
```

**Acceptance Criteria**
- [ ] `uv run pytest` passes
- [ ] `pnpm test` passes
- [ ] In-memory test database works

---

### JOUT-006: Create database models

**Context**
- Reference: ARCHITECTURE.md Section 4
- Depends on: JOUT-002
- Branch: feature/db-models

**Objective**
Implement all SQLModel database models.

**Output**
```
/backend/app/models/
├── __init__.py
├── base.py
├── user_settings.py
├── vocabulary.py
├── content.py
├── session.py
└── progress.py
```

**Acceptance Criteria**
- [ ] All models from Section 4.2 implemented
- [ ] Tables created on startup
- [ ] Foreign keys work
- [ ] Enums serialize correctly

---

### JOUT-007: Setup reference data download script

**Context**
- Reference: Research Document
- Depends on: JOUT-002
- Branch: feature/setup-data

**Objective**
Create script to download JMdict, Kanjium, SudachiPy dictionaries.

**Output**
```
/backend/scripts/setup_data.py
/backend/data/jmdict/.gitkeep
/backend/data/pitch/.gitkeep
/backend/data/sudachi/.gitkeep
```

**Acceptance Criteria**
- [ ] `uv run python -m scripts.setup_data` downloads all data
- [ ] jamdict data installed
- [ ] Kanjium TSV downloaded
- [ ] SudachiPy dictionary ready

---

### JOUT-008: Configure static file serving

**Context**
- Reference: ARCHITECTURE.md Section 3
- Depends on: JOUT-004
- Branch: feature/static-serving

**Objective**
FastAPI serves built Next.js files in production.

**Output**
```
Modified: /backend/app/main.py
```

**Acceptance Criteria**
- [ ] After `pnpm build`, `pnpm start` serves frontend
- [ ] API routes still work at /api/*
- [ ] SPA routing works (404 → index.html)

---

## Phase 1: Core Reading (Week 2-3)

### JOUT-101: Implement TokenizerService

**Context**
- Reference: ARCHITECTURE.md Section 7.1
- Depends on: JOUT-006, JOUT-007
- Branch: feature/tokenizer-service

**Objective**
Create TokenizerService with SudachiPy integration.

**Output**
```
/backend/app/services/tokenizer_service.py
/backend/tests/unit/services/test_tokenizer_service.py
```

**Acceptance Criteria**
- [ ] Tokenizes Japanese text
- [ ] Returns Token objects with all fields
- [ ] Supports A/B/C split modes
- [ ] Marks known vocabulary
- [ ] Tests pass

---

### JOUT-102: Create tokenize API routes

**Context**
- Reference: ARCHITECTURE.md Section 5.2
- Depends on: JOUT-101
- Branch: feature/tokenize-api

**Objective**
Expose tokenization via REST API.

**Output**
```
/backend/app/api/routes/tokenize.py
/backend/app/schemas/tokenize.py
/backend/tests/integration/test_tokenize_api.py
```

**Acceptance Criteria**
- [ ] POST /api/tokenize works
- [ ] POST /api/tokenize/batch works
- [ ] Response matches schema
- [ ] Integration tests pass

---

### JOUT-103: Implement DictionaryService

**Context**
- Reference: ARCHITECTURE.md Section 7.2
- Depends on: JOUT-007
- Branch: feature/dictionary-service

**Objective**
Create DictionaryService with jamdict and Kanjium.

**Output**
```
/backend/app/services/dictionary_service.py
/backend/tests/unit/services/test_dictionary_service.py
```

**Acceptance Criteria**
- [ ] Looks up words in JMdict
- [ ] Returns pitch accent from Kanjium
- [ ] Caches results
- [ ] Tests pass

---

### JOUT-104: Create dictionary API routes

**Context**
- Reference: ARCHITECTURE.md Section 5.2
- Depends on: JOUT-103
- Branch: feature/dictionary-api

**Objective**
Expose dictionary lookup via REST API.

**Output**
```
/backend/app/api/routes/dictionary.py
/backend/app/schemas/dictionary.py
/backend/tests/integration/test_dictionary_api.py
```

**Acceptance Criteria**
- [ ] GET /api/dictionary/lookup works
- [ ] GET /api/dictionary/pitch/{reading} works
- [ ] Response matches schema

---

### JOUT-105: Build ReadingCanvas component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-003
- Branch: feature/reading-canvas

**Objective**
Create main reading canvas container component.

**Output**
```
/frontend/src/components/canvas/reading-canvas.tsx
/frontend/src/stores/canvas-store.ts
```

**Acceptance Criteria**
- [ ] Renders token list
- [ ] Handles scroll/pagination
- [ ] Connects to canvas store
- [ ] Applies font/size settings

---

### JOUT-106: Build TokenDisplay component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-105
- Branch: feature/token-display

**Objective**
Create individual token display with hover state.

**Output**
```
/frontend/src/components/canvas/token-display.tsx
/frontend/src/types/token.ts
```

**Acceptance Criteria**
- [ ] Displays surface text
- [ ] Shows furigana based on settings
- [ ] Highlights on hover
- [ ] Highlights unknown words
- [ ] Triggers tooltip on hover

---

### JOUT-107: Build WordTooltip component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-106
- Branch: feature/word-tooltip

**Objective**
Create tooltip container with smart positioning.

**Output**
```
/frontend/src/components/tooltip/word-tooltip.tsx
/frontend/src/hooks/use-tooltip-position.ts
```

**Acceptance Criteria**
- [ ] Appears on token hover
- [ ] Positions to avoid viewport edges
- [ ] Dismisses on mouse leave
- [ ] Uses portal for z-index

---

### JOUT-108: Implement tooltip positioning logic

**Context**
- Reference: ARCHITECTURE.md Section 6.3
- Depends on: JOUT-107
- Branch: feature/tooltip-position

**Objective**
Smart tooltip positioning that avoids edges.

**Output**
```
/frontend/src/hooks/use-tooltip-position.ts (complete)
```

**Acceptance Criteria**
- [ ] Calculates optimal position
- [ ] Flips when near edges
- [ ] Handles window resize
- [ ] Smooth transitions

---

### JOUT-109: Build TooltipContent with definitions

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-107
- Branch: feature/tooltip-content

**Objective**
Display dictionary definitions in tooltip.

**Output**
```
/frontend/src/components/tooltip/tooltip-content.tsx
/frontend/src/components/tooltip/definition-list.tsx
/frontend/src/types/dictionary.ts
```

**Acceptance Criteria**
- [ ] Shows all definitions
- [ ] Shows part of speech
- [ ] Shows reading
- [ ] Loading state while fetching

---

### JOUT-110: Add PitchDisplay component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-109
- Branch: feature/pitch-display

**Objective**
Visual pitch accent pattern display.

**Output**
```
/frontend/src/components/tooltip/pitch-display.tsx
```

**Acceptance Criteria**
- [ ] Renders pitch pattern visually
- [ ] Shows mora breakdown
- [ ] Handles heiban/atamadaka/etc.
- [ ] Color coded or line display

---

### JOUT-111: Create useTokenize hook

**Context**
- Reference: ARCHITECTURE.md Section 6.3
- Depends on: JOUT-102
- Branch: feature/use-tokenize

**Objective**
TanStack Query hook for tokenization.

**Output**
```
/frontend/src/hooks/use-tokenize.ts
/frontend/src/services/tokenize.ts
```

**Acceptance Criteria**
- [ ] Calls tokenize API
- [ ] Caches results
- [ ] Handles loading/error states
- [ ] Returns typed Token[]

---

### JOUT-112: Create useDictionaryLookup hook

**Context**
- Reference: ARCHITECTURE.md Section 6.3
- Depends on: JOUT-104
- Branch: feature/use-dictionary

**Objective**
TanStack Query hook for dictionary lookups.

**Output**
```
/frontend/src/hooks/use-dictionary.ts
/frontend/src/services/dictionary.ts
```

**Acceptance Criteria**
- [ ] Calls dictionary API
- [ ] Infinite staleTime (data doesn't change)
- [ ] Handles loading/error
- [ ] Returns typed DictionaryEntry[]

---

### JOUT-113: Integrate canvas with API

**Context**
- Reference: ARCHITECTURE.md Section 8.1
- Depends on: JOUT-105 through JOUT-112
- Branch: feature/canvas-integration

**Objective**
Connect ReadingCanvas to backend APIs.

**Output**
```
Modified: /frontend/src/components/canvas/reading-canvas.tsx
Modified: /frontend/src/components/tooltip/word-tooltip.tsx
/frontend/src/app/read/page.tsx
```

**Acceptance Criteria**
- [ ] Canvas fetches and displays tokens
- [ ] Hover triggers dictionary lookup
- [ ] Tooltip shows definitions
- [ ] End-to-end flow works

---

## Phase 2: Data Layer (Week 4)

### JOUT-201: Setup JMdict with jamdict

**Context**
- Reference: Research Document
- Depends on: JOUT-007
- Branch: feature/jmdict-setup

**Objective**
Configure jamdict for efficient lookups.

**Output**
```
Modified: /backend/app/services/dictionary_service.py
Modified: /backend/scripts/setup_data.py
```

**Acceptance Criteria**
- [ ] jamdict data downloaded
- [ ] Lookups return results
- [ ] SQLite backend works
- [ ] Named entities (JMnedict) work

---

### JOUT-202: Load Kanjium pitch accent data

**Context**
- Reference: Research Document
- Depends on: JOUT-007
- Branch: feature/kanjium-setup

**Objective**
Load and index Kanjium pitch accent data.

**Output**
```
Modified: /backend/app/services/dictionary_service.py
/backend/app/utils/pitch_loader.py
```

**Acceptance Criteria**
- [ ] Kanjium TSV downloaded
- [ ] Data loaded into memory dict
- [ ] Lookups by reading work
- [ ] 124k+ entries available

---

### JOUT-203: Implement VocabularyRepository

**Context**
- Reference: ARCHITECTURE.md Section 3
- Depends on: JOUT-006
- Branch: feature/vocab-repo

**Objective**
Data access layer for vocabulary records.

**Output**
```
/backend/app/repositories/vocabulary_repo.py
/backend/tests/unit/repositories/test_vocabulary_repo.py
```

**Acceptance Criteria**
- [ ] CRUD operations work
- [ ] is_known() checks score threshold
- [ ] Bulk upsert for Anki sync
- [ ] Tests pass

---

### JOUT-204: Implement ContentRepository

**Context**
- Reference: ARCHITECTURE.md Section 3
- Depends on: JOUT-006
- Branch: feature/content-repo

**Objective**
Data access layer for content records.

**Output**
```
/backend/app/repositories/content_repo.py
/backend/tests/unit/repositories/test_content_repo.py
```

**Acceptance Criteria**
- [ ] CRUD operations work
- [ ] List with filtering
- [ ] Chunk management
- [ ] Tests pass

---

### JOUT-205: Create ContentService

**Context**
- Reference: ARCHITECTURE.md Section 7
- Depends on: JOUT-204
- Branch: feature/content-service

**Objective**
Business logic for content management.

**Output**
```
/backend/app/services/content_service.py
/backend/tests/unit/services/test_content_service.py
```

**Acceptance Criteria**
- [ ] Import text content
- [ ] Chunk long texts
- [ ] Pre-tokenize chunks
- [ ] Calculate difficulty estimate

---

### JOUT-206: Build content import (text)

**Context**
- Reference: ARCHITECTURE.md Section 5.2
- Depends on: JOUT-205
- Branch: feature/import-text

**Objective**
API endpoint for importing plain text.

**Output**
```
/backend/app/api/routes/content.py
/backend/app/schemas/content.py
```

**Acceptance Criteria**
- [ ] POST /api/content/import accepts text
- [ ] Content stored in database
- [ ] Chunks created
- [ ] Returns content ID

---

### JOUT-207: Build content import (PDF)

**Context**
- Reference: ARCHITECTURE.md Section 7
- Depends on: JOUT-206
- Branch: feature/import-pdf

**Objective**
PDF parsing and import.

**Output**
```
/backend/app/services/pdf_service.py
Modified: /backend/app/services/content_service.py
```

**Acceptance Criteria**
- [ ] Accepts PDF upload
- [ ] Extracts text per page
- [ ] Handles Japanese text
- [ ] Creates content with chunks

---

### JOUT-208: Create content API routes

**Context**
- Reference: ARCHITECTURE.md Section 5.2
- Depends on: JOUT-206, JOUT-207
- Branch: feature/content-api

**Objective**
Complete content REST API.

**Output**
```
Modified: /backend/app/api/routes/content.py
/backend/tests/integration/test_content_api.py
```

**Acceptance Criteria**
- [ ] GET /api/content lists all
- [ ] GET /api/content/{id} returns detail
- [ ] GET /api/content/{id}/chunk/{index} returns chunk
- [ ] DELETE /api/content/{id} works

---

### JOUT-209: Build Library page

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-208
- Branch: feature/library-page

**Objective**
Content library page with grid view.

**Output**
```
/frontend/src/app/library/page.tsx
/frontend/src/services/content.ts
/frontend/src/types/content.ts
```

**Acceptance Criteria**
- [ ] Lists all content
- [ ] Shows progress percentage
- [ ] Clicking opens reader
- [ ] Responsive grid

---

### JOUT-210: Build ContentCard component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-209
- Branch: feature/content-card

**Objective**
Card component for content items.

**Output**
```
/frontend/src/components/library/content-card.tsx
```

**Acceptance Criteria**
- [ ] Shows title, type, difficulty
- [ ] Shows progress bar
- [ ] Click navigates to reader
- [ ] Delete button with confirm

---

### JOUT-211: Build ImportModal component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-209
- Branch: feature/import-modal

**Objective**
Modal for importing new content.

**Output**
```
/frontend/src/components/library/import-modal.tsx
/frontend/src/components/library/content-filters.tsx
```

**Acceptance Criteria**
- [ ] File upload (text, PDF)
- [ ] Title input
- [ ] Import progress indicator
- [ ] Success/error feedback

---

## Phase 3: Progress System (Week 5)

### JOUT-301: Implement ProgressRepository

**Context**
- Reference: ARCHITECTURE.md Section 3
- Depends on: JOUT-006
- Branch: feature/progress-repo

**Objective**
Data access for vocabulary scores.

**Output**
```
/backend/app/repositories/progress_repo.py
/backend/tests/unit/repositories/test_progress_repo.py
```

**Acceptance Criteria**
- [ ] Get/update scores
- [ ] Increment seen/lookup counts
- [ ] Get lowest scores
- [ ] Get aggregate stats

---

### JOUT-302: Implement ScoringService

**Context**
- Reference: ARCHITECTURE.md Section 7.3
- Depends on: JOUT-301
- Branch: feature/scoring-service

**Objective**
Vocabulary scoring algorithm.

**Output**
```
/backend/app/services/scoring_service.py
/backend/tests/unit/services/test_scoring_service.py
```

**Acceptance Criteria**
- [ ] Calculate score from factors
- [ ] Record lookup events
- [ ] Record read-without-lookup
- [ ] Get weakest vocabulary
- [ ] Get overall score

---

### JOUT-303: Create progress API routes

**Context**
- Reference: ARCHITECTURE.md Section 5.2
- Depends on: JOUT-302
- Branch: feature/progress-api

**Objective**
REST API for progress data.

**Output**
```
/backend/app/api/routes/progress.py
/backend/app/schemas/progress.py
/backend/tests/integration/test_progress_api.py
```

**Acceptance Criteria**
- [ ] GET /api/progress/summary works
- [ ] GET /api/progress/vocabulary works
- [ ] POST /api/progress/record-lookup works
- [ ] POST /api/progress/record-read works

---

### JOUT-304: Implement SessionRepository

**Context**
- Reference: ARCHITECTURE.md Section 3
- Depends on: JOUT-006
- Branch: feature/session-repo

**Objective**
Data access for reading sessions.

**Output**
```
/backend/app/repositories/session_repo.py
/backend/tests/unit/repositories/test_session_repo.py
```

**Acceptance Criteria**
- [ ] Create/end sessions
- [ ] Track tokens read
- [ ] Track lookups
- [ ] Get session history

---

### JOUT-305: Create session API routes

**Context**
- Reference: ARCHITECTURE.md Section 5.2
- Depends on: JOUT-304
- Branch: feature/session-api

**Objective**
REST API for sessions.

**Output**
```
/backend/app/api/routes/sessions.py
/backend/app/schemas/session.py
```

**Acceptance Criteria**
- [ ] POST /api/sessions/start works
- [ ] POST /api/sessions/{id}/end works
- [ ] GET /api/sessions/history works

---

### JOUT-306: Build useReadingSession hook

**Context**
- Reference: ARCHITECTURE.md Section 6.3
- Depends on: JOUT-305
- Branch: feature/use-session

**Objective**
Hook to manage reading sessions.

**Output**
```
/frontend/src/hooks/use-reading-session.ts
/frontend/src/stores/session-store.ts
/frontend/src/services/sessions.ts
```

**Acceptance Criteria**
- [ ] Starts session on mount
- [ ] Ends session on unmount
- [ ] Tracks lookups
- [ ] Tracks tokens read

---

### JOUT-307: Integrate scoring with reading

**Context**
- Reference: ARCHITECTURE.md Section 8.1
- Depends on: JOUT-302, JOUT-306
- Branch: feature/scoring-integration

**Objective**
Record events during reading.

**Output**
```
Modified: /frontend/src/components/tooltip/word-tooltip.tsx
Modified: /frontend/src/stores/session-store.ts
```

**Acceptance Criteria**
- [ ] Lookup recorded when tooltip shown
- [ ] Read recorded when moving past tokens
- [ ] Scores update in real-time
- [ ] Session stats accurate

---

### JOUT-308: Build Progress page

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-303
- Branch: feature/progress-page

**Objective**
Progress dashboard page.

**Output**
```
/frontend/src/app/progress/page.tsx
/frontend/src/services/progress.ts
/frontend/src/types/progress.ts
```

**Acceptance Criteria**
- [ ] Shows overall score
- [ ] Shows stats grid
- [ ] Shows weakness areas
- [ ] Shows session history

---

### JOUT-309: Build ScoreDisplay component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-308
- Branch: feature/score-display

**Objective**
Visual score display component.

**Output**
```
/frontend/src/components/progress/score-display.tsx
```

**Acceptance Criteria**
- [ ] Shows numeric score
- [ ] Visual indicator (ring/bar)
- [ ] Color coded by level
- [ ] Mini version for header

---

### JOUT-310: Build WeaknessChart component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-308
- Branch: feature/weakness-chart

**Objective**
Chart showing weak vocabulary areas.

**Output**
```
/frontend/src/components/progress/weakness-chart.tsx
```

**Acceptance Criteria**
- [ ] Lists weakest vocabulary
- [ ] Shows score per item
- [ ] Clickable to practice
- [ ] Sortable

---

### JOUT-311: Build SessionHistory component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-308
- Branch: feature/session-history

**Objective**
List of past reading sessions.

**Output**
```
/frontend/src/components/progress/session-history.tsx
```

**Acceptance Criteria**
- [ ] Lists recent sessions
- [ ] Shows duration, tokens, lookups
- [ ] Links to content
- [ ] Pagination

---

## Phase 4: Anki Integration (Week 6)

### JOUT-401: Implement AnkiService

**Context**
- Reference: Research Document, ARCHITECTURE.md Section 7
- Depends on: JOUT-203
- Branch: feature/anki-service

**Objective**
AnkiConnect integration service.

**Output**
```
/backend/app/services/anki_service.py
/backend/tests/unit/services/test_anki_service.py
```

**Acceptance Criteria**
- [ ] Check connection status
- [ ] List decks
- [ ] Fetch cards from deck
- [ ] Identify mature cards
- [ ] Handle connection errors

---

### JOUT-402: Create Anki API routes

**Context**
- Reference: ARCHITECTURE.md Section 5.2
- Depends on: JOUT-401
- Branch: feature/anki-api

**Objective**
REST API for Anki operations.

**Output**
```
/backend/app/api/routes/anki.py
/backend/app/schemas/anki.py
/backend/tests/integration/test_anki_api.py
```

**Acceptance Criteria**
- [ ] GET /api/anki/status works
- [ ] GET /api/anki/decks works
- [ ] POST /api/anki/sync works

---

### JOUT-403: Build AnkiSettings component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-402
- Branch: feature/anki-settings

**Objective**
Settings UI for Anki configuration.

**Output**
```
/frontend/src/components/settings/anki-settings.tsx
/frontend/src/services/anki.ts
```

**Acceptance Criteria**
- [ ] Shows connection status
- [ ] Deck selector dropdown
- [ ] Field mapping inputs
- [ ] Sync button
- [ ] Last sync timestamp

---

### JOUT-404: Implement vocabulary sync

**Context**
- Reference: ARCHITECTURE.md Section 8.2
- Depends on: JOUT-401, JOUT-203
- Branch: feature/vocab-sync

**Objective**
Sync Anki vocabulary to local database.

**Output**
```
Modified: /backend/app/services/anki_service.py
```

**Acceptance Criteria**
- [ ] Imports new vocabulary
- [ ] Updates existing entries
- [ ] Sets source = "anki"
- [ ] Records anki_note_id
- [ ] Returns sync summary

---

### JOUT-405: Mark known words in canvas

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-404
- Branch: feature/known-words

**Objective**
Visual distinction for Anki-known words.

**Output**
```
Modified: /frontend/src/components/canvas/token-display.tsx
```

**Acceptance Criteria**
- [ ] Different style for known words
- [ ] Configurable highlighting
- [ ] Tooltip shows source
- [ ] Works with scoring

---

### JOUT-406: Build sync status UI

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-403
- Branch: feature/sync-status

**Objective**
Progress indicator during sync.

**Output**
```
Modified: /frontend/src/components/settings/anki-settings.tsx
```

**Acceptance Criteria**
- [ ] Shows sync progress
- [ ] Displays imported/updated counts
- [ ] Error handling
- [ ] Success confirmation

---

## Phase 5: Audio (Week 7)

### JOUT-501: Implement AudioService

**Context**
- Reference: ARCHITECTURE.md Section 7.4
- Depends on: JOUT-002
- Branch: feature/audio-service

**Objective**
Edge TTS integration with caching.

**Output**
```
/backend/app/services/audio_service.py
/backend/tests/unit/services/test_audio_service.py
```

**Acceptance Criteria**
- [ ] Synthesize text to audio
- [ ] Cache audio files
- [ ] Return cached if exists
- [ ] Support voice/speed options

---

### JOUT-502: Create audio API routes

**Context**
- Reference: ARCHITECTURE.md Section 5.2
- Depends on: JOUT-501
- Branch: feature/audio-api

**Objective**
REST API for audio synthesis.

**Output**
```
/backend/app/api/routes/audio.py
/backend/app/schemas/audio.py
/backend/tests/integration/test_audio_api.py
```

**Acceptance Criteria**
- [ ] POST /api/audio/synthesize works
- [ ] GET /api/audio/cache/{hash} works
- [ ] Returns audio file
- [ ] Reports cache status

---

### JOUT-503: Build AudioPlayer component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-502
- Branch: feature/audio-player

**Objective**
Audio playback UI component.

**Output**
```
/frontend/src/components/audio/audio-player.tsx
/frontend/src/components/audio/playback-controls.tsx
/frontend/src/components/audio/speed-selector.tsx
```

**Acceptance Criteria**
- [ ] Play/pause button
- [ ] Progress bar
- [ ] Speed control
- [ ] Volume control

---

### JOUT-504: Build useAudio hook

**Context**
- Reference: ARCHITECTURE.md Section 6.3
- Depends on: JOUT-502
- Branch: feature/use-audio

**Objective**
Hook for audio synthesis and playback.

**Output**
```
/frontend/src/hooks/use-audio.ts
/frontend/src/stores/audio-store.ts
/frontend/src/services/audio.ts
```

**Acceptance Criteria**
- [ ] Request synthesis
- [ ] Manage playback state
- [ ] Queue multiple texts
- [ ] Handle errors

---

### JOUT-505: Integrate TTS with reading

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-504
- Branch: feature/tts-reading

**Objective**
Add TTS button to tooltip and canvas.

**Output**
```
Modified: /frontend/src/components/tooltip/word-tooltip.tsx
Modified: /frontend/src/components/canvas/canvas-controls.tsx
```

**Acceptance Criteria**
- [ ] Play word in tooltip
- [ ] Play sentence from canvas
- [ ] Loading indicator
- [ ] Settings respect voice choice

---

### JOUT-506: Build Listen page

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-503
- Branch: feature/listen-page

**Objective**
Dedicated listening practice page.

**Output**
```
/frontend/src/app/listen/page.tsx
```

**Acceptance Criteria**
- [ ] Select content
- [ ] Auto-play sentences
- [ ] Show transcript
- [ ] Speed controls

---

### JOUT-507: Implement audio caching

**Context**
- Reference: ARCHITECTURE.md Section 7.4
- Depends on: JOUT-501
- Branch: feature/audio-cache

**Objective**
Aggressive audio file caching.

**Output**
```
Modified: /backend/app/services/audio_service.py
/backend/app/utils/cache.py
```

**Acceptance Criteria**
- [ ] Cache to disk
- [ ] Hash-based filenames
- [ ] Cache cleanup (LRU)
- [ ] Report cache stats

---

## Phase 6: Settings & Polish (Week 8)

### JOUT-601: Implement SettingsService

**Context**
- Reference: ARCHITECTURE.md Section 7
- Depends on: JOUT-006
- Branch: feature/settings-service

**Objective**
User settings management.

**Output**
```
/backend/app/services/settings_service.py
/backend/tests/unit/services/test_settings_service.py
```

**Acceptance Criteria**
- [ ] Get all settings
- [ ] Update partial settings
- [ ] Reset to defaults
- [ ] Validate values

---

### JOUT-602: Create settings API routes

**Context**
- Reference: ARCHITECTURE.md Section 5.2
- Depends on: JOUT-601
- Branch: feature/settings-api

**Objective**
REST API for settings.

**Output**
```
/backend/app/api/routes/settings.py
/backend/app/schemas/settings.py
/backend/tests/integration/test_settings_api.py
```

**Acceptance Criteria**
- [ ] GET /api/settings works
- [ ] PATCH /api/settings works
- [ ] POST /api/settings/reset works

---

### JOUT-603: Build Settings page

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-602
- Branch: feature/settings-page

**Objective**
Settings page layout.

**Output**
```
/frontend/src/app/settings/page.tsx
/frontend/src/services/settings.ts
/frontend/src/types/settings.ts
/frontend/src/stores/settings-store.ts
```

**Acceptance Criteria**
- [ ] Tabbed or sectioned layout
- [ ] Save button
- [ ] Reset button
- [ ] Settings persist

---

### JOUT-604: Build CanvasSettings component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-603
- Branch: feature/canvas-settings

**Objective**
Canvas appearance settings.

**Output**
```
/frontend/src/components/settings/canvas-settings.tsx
```

**Acceptance Criteria**
- [ ] Max width slider
- [ ] Line height slider
- [ ] Background color
- [ ] Preview area

---

### JOUT-605: Build FontSettings component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-603
- Branch: feature/font-settings

**Objective**
Font customization settings.

**Output**
```
/frontend/src/components/settings/font-settings.tsx
```

**Acceptance Criteria**
- [ ] Font family selector
- [ ] Font size slider
- [ ] Font preview
- [ ] Japanese font options

---

### JOUT-606: Build TooltipSettings component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-603
- Branch: feature/tooltip-settings

**Objective**
Tooltip behavior settings.

**Output**
```
/frontend/src/components/settings/tooltip-settings.tsx
```

**Acceptance Criteria**
- [ ] Delay slider
- [ ] Show pitch toggle
- [ ] Show examples toggle
- [ ] AI context toggle

---

### JOUT-607: Apply settings to canvas

**Context**
- Reference: ARCHITECTURE.md Section 6
- Depends on: JOUT-604, JOUT-605, JOUT-606
- Branch: feature/apply-settings

**Objective**
Canvas respects all settings.

**Output**
```
Modified: /frontend/src/components/canvas/reading-canvas.tsx
Modified: /frontend/src/components/tooltip/word-tooltip.tsx
/frontend/src/hooks/use-canvas-settings.ts
```

**Acceptance Criteria**
- [ ] Font settings apply
- [ ] Layout settings apply
- [ ] Tooltip settings apply
- [ ] Settings persist across sessions

---

### JOUT-608: Build Dashboard page

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-308, JOUT-209
- Branch: feature/dashboard

**Objective**
Home dashboard with overview.

**Output**
```
Modified: /frontend/src/app/page.tsx
/frontend/src/components/dashboard/welcome-card.tsx
/frontend/src/components/dashboard/recent-activity.tsx
/frontend/src/components/dashboard/quick-stats.tsx
/frontend/src/components/dashboard/continue-reading.tsx
```

**Acceptance Criteria**
- [ ] Welcome message
- [ ] Quick stats summary
- [ ] Continue reading card
- [ ] Recent activity feed

---

### JOUT-609: Performance optimization

**Context**
- Reference: ARCHITECTURE.md Section 9
- Depends on: All previous tasks
- Branch: feature/performance

**Objective**
Optimize rendering and API calls.

**Output**
```
Various files - memoization, virtualization, query optimization
```

**Acceptance Criteria**
- [ ] Canvas handles 1000+ tokens smoothly
- [ ] Dictionary lookups < 100ms
- [ ] No unnecessary re-renders
- [ ] Lighthouse performance > 90

---

### JOUT-610: Error handling polish

**Context**
- Reference: ARCHITECTURE.md Section 9.4
- Depends on: All previous tasks
- Branch: feature/error-handling

**Objective**
Consistent error handling throughout.

**Output**
```
/frontend/src/components/ui/error-display.tsx
/frontend/src/components/ui/error-boundary.tsx
Modified: Various components
```

**Acceptance Criteria**
- [ ] All API errors handled gracefully
- [ ] User-friendly error messages
- [ ] Retry mechanisms
- [ ] Error boundaries prevent crashes

---

### JOUT-611: Loading states polish

**Context**
- Reference: ARCHITECTURE.md Section 6
- Depends on: All previous tasks
- Branch: feature/loading-states

**Objective**
Consistent loading indicators.

**Output**
```
/frontend/src/components/ui/skeleton.tsx
/frontend/src/components/ui/spinner.tsx
Modified: Various components
```

**Acceptance Criteria**
- [ ] All async operations show loading
- [ ] Skeleton loaders for content
- [ ] No layout shift
- [ ] Accessible loading announcements

---

### JOUT-612: Final testing pass

**Context**
- Reference: ARCHITECTURE.md Section 9.5
- Depends on: All previous tasks
- Branch: feature/final-tests

**Objective**
Complete test coverage for critical paths.

**Output**
```
Additional tests across all test directories
```

**Acceptance Criteria**
- [ ] Backend coverage > 80%
- [ ] All API endpoints have integration tests
- [ ] Critical UI flows tested
- [ ] All tests pass in CI

---

## Phase 7: Video Watch Mode (Week 9)

### JOUT-701: Create /watch page route and layout

**Context**
- Reference: New feature
- Depends on: JOUT-003
- Branch: feature/watch-page

**Objective**
Create the watch page with directory picker and video list layout.

**Output**
```
/frontend/app/watch/page.tsx
/frontend/stores/watch-store.ts
```

**Acceptance Criteria**
- [ ] Page renders at /watch
- [ ] Directory picker button
- [ ] Empty state when no directory selected
- [ ] Basic layout structure

---

### JOUT-702: Implement directory picker for video folder

**Context**
- Reference: File System Access API
- Depends on: JOUT-701
- Branch: feature/directory-picker

**Objective**
Allow user to select a folder containing video files.

**Output**
```
/frontend/components/watch/directory-picker.tsx
/frontend/hooks/use-directory-picker.ts
```

**Acceptance Criteria**
- [ ] Opens native folder picker
- [ ] Stores selected directory handle
- [ ] Persists selection in localStorage
- [ ] Shows selected folder path

---

### JOUT-703: Build video list view

**Context**
- Reference: JOUT-702
- Depends on: JOUT-702
- Branch: feature/video-list

**Objective**
Display list of video files from selected directory.

**Output**
```
/frontend/components/watch/video-list.tsx
/frontend/components/watch/video-card.tsx
/frontend/types/video.ts
```

**Acceptance Criteria**
- [ ] Lists .mp4, .mkv, .webm files
- [ ] Detects matching subtitle files (.srt, .ass, .vtt)
- [ ] Shows video thumbnail if available
- [ ] Indicates subtitle availability

---

### JOUT-704: Create video player component

**Context**
- Reference: HTML5 Video API
- Depends on: JOUT-703
- Branch: feature/video-player

**Objective**
Video player with standard controls.

**Output**
```
/frontend/components/watch/video-player.tsx
/frontend/components/watch/player-controls.tsx
/frontend/hooks/use-video-player.ts
```

**Acceptance Criteria**
- [ ] Play/pause functionality
- [ ] Seek bar with progress
- [ ] Volume control
- [ ] Fullscreen toggle
- [ ] Keyboard shortcuts

---

### JOUT-705: Add SRT subtitle parser

**Context**
- Reference: SRT format specification
- Depends on: JOUT-704
- Branch: feature/srt-parser

**Objective**
Parse SRT subtitle files into timed text segments.

**Output**
```
/frontend/lib/subtitle-parser.ts
/frontend/types/subtitle.ts
```

**Acceptance Criteria**
- [ ] Parse .srt format
- [ ] Handle timing codes
- [ ] Support multi-line subtitles
- [ ] Handle common encoding (UTF-8, Shift-JIS)

---

### JOUT-706: Sync subtitles with video playback

**Context**
- Reference: JOUT-705
- Depends on: JOUT-704, JOUT-705
- Branch: feature/subtitle-sync

**Objective**
Display current subtitle based on video timestamp.

**Output**
```
/frontend/components/watch/subtitle-display.tsx
/frontend/hooks/use-subtitle-sync.ts
```

**Acceptance Criteria**
- [ ] Shows current subtitle text
- [ ] Updates on video timeupdate
- [ ] Smooth transitions between subtitles
- [ ] Handles gaps in subtitles

---

### JOUT-707: Display subtitle with JapaneseText hover tooltips

**Context**
- Reference: Existing JapaneseText component
- Depends on: JOUT-706, JOUT-113
- Branch: feature/subtitle-tooltips

**Objective**
Render subtitle text using JapaneseText component with tokenization and hover lookups.

**Output**
```
Modified: /frontend/components/watch/subtitle-display.tsx
/frontend/hooks/use-subtitle-tokenize.ts
```

**Acceptance Criteria**
- [ ] Subtitle text tokenized via API
- [ ] Hover shows dictionary tooltip
- [ ] Pitch accent displayed
- [ ] Pre-tokenize upcoming subtitles for performance

---

### JOUT-708: Add Watch navigation link

**Context**
- Reference: App navigation
- Depends on: JOUT-701
- Branch: feature/watch-nav

**Objective**
Add Watch link to main navigation.

**Output**
```
Modified: /frontend/components/layout/main-layout.tsx
Modified: /frontend/components/layout/sidebar.tsx (if exists)
```

**Acceptance Criteria**
- [ ] Watch link in navigation
- [ ] Active state when on /watch
- [ ] Appropriate icon

---

## Phase 8: Difficulty Analysis & Adaptive Content (Week 10)

### JOUT-801: Implement DifficultyService with jReadability

**Context**
- Reference: jReadability library (https://github.com/joshdavham/jreadability)
- Depends on: JOUT-101 (TokenizerService)
- Branch: feature/difficulty-service

**Objective**
Create DifficultyService that analyzes Japanese text and returns multi-dimensional difficulty scores.

**Output**
```
/backend/app/services/difficulty_service.py
/backend/app/schemas/difficulty.py
/backend/tests/unit/services/test_difficulty_service.py
```

**Key Dependencies**
- jreadability
- wordfreq

**Acceptance Criteria**
- [ ] Computes overall_difficulty (0.0-1.0) via jReadability
- [ ] Computes kanji_difficulty based on grade levels
- [ ] Computes lexical_difficulty using wordfreq
- [ ] Computes grammar_complexity via pattern matching
- [ ] Computes sentence_complexity from length/structure
- [ ] Returns difficulty_level category (Beginner/Elementary/Intermediate/Advanced/Expert)
- [ ] Tests pass

---

### JOUT-802: Integrate KanjiAPI for grade data

**Context**
- Reference: https://kanjiapi.dev/#!/documentation
- Depends on: JOUT-801
- Branch: feature/kanji-grades

**Objective**
Fetch and cache kanji grade/JLPT level data from KanjiAPI.

**Output**
```
/backend/app/services/kanji_grade_service.py
/backend/data/kanji/grades.json (cached data)
/backend/tests/unit/services/test_kanji_grade_service.py
```

**Acceptance Criteria**
- [ ] Fetches kanji data from kanjiapi.dev
- [ ] Caches 3,000+ kanji with grades locally
- [ ] Returns grade (1-6) and JLPT level (N5-N1) for any kanji
- [ ] Handles unknown kanji gracefully
- [ ] Setup script downloads/updates cache
- [ ] Tests pass

---

### JOUT-803: Create difficulty analysis API routes

**Context**
- Reference: ARCHITECTURE.md Section 5.2
- Depends on: JOUT-801, JOUT-802
- Branch: feature/difficulty-api

**Objective**
Expose text difficulty analysis via REST API.

**Output**
```
/backend/app/api/routes/difficulty.py
/backend/tests/integration/test_difficulty_api.py
```

**Acceptance Criteria**
- [ ] POST /api/difficulty/analyze accepts text, returns all metrics
- [ ] GET /api/difficulty/kanji/{character} returns grade info
- [ ] POST /api/difficulty/batch analyzes multiple texts
- [ ] Response includes all 6 difficulty dimensions
- [ ] Integration tests pass

---

### JOUT-804: Create UserProficiency model

**Context**
- Reference: ARCHITECTURE.md Section 4
- Depends on: JOUT-006
- Branch: feature/proficiency-model

**Objective**
SQLModel for tracking user proficiency across difficulty dimensions.

**Output**
```
/backend/app/models/proficiency.py
Modified: /backend/app/models/__init__.py
```

**Schema**
```python
class UserProficiency(SQLModel, table=True):
    id: int
    overall_level: float  # 0.0-1.0
    kanji_level: float
    lexical_level: float
    grammar_level: float
    sentence_level: float
    difficulty_category: str  # Beginner/Elementary/etc.
    updated_at: datetime
```

**Acceptance Criteria**
- [ ] Model created with all proficiency dimensions
- [ ] Table created on startup
- [ ] Default values for new users
- [ ] Timestamps tracked

---

### JOUT-805: Implement ProficiencyService

**Context**
- Reference: ARCHITECTURE.md Section 7
- Depends on: JOUT-804, JOUT-801
- Branch: feature/proficiency-service

**Objective**
Service for updating user proficiency based on reading performance.

**Output**
```
/backend/app/services/proficiency_service.py
/backend/app/repositories/proficiency_repo.py
/backend/tests/unit/services/test_proficiency_service.py
```

**Acceptance Criteria**
- [ ] Gets current proficiency levels
- [ ] Updates proficiency based on reading session results
- [ ] Tracks per-dimension progress separately
- [ ] Calculates suggested difficulty level for content selection
- [ ] Tests pass

---

### JOUT-806: Create proficiency API routes

**Context**
- Reference: ARCHITECTURE.md Section 5.2
- Depends on: JOUT-805
- Branch: feature/proficiency-api

**Objective**
REST API for user proficiency data.

**Output**
```
/backend/app/api/routes/proficiency.py
/backend/app/schemas/proficiency.py
/backend/tests/integration/test_proficiency_api.py
```

**Acceptance Criteria**
- [ ] GET /api/proficiency returns current levels
- [ ] POST /api/proficiency/update updates based on session
- [ ] GET /api/proficiency/history returns level changes over time
- [ ] Response includes all 6 dimensions
- [ ] Integration tests pass

---

### JOUT-807: Update ContentService with difficulty scoring

**Context**
- Reference: JOUT-205, JOUT-801
- Depends on: JOUT-801, JOUT-205
- Branch: feature/content-difficulty

**Objective**
Analyze and store difficulty scores when importing content.

**Output**
```
Modified: /backend/app/services/content_service.py
Modified: /backend/app/models/content.py
```

**Acceptance Criteria**
- [ ] Content model includes difficulty fields
- [ ] Import calculates and stores all difficulty metrics
- [ ] Chunks inherit or calculate own difficulty
- [ ] Existing content can be re-analyzed
- [ ] Tests updated

---

### JOUT-808: Build useProficiency hook

**Context**
- Reference: ARCHITECTURE.md Section 6.3
- Depends on: JOUT-806
- Branch: feature/use-proficiency

**Objective**
TanStack Query hook for proficiency data.

**Output**
```
/frontend/hooks/use-proficiency.ts
/frontend/services/proficiency.ts
/frontend/types/proficiency.ts
```

**Acceptance Criteria**
- [ ] Fetches current proficiency levels
- [ ] Caches with appropriate staleTime
- [ ] Provides mutation for updates
- [ ] Returns typed ProficiencyData

---

### JOUT-809: Build ProficiencyDisplay component

**Context**
- Reference: ARCHITECTURE.md Section 6.1
- Depends on: JOUT-808
- Branch: feature/proficiency-display

**Objective**
Visual display of user proficiency across dimensions.

**Output**
```
/frontend/components/progress/proficiency-display.tsx
/frontend/components/progress/proficiency-radar.tsx
```

**Acceptance Criteria**
- [ ] Radar/spider chart showing all 6 dimensions
- [ ] Color coded by level
- [ ] Shows numeric values on hover
- [ ] Responsive design

---

### JOUT-810: Integrate proficiency with Progress page

**Context**
- Reference: JOUT-308
- Depends on: JOUT-809
- Branch: feature/progress-proficiency

**Objective**
Add proficiency breakdown to Progress page.

**Output**
```
Modified: /frontend/app/progress/page.tsx
```

**Acceptance Criteria**
- [ ] Shows proficiency radar chart
- [ ] Displays per-dimension breakdown
- [ ] Shows historical progress
- [ ] Links to content at appropriate level

---

### JOUT-811: Build content difficulty filter

**Context**
- Reference: JOUT-209
- Depends on: JOUT-807
- Branch: feature/difficulty-filter

**Objective**
Filter library content by difficulty level.

**Output**
```
/frontend/components/library/difficulty-filter.tsx
Modified: /frontend/app/library/page.tsx
```

**Acceptance Criteria**
- [ ] Slider or dropdown for difficulty range
- [ ] Filter by difficulty_level category
- [ ] Filter by individual dimensions
- [ ] "Match my level" button uses proficiency
- [ ] Filters persist in URL params

---

### JOUT-812: Update scoring to track per-dimension performance

**Context**
- Reference: JOUT-302, JOUT-805
- Depends on: JOUT-302, JOUT-805
- Branch: feature/dimension-scoring

**Objective**
Record which dimension (kanji, vocab, grammar) caused lookups.

**Output**
```
Modified: /backend/app/services/scoring_service.py
Modified: /backend/app/models/session.py
```

**Acceptance Criteria**
- [ ] Lookups categorized by difficulty dimension
- [ ] Session stats include per-dimension breakdown
- [ ] Proficiency updates weighted by dimension performance
- [ ] Tests updated

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 0 | 8 | Project foundation, tooling |
| 1 | 13 | Core reading canvas and tooltips |
| 2 | 11 | Content management, library |
| 3 | 11 | Progress tracking, scoring |
| 4 | 6 | Anki synchronization |
| 5 | 7 | Audio and TTS |
| 6 | 12 | Settings, polish, optimization |
| 7 | 8 | Video watch mode with subtitles |
| 8 | 12 | Difficulty analysis, adaptive content, proficiency tracking |

**Total: 82 tasks**

---

## Task Assignment Template

When assigning a task to AI, use this format:

```
Task: JOUT-XXX

[Paste full task from this document]

Reference the following ARCHITECTURE.md sections:
[Paste relevant sections]

Additional context:
[Any clarifications or decisions made since planning]

Output requirements:
- Create only the files specified
- Follow conventions in ARCHITECTURE.md Section 9
- Include tests where specified
- Do not modify files not listed in Output
```

---

## Task Checklist

```
Phase 0: Foundation
[x] JOUT-001: Initialize monorepo structure
[x] JOUT-002: Setup backend with FastAPI + SQLModel
[x] JOUT-003: Setup frontend with Next.js + Tailwind + shadcn
[x] JOUT-004: Configure development scripts
[x] JOUT-005: Setup pytest + vitest
[x] JOUT-006: Create database models
[x] JOUT-007: Setup reference data download script
[x] JOUT-008: Configure static file serving for production

Phase 1: Core Reading
[x] JOUT-101: Implement TokenizerService
[x] JOUT-102: Create tokenize API routes
[x] JOUT-103: Implement DictionaryService
[x] JOUT-104: Create dictionary API routes
[x] JOUT-105: Build ReadingCanvas component
[x] JOUT-106: Build TokenDisplay component
[x] JOUT-107: Build WordTooltip component
[x] JOUT-108: Implement tooltip positioning logic
[x] JOUT-109: Build TooltipContent with definitions
[x] JOUT-110: Add PitchDisplay component
[x] JOUT-111: Create useTokenize hook
[x] JOUT-112: Create useDictionaryLookup hook
[x] JOUT-113: Integrate canvas with API

Phase 2: Data Layer
[x] JOUT-201: Setup JMdict with jamdict
[x] JOUT-202: Load Kanjium pitch accent data
[x] JOUT-203: Implement VocabularyRepository
[x] JOUT-204: Implement ContentRepository
[x] JOUT-205: Create ContentService
[x] JOUT-206: Build content import (text)
[x] JOUT-207: Build content import (PDF)
[x] JOUT-208: Create content API routes
[x] JOUT-209: Build Library page
[x] JOUT-210: Build ContentCard component
[x] JOUT-211: Build ImportModal component

Phase 3: Progress System
[x] JOUT-301: Implement ProgressRepository
[x] JOUT-302: Implement ScoringService
[x] JOUT-303: Create progress API routes
[x] JOUT-304: Implement SessionRepository
[x] JOUT-305: Create session API routes
[x] JOUT-306: Build useReadingSession hook
[x] JOUT-307: Integrate scoring with reading
[x] JOUT-308: Build Progress page
[ ] JOUT-309: Build ScoreDisplay component
[ ] JOUT-310: Build WeaknessChart component
[ ] JOUT-311: Build SessionHistory component

Phase 4: Anki Integration
[ ] JOUT-401: Implement AnkiService
[ ] JOUT-402: Create Anki API routes
[ ] JOUT-403: Build AnkiSettings component
[ ] JOUT-404: Implement vocabulary sync
[ ] JOUT-405: Mark known words in canvas
[ ] JOUT-406: Build sync status UI

Phase 5: Audio
[ ] JOUT-501: Implement AudioService
[ ] JOUT-502: Create audio API routes
[ ] JOUT-503: Build AudioPlayer component
[ ] JOUT-504: Build useAudio hook
[ ] JOUT-505: Integrate TTS with reading
[ ] JOUT-506: Build Listen page
[ ] JOUT-507: Implement audio caching

Phase 6: Settings & Polish
[ ] JOUT-601: Implement SettingsService
[ ] JOUT-602: Create settings API routes
[ ] JOUT-603: Build Settings page
[ ] JOUT-604: Build CanvasSettings component
[ ] JOUT-605: Build FontSettings component
[ ] JOUT-606: Build TooltipSettings component
[ ] JOUT-607: Apply settings to canvas
[ ] JOUT-608: Build Dashboard page
[ ] JOUT-609: Performance optimization
[ ] JOUT-610: Error handling polish
[ ] JOUT-611: Loading states polish
[ ] JOUT-612: Final testing pass

Phase 7: Video Watch Mode
[ ] JOUT-701: Create /watch page route and layout
[ ] JOUT-702: Implement directory picker for video folder
[ ] JOUT-703: Build video list view
[ ] JOUT-704: Create video player component
[ ] JOUT-705: Add SRT subtitle parser
[ ] JOUT-706: Sync subtitles with video playback
[ ] JOUT-707: Display subtitle with JapaneseText hover tooltips
[ ] JOUT-708: Add Watch navigation link

Phase 8: Difficulty Analysis & Adaptive Content
[ ] JOUT-801: Implement DifficultyService with jReadability
[ ] JOUT-802: Integrate KanjiAPI for grade data
[ ] JOUT-803: Create difficulty analysis API routes
[ ] JOUT-804: Create UserProficiency model
[ ] JOUT-805: Implement ProficiencyService
[ ] JOUT-806: Create proficiency API routes
[ ] JOUT-807: Update ContentService with difficulty scoring
[ ] JOUT-808: Build useProficiency hook
[ ] JOUT-809: Build ProficiencyDisplay component
[ ] JOUT-810: Integrate proficiency with Progress page
[ ] JOUT-811: Build content difficulty filter
[ ] JOUT-812: Update scoring to track per-dimension performance
```

---

## Quick Reference: File Counts by Phase

| Phase | Backend Files | Frontend Files | Test Files |
|-------|--------------|----------------|------------|
| 0: Foundation | 15 | 12 | 3 |
| 1: Core Reading | 6 | 14 | 4 |
| 2: Data Layer | 8 | 10 | 5 |
| 3: Progress | 6 | 10 | 4 |
| 4: Anki | 3 | 5 | 2 |
| 5: Audio | 3 | 6 | 2 |
| 6: Polish | 3 | 12 | 2 |
| 7: Watch Mode | 0 | 10 | 0 |
| 8: Difficulty | 8 | 6 | 5 |
| **Total** | **52** | **85** | **27** |

---

## Dependency Graph

```
JOUT-001 ─┬─► JOUT-002 ─┬─► JOUT-006 ─► JOUT-101 ─► JOUT-102
          │             │                    │
          │             ├─► JOUT-005         ▼
          │             │              JOUT-203 ─► JOUT-301
          │             │                              │
          └─► JOUT-003 ─┴─► JOUT-004 ─► JOUT-008      │
                │                                      │
                ├─► JOUT-105 ─► JOUT-106 ─► JOUT-107  │
                │                   │                  │
                │                   ▼                  │
                │             JOUT-113 (integration)   │
                │                   │                  │
                ├─► JOUT-701 ───────┴─► JOUT-707      │
                │                                      │
                └─► JOUT-808 ─► JOUT-809 ─► JOUT-810  │
                         ▲                             │
                         │                             │
JOUT-101 ─► JOUT-801 ───┴─► JOUT-802 ─► JOUT-803     │
                │                                      │
                ├─► JOUT-804 ─► JOUT-805 ─► JOUT-806  │
                │                    │                 │
                │                    ▼                 │
                └─► JOUT-807 ───────►JOUT-812 ◄───────┘
```

Key dependencies:
- All backend services depend on JOUT-006 (models)
- All frontend components depend on JOUT-003 (setup)
- Integration tasks depend on both backend and frontend completion
- Polish tasks (Phase 6) depend on all feature phases
- Watch mode (Phase 7) depends on JOUT-113 for JapaneseText integration
- Difficulty analysis (Phase 8) depends on JOUT-101 (TokenizerService) and JOUT-302 (ScoringService)
- ProficiencyService integrates with ScoringService for per-dimension tracking
