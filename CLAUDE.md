# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Joutatsu (上達 - "improvement/mastery") is a Japanese learning application focused on reading comprehension with adaptive difficulty, real-world content, and Anki integration. Core features include an interactive reading canvas with hoverable tooltips, JMdict dictionary with pitch accent, morphological analysis via SudachiPy, adaptive scoring, and TTS audio.

## Development Commands

```bash
# Development (runs frontend + backend concurrently)
pnpm dev

# Frontend only
pnpm dev:frontend    # Next.js at localhost:3000

# Backend only
pnpm dev:backend     # FastAPI at localhost:8000

# Production
pnpm build           # Build frontend for production
pnpm start           # FastAPI serves everything at localhost:8000

# Testing
pnpm test            # All tests
pnpm test:backend    # cd backend && uv run pytest
pnpm test:frontend   # cd frontend && pnpm test

# Linting
pnpm lint            # All code
pnpm lint:backend    # Ruff
pnpm lint:frontend   # ESLint

# Setup
pnpm setup           # Install deps + reference data (JMdict, Kanjium, SudachiPy)

# Backend NLP dependencies (required for tokenization)
cd backend && uv sync --extra nlp   # Installs sudachipy, jamdict, edge-tts, jreadability
```

## Architecture

**Monorepo Structure**: Single FastAPI process serves both API and built Next.js frontend in production.

```
joutatsu/
├── backend/           # FastAPI + SQLModel + SudachiPy
│   ├── app/
│   │   ├── api/routes/     # API endpoints (tokenize, dictionary, content, data)
│   │   ├── services/       # Business logic (tokenizer, dictionary, content, pdf)
│   │   ├── repositories/   # Data access layer (vocabulary, content)
│   │   ├── models/         # SQLModel database models (Content, ContentChunk, Vocabulary)
│   │   └── schemas/        # Pydantic request/response schemas
│   ├── data/               # Reference data (pitch/kanjium.tsv)
│   └── tests/
│       ├── unit/           # Unit tests (services/, repositories/)
│       └── integration/    # API integration tests
├── frontend/          # Next.js 14 + Tailwind + shadcn/ui
│   ├── app/                # App Router pages (/read, /explore, /library)
│   ├── components/
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── canvas/         # Reading canvas components
│   │   ├── tooltip/        # Tooltip system
│   │   └── explore/        # Data explorer components
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   ├── services/           # API client functions (api.ts, content.ts)
│   └── types/              # TypeScript type definitions
└── data/              # User data (gitignored) - SQLite DB, audio cache, content
```

**Tech Stack**:
- Backend: FastAPI, SQLite + SQLModel, SudachiPy (tokenizer), jamdict (JMdict), edge-tts
- Frontend: Next.js 14 (App Router, static export), Tailwind CSS + shadcn/ui, TanStack Query, Zustand
- AI: OpenRouter SDK for contextual word meanings, PDF cleanup, grammar explanations, adaptive text generation

## Conventions

**File Naming**:
- Python: `snake_case.py`, classes `PascalCase`
- TypeScript: `kebab-case.tsx`, components `PascalCase`
- Hooks: `use-*.ts`
- Stores: `*-store.ts`

**File Size Limits**:
- Python files: ~150 lines max
- TypeScript components: ~100 lines max
- Hooks: ~80 lines max

**Import Order** (Python):
```python
# Standard library
# Third-party
# Local - absolute imports only
```

**Import Order** (TypeScript):
```typescript
// React/Next
// Third-party
// Components (@/components)
// Hooks/stores
// Services/utils
// Types
```

**Path Aliases**: `@/*` maps to root directory

## Current Implementation Status

**Phase 0-2: Foundation** - Complete
- Monorepo structure, FastAPI + Next.js integration
- SQLite database with SQLModel, reference data (JMdict, Kanjium, SudachiPy)
- TokenizerService, DictionaryService, ContentService
- Reading canvas with tooltips at `/read` page
- Data Explorer at `/explore` page

**Phase 3: Progress & Proficiency Tracking** - Complete
- Progress tracking with scoring service (`/api/progress/*`)
- Session management for reading sessions (`/api/sessions/*`)
- User proficiency model (multi-dimensional: kanji, lexical, grammar)
- Weakness analysis and recommendations (`/api/proficiency/*`)
- Progress page at `/progress` with stats, charts, session history

**Phase 4: Aozora Bunko Integration** - Complete
- Browse and search Aozora catalog (`/api/aozora/*`)
- Download and import public domain texts
- Library page with book details at `/library`, `/library/[id]`

**Phase 5: Text Generation** - Complete
- OpenRouter-powered Japanese text generation (`/api/generation/*`)
- Difficulty matching to user proficiency (i+1 approach)
- Configurable challenge level, genre, and length settings
- PracticeGenerator and DifficultySettings components

**Phase 7: Video Watch Mode** - Complete
- Local video directory browsing (`/api/video/*`)
- SRT subtitle parsing and sync
- JapaneseText integration for subtitle hover tooltips
- Watch page at `/watch`

See IMPLEMENTATION_PLAN.md for the full task breakdown.

