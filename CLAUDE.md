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
```

## Architecture

**Monorepo Structure**: Single FastAPI process serves both API and built Next.js frontend in production.

```
joutatsu/
├── backend/           # FastAPI + SQLModel + SudachiPy
│   ├── app/
│   │   ├── api/routes/     # API endpoints
│   │   ├── services/       # Business logic (tokenizer, dictionary, scoring, etc.)
│   │   ├── repositories/   # Data access layer
│   │   ├── models/         # SQLModel database models
│   │   └── schemas/        # Pydantic request/response schemas
│   └── tests/
├── frontend/          # Next.js 14 + Tailwind + shadcn/ui
│   ├── app/                # App Router pages
│   ├── components/
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── canvas/         # Reading canvas components
│   │   └── tooltip/        # Tooltip system
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   └── services/           # API client functions
└── data/              # User data (gitignored) - SQLite DB, audio cache, content
```

**Tech Stack**:
- Backend: FastAPI, SQLite + SQLModel, SudachiPy (tokenizer), jamdict (JMdict), edge-tts
- Frontend: Next.js 14 (App Router, static export), Tailwind CSS + shadcn/ui, TanStack Query, Zustand
- AI: OpenRouter SDK for contextual word meanings, PDF cleanup, grammar explanations

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

**Phase 1: Core Reading Canvas & Tooltips** - Complete (13 tasks)
- TokenizerService with SudachiPy and conjugation merging
- DictionaryService with JMdict + Kanjium pitch accent
- API routes: `/api/tokenize`, `/api/dictionary/lookup`, `/api/dictionary/pitch`
- Frontend: ReadingCanvas, TokenDisplay, WordTooltip, PitchDisplay
- Zustand store for canvas state, React hooks for API calls
- Integration at `/read` page

**Next**: Phase 2 - Data Layer (content management, import, Library UI)

See IMPLEMENTATION_PLAN.md for the full 62-task breakdown.

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
- TSV file at `data/kanjium_pitch/accents.txt`
- Format: `reading\tkanji\tpitch_pattern` (e.g., `タベル\t食べる\t2`)
- Pattern number = mora where pitch drops (0 = heiban/flat)

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
- Integration tests: `tests/integration/test_*_api.py` - test full API routes
- Use `@pytest.fixture` for service instances and test clients

**Test Naming**: `test_<method>_<scenario>` e.g., `test_tokenize_empty_string`

**Run specific tests**:
```bash
uv run pytest tests/unit/services/test_tokenizer_service.py -v
uv run pytest -k "test_merge" -v  # Run tests matching pattern
```

## Common Issues

- **Hydration mismatch**: Browser extensions (Dark Reader) can cause React hydration errors. Use `suppressHydrationWarning` on `<html>` element.
- **CORS**: Backend must allow frontend origin. Check `app/core/config.py` CORS settings.
- **Missing data files**: JMdict and Kanjium data require `pnpm setup` to download.
- **Database tables**: New tables require migration. Services should handle missing tables gracefully.

## Reference Documents

- **ARCHITECTURE.md**: Locked technical architecture (database schema, API spec, component hierarchy)
- **IMPLEMENTATION_PLAN.md**: Task specifications with acceptance criteria
- **README.md**: Setup instructions and feature overview
