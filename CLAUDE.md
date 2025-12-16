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

The project is in **early development** (Phase 0: Foundation). Current state is frontend scaffold only. See IMPLEMENTATION_PLAN.md for the 62-task breakdown across 8 weeks.

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

## Reference Documents

- **ARCHITECTURE.md**: Locked technical architecture (database schema, API spec, component hierarchy)
- **IMPLEMENTATION_PLAN.md**: Task specifications with acceptance criteria
- **README.md**: Setup instructions and feature overview