## shadcn/ui Configuration

Settings in `components.json`:
- Style: `radix-vega`
- Icon library: `lucide`
- CSS variables enabled

```bash
npx shadcn@latest add <component-name>
```

## Key Design Principles

- **Single Responsibility**: Each module/file does one thing well
- **Dependency Injection**: Services receive dependencies for testability
- **Offline-First**: Core features work without internet (except TTS)
- **Data Locality**: All user data in local SQLite
- **Graceful Degradation**: Handle missing tables/data with try/except, return partial results

## Backend Patterns

**FastAPI Dependency Injection**:
```python
from fastapi import Depends
from app.core.database import get_session

@router.post("/endpoint")
async def handler(session: AsyncSession = Depends(get_session)):
    service = MyService(session)
    return await service.do_work()
```

**Service Layer**: Services take optional `AsyncSession` for database access. Always handle missing tables gracefully:
```python
try:
    result = await self._session.exec(statement)
except Exception:
    pass  # Table may not exist yet
```

**SudachiPy Tokenizer Modes**:
- `Mode.A`: Short units (morphemes) - "国際連合" → "国際", "連合"
- `Mode.B`: Medium units
- `Mode.C`: Long units (default) - "国際連合" → "国際連合"

**Conjugation Merging**: TokenizerService merges verb stems with auxiliaries (ます, た, ない) for learner-friendly output.

**Pitch Accent Data** (Kanjium format):
- TSV file at `backend/data/pitch/kanjium.tsv`
- Format: `kanji\treading\tpitch_pattern` (e.g., `食べる\tたべる\t2`)
- Reading is in **hiragana** (not katakana) - lookups must use hiragana
- Pattern number = mora where pitch drops (0 = heiban/flat, 1 = atamadaka, 2+ = nakadaka/odaka)

**API Routes Overview**:
| Route Prefix | Purpose |
|-------------|---------|
| `/api/data/*` | Data exploration (dictionary, tokenize, pitch) |
| `/api/tokenize/*` | Text tokenization |
| `/api/dictionary/*` | Dictionary lookups |
| `/api/content/*` | Content CRUD and import |
| `/api/progress/*` | Progress summary and weakest words |
| `/api/sessions/*` | Reading session tracking |
| `/api/proficiency/*` | User proficiency and recommendations |
| `/api/generation/*` | Text generation at target difficulty |
| `/api/aozora/*` | Aozora Bunko catalog and downloads |
| `/api/video/*` | Video directory browsing |

**Data API Routes** (`/api/data/*`):
- `/data/status` - Check availability of JMdict, SudachiPy, pitch data
- `/data/dictionary/lookup?q=` - JMdict word lookup with pitch
- `/data/dictionary/kanji?q=` - KanjiDic2 kanji lookup
- `/data/pitch?q=` - Exact pitch pattern lookup (hiragana only)
- `/data/pitch/search?q=` - Partial match pitch search
- `/data/tokenize?text=&mode=` - Tokenize text (modes: A/B/C)
- `/data/tokenize/analyze?text=` - Full analysis with dictionary + pitch

## Frontend Patterns

**Zustand Store Pattern**:
```typescript
interface MyStore {
  data: Data[]
  setData: (data: Data[]) => void
}
export const useMyStore = create<MyStore>((set) => ({
  data: [],
  setData: (data) => set({ data }),
}))
```

**API Hooks**: Use React hooks in `hooks/` that call services in `services/`. Hooks manage loading/error state.

**Portal Pattern**: Use `createPortal` for tooltips to avoid z-index and overflow issues:
```typescript
{mounted && createPortal(<Tooltip />, document.body)}
```

## Testing Patterns

**Backend Tests** (`backend/tests/`):
- Unit tests: `tests/unit/services/test_*.py` - test services in isolation
- Repository tests: `tests/unit/repositories/test_*.py` - test data access layer
- Integration tests: `tests/integration/test_*_api.py` - test full API routes
- Use `@pytest.fixture` for service instances, sessions, and test clients

**Test Database Setup**: Tests use in-memory SQLite. Import all models in `conftest.py` before `create_all()` to ensure tables exist:
```python
# Import models so SQLModel.metadata knows about them
from app.models.content import Content, ContentChunk  # noqa: F401
```

**Test Naming**: `test_<method>_<scenario>` e.g., `test_tokenize_empty_string`

**Run specific tests**:
```bash
uv run pytest tests/unit/services/test_tokenizer_service.py -v
uv run pytest tests/unit/repositories/ -v  # All repository tests
uv run pytest -k "test_merge" -v  # Run tests matching pattern
```

## Common Issues

- **Hydration mismatch**: Browser extensions (Dark Reader) can cause React hydration errors. Use `suppressHydrationWarning` on `<html>` element.
- **CORS**: Backend must allow frontend origin. Check `app/core/config.py` CORS settings.
- **Missing data files**: JMdict and Kanjium data require `pnpm setup` to download.
- **Database tables**: New tables require migration. Services should handle missing tables gracefully.

## Database Schema Changes (Development)

During active development, SQLite schema changes require database recreation:

1. **Adding columns to existing models**: Delete `data/joutatsu.db` and restart the server
2. **New models**: Import in `app/models/__init__.py` before server restart
3. **Migration note**: Production would use Alembic, but development uses fresh DB recreation

```bash
# When you see "no such column" errors:
rm data/joutatsu.db
pnpm dev  # Database recreates with new schema
```

## Japanese Data File Handling

- **UTF-8 BOM**: Japanese CSV/TSV files often include a Byte Order Mark. Use `encoding="utf-8-sig"` to strip it:
  ```python
  content = path.read_text(encoding="utf-8-sig")  # Strips BOM automatically
  ```
- **Shift-JIS encoding**: Aozora Bunko and many Japanese text files use Shift-JIS, not UTF-8. Try Shift-JIS first:
  ```python
  try:
      text = content.decode("shift_jis")
  except UnicodeDecodeError:
      text = content.decode("utf-8")
  ```
- **Zip archives**: Aozora text files are distributed as `.zip` archives. Extract before decoding.
- **External IDs vs Names**: When integrating external data sources, always use IDs for lookups, not names. Names can vary between records (spacing, character variants).

## React Patterns

**Safe List Rendering**:
- Filter out items with empty/invalid keys before mapping: `items.filter(x => x.id).map(...)`
- Use composite keys when IDs may not be unique: `key={\`${item.id}-${index}\`}`
- Track loading state by unique key, not just ID

**Defensive Rendering**:
- Always handle undefined/null for optional fields: `{book.title || 'Untitled'}`
- Use optional chaining for nested access: `item?.property?.value`

## Text Difficulty Analysis System

Joutatsu uses a multi-dimensional difficulty analysis system to estimate user proficiency and match content to their level.

### Difficulty Metrics

Track user proficiency across these dimensions (all scored 0.0-1.0):

| Metric | Description |
|--------|-------------|
| `overall_difficulty` | Primary difficulty score based on jReadability model |
| `kanji_difficulty` | Complexity based on kanji grade levels and density |
| `lexical_difficulty` | Vocabulary complexity using frequency data |
| `grammar_complexity` | Grammatical structure complexity |
| `sentence_complexity` | Sentence length and structure variation |
| `difficulty_level` | Categorical: Beginner/Elementary/Intermediate/Advanced/Expert |

### External Resources

**jReadability Library** (`jreadability`):
- GitHub: https://github.com/joshdavham/jreadability
- Computes Japanese text readability scores
- Install: `pip install jreadability`
- Usage:
  ```python
  from jreadability import compute_readability
  score = compute_readability("日本語のテキスト")  # Returns 0.0-1.0
  ```

**KanjiAPI** (https://kanjiapi.dev):
- Provides kanji grade levels (grades 1-6 for Joyo, N5-N1 for JLPT)
- Endpoint: `https://kanjiapi.dev/v1/kanji/{character}`
- Returns: grade, stroke count, meanings, readings
- Use for calculating `kanji_difficulty` based on character grades

**Japanese Text Difficulty Dataset** (HuggingFace):
- Dataset: `ronantakizawa/japanese-text-difficulty`
- Pre-analyzed sentences with all difficulty metrics
- Can be used for training/calibrating local models
- Contains sentences categorized by curriculum level

### Difficulty Calculation Approach

1. **Kanji Analysis**: Map each kanji to grade level via kanjiapi.dev, calculate weighted average
2. **Vocabulary Analysis**: Use `wordfreq` library for corpus-based frequency data
3. **Grammar Analysis**: Pattern-based scoring using formal Japanese constructions
4. **Sentence Analysis**: Length variation and structural complexity measures
5. **Overall Score**: Combine via jReadability or weighted average of components

### User Proficiency Model

Track user proficiency across each dimension separately:
- Users may have strong kanji recognition but weak grammar comprehension
- Adaptive content selection considers per-dimension proficiency
- Progress page shows breakdown by skill area

## Text Generation Service

The `TextGenerationService` generates Japanese text matching user proficiency:

```python
from app.services.text_generation_service import TextGenerationService

service = TextGenerationService()
result = await service.generate_at_user_level(
    kanji_proficiency=0.4,
    lexical_proficiency=0.5,
    grammar_proficiency=0.3,
    topic="cooking",
    genre="dialogue",  # general, story, dialogue, news, essay
    length="medium",   # short, medium, long
    challenge_level=0.1,  # i+1 increment (0.0-0.3)
)
```

**API Endpoints**:
- `POST /api/generation/text` - Generate text with specified parameters
- `GET /api/generation/settings` - Get current proficiency settings
- `POST /api/generation/settings` - Update target difficulties and auto-adjust settings

**Frontend Components**:
- `PracticeGenerator` - UI for text generation with topic, genre, length controls
- `DifficultySettings` - Sliders for target difficulty per dimension

## Reference Documents

- **ARCHITECTURE.md**: Locked technical architecture (database schema, API spec, component hierarchy)
- **IMPLEMENTATION_PLAN.md**: Task specifications with acceptance criteria
- **README.md**: Setup instructions and feature overview
