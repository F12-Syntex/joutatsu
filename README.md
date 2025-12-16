# Joutatsu (上達)

> A personal Japanese learning application focused on reading comprehension with adaptive difficulty, real-world content, and Anki integration.

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)

</div>

---

## Overview

Joutatsu (上達 - "improvement/mastery") bridges the gap between flashcard memorization and real reading comprehension. It adapts to your weaknesses, uses authentic Japanese content, and integrates with your existing Anki vocabulary.

### Key Features

- **Interactive Reading Canvas** - Hover over words for instant definitions, pitch accent, and examples
- **Adaptive Scoring System** - Tracks your weaknesses and calibrates content difficulty
- **Anki Integration** - Syncs with your existing vocabulary decks
- **Real Content Focus** - Import light novels, articles, PDFs - no artificial AI-generated practice text
- **Pitch Accent Display** - Visual pitch patterns for proper pronunciation
- **TTS Listening Practice** - Microsoft Edge neural voices for natural Japanese audio
- **PDF Reader** - Parse and study Japanese documents with full dictionary support

---

## Architecture

```
┌─────────────────────────────────────────┐
│  Single Python Process (FastAPI)        │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Static File Serving             │    │
│  │ (Built Next.js output)          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ API Routes (/api/*)             │    │
│  │ - Tokenization (SudachiPy)      │    │
│  │ - Dictionary (JMdict + Kanjium) │    │
│  │ - TTS (Edge TTS)                │    │
│  │ - AI Features (OpenRouter)      │    │
│  │ - Anki Sync (AnkiConnect)       │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ SQLite Database                 │    │
│  │ - User progress & scores        │    │
│  │ - Vocabulary tracking           │    │
│  │ - Content library               │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

Joutatsu runs as a **single standalone application** - no separate server and client processes. In production, FastAPI serves both the API and the built frontend.

---

## Tech Stack

### Backend
| Component | Technology |
|-----------|------------|
| Framework | FastAPI |
| Database | SQLite + SQLModel |
| Tokenizer | SudachiPy |
| Dictionary | jamdict (JMdict/JMnedict) |
| Pitch Accent | Kanjium (124k+ entries) |
| TTS | edge-tts |
| AI | OpenRouter SDK |
| Testing | pytest + pytest-asyncio |

### Frontend
| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router, Static Export) |
| Styling | Tailwind CSS + shadcn/ui |
| State (Server) | TanStack Query |
| State (Client) | Zustand |
| Testing | Vitest + Testing Library |

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **pnpm** (recommended) or yarn/npm
- **uv** (Python package manager) - `pip install uv`
- **Anki** with AnkiConnect addon (optional, for vocabulary sync)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/joutatsu.git
cd joutatsu
```

### 2. Install dependencies

```bash
# Install all dependencies (frontend + backend)
pnpm setup
```

This runs:
- `pnpm install` for frontend packages
- `uv sync` for Python packages
- `uv run python -m scripts.setup_data` for reference data (JMdict, Kanjium, SudachiPy dictionaries)

### 3. Configure environment variables

Create `.env` in the backend directory:

```bash
cp backend/.env.example backend/.env
```

```env
# backend/.env
DATABASE_URL=sqlite:///./data/joutatsu.db
DATA_DIR=./data
AUDIO_CACHE_DIR=./data/audio_cache
CONTENT_DIR=./data/content
JMDICT_PATH=./data/jmdict
PITCH_DATA_PATH=./data/pitch/kanjium.tsv
LOG_LEVEL=INFO
```

The frontend `.env.local` should already exist with your OpenRouter key:

```env
# frontend/.env.local (already created)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
```

### 4. Run the application

**Development mode** (hot reload for both frontend and backend):

```bash
pnpm dev
```

This starts:
- Backend at `http://localhost:8000`
- Frontend at `http://localhost:3000`

**Production mode** (single process):

```bash
pnpm build
pnpm start
```

Open `http://localhost:8000` - FastAPI serves everything.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `sqlite:///./data/joutatsu.db` |
| `DATA_DIR` | Base data directory | `./data` |
| `AUDIO_CACHE_DIR` | TTS audio cache | `./data/audio_cache` |
| `CONTENT_DIR` | Imported content storage | `./data/content` |
| `JMDICT_PATH` | jamdict data location | `./data/jmdict` |
| `PITCH_DATA_PATH` | Kanjium pitch accent file | `./data/pitch/kanjium.tsv` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features | Yes |

---

## OpenRouter Integration

Joutatsu uses [OpenRouter](https://openrouter.ai/) for AI-powered features:

- **Context-aware tooltips** - Get contextual word meanings based on surrounding text
- **PDF text reordering** - AI cleans up OCR/extraction artifacts
- **Difficulty estimation** - Analyze content complexity
- **Grammar explanations** - On-demand grammar pattern explanations

### Setup

1. Get an API key from [openrouter.ai](https://openrouter.ai/)
2. Add to `frontend/.env.local`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

### Usage in Code

```typescript
// Frontend: services/ai.ts
import OpenAI from 'openai'

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'Joutatsu',
  },
})

export async function getContextualMeaning(word: string, context: string): Promise<string> {
  const response = await openrouter.chat.completions.create({
    model: 'anthropic/claude-3.5-sonnet',  // or any model on OpenRouter
    messages: [
      {
        role: 'system',
        content: 'You are a Japanese language expert. Explain the meaning of the word in the given context. Be concise.',
      },
      {
        role: 'user',
        content: `Word: ${word}\nContext: ${context}\n\nExplain the meaning of this word in this specific context.`,
      },
    ],
    max_tokens: 200,
  })
  
  return response.choices[0].message.content ?? ''
}
```

```typescript
// Frontend: services/ai.ts - PDF text cleanup
export async function cleanPdfText(rawText: string): Promise<string> {
  const response = await openrouter.chat.completions.create({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      {
        role: 'system',
        content: 'You are a text processing assistant. Reorder and clean the following Japanese text extracted from a PDF. Fix any obvious extraction errors, remove artifacts, and ensure proper reading order (top to bottom, right to left for vertical text). Return only the cleaned text.',
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

### Recommended Models

| Use Case | Recommended Model | Notes |
|----------|-------------------|-------|
| Context tooltips | `anthropic/claude-3.5-sonnet` | Best quality, fast |
| PDF cleanup | `anthropic/claude-3.5-sonnet` | Good at text reordering |
| Grammar explanations | `anthropic/claude-3.5-sonnet` | Detailed explanations |
| Bulk processing | `anthropic/claude-3-haiku` | Cheaper for high volume |

---

## Scripts

All scripts are run from the project root:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development servers (frontend + backend) |
| `pnpm build` | Build frontend for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run all tests (backend + frontend) |
| `pnpm test:backend` | Run backend tests only |
| `pnpm test:frontend` | Run frontend tests only |
| `pnpm lint` | Lint all code |
| `pnpm lint:backend` | Lint Python code (Ruff) |
| `pnpm lint:frontend` | Lint TypeScript code (ESLint) |
| `pnpm setup` | Install all dependencies + reference data |

---

## Project Structure

```
joutatsu/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # API endpoints
│   │   ├── core/              # Database, logging, exceptions
│   │   ├── models/            # SQLModel database models
│   │   ├── repositories/      # Data access layer
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic
│   │   └── utils/             # Helpers
│   ├── data/                  # Reference data (JMdict, Kanjium)
│   ├── scripts/               # Setup and utility scripts
│   └── tests/                 # pytest tests
│
├── frontend/
│   ├── app/                   # Next.js App Router pages
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── canvas/            # Reading canvas components
│   │   ├── tooltip/           # Tooltip system
│   │   ├── library/           # Content library
│   │   ├── progress/          # Progress display
│   │   ├── audio/             # Audio player
│   │   └── settings/          # Settings UI
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand stores
│   ├── services/              # API client functions
│   ├── types/                 # TypeScript types
│   └── lib/                   # Utilities
│
├── data/                      # User data (gitignored)
│   ├── joutatsu.db            # SQLite database
│   ├── audio_cache/           # Cached TTS audio
│   └── content/               # Imported books/PDFs
│
├── ARCHITECTURE.md            # Technical architecture (LOCKED)
├── IMPLEMENTATION_PLAN.md     # Task specifications
└── README.md                  # This file
```

---

## Anki Integration

Joutatsu can sync with your Anki vocabulary decks to mark known words while reading.

### Setup

1. Install [AnkiConnect](https://ankiweb.net/shared/info/2055492159) addon in Anki
2. Keep Anki running while using Joutatsu
3. Go to Settings → Anki in Joutatsu
4. Select your deck and configure field mappings

### How it works

- **Mature cards** (interval ≥ 21 days) are marked as "known"
- **Learning cards** are marked as "learning" 
- Known words appear differently in the reading canvas
- Lookups are tracked to identify words that need more review

---

## Development

### Running tests

```bash
# All tests
pnpm test

# Backend only with coverage
cd backend && uv run pytest --cov=app

# Frontend only
cd frontend && pnpm test
```

### Code style

- **Python**: Ruff for linting and formatting
- **TypeScript**: ESLint + Prettier
- **Commits**: Conventional commits recommended

### Adding new features

1. Check `ARCHITECTURE.md` for patterns and conventions
2. Create a task specification following the template in `IMPLEMENTATION_PLAN.md`
3. Implement following SRP - no file over 200 lines
4. Write tests before marking complete
5. Update documentation if needed

---

## Data Sources & Attribution

Joutatsu uses the following open-source data:

- **JMdict/JMnedict** - Japanese-English dictionary  
  *Property of the Electronic Dictionary Research and Development Group, used under [CC BY-SA 4.0](https://www.edrdg.org/edrdg/licence.html)*

- **Kanjium** - Pitch accent dictionary (124,000+ entries)  
  *[CC BY-SA 4.0](https://github.com/mifunetoshiro/kanjium)*

- **SudachiPy** - Japanese morphological analyzer  
  *[Apache 2.0](https://github.com/WorksApplications/SudachiPy)*

---

## Roadmap

- [x] Architecture planning
- [ ] Phase 0: Foundation
- [ ] Phase 1: Core Reading
- [ ] Phase 2: Data Layer
- [ ] Phase 3: Progress System
- [ ] Phase 4: Anki Integration
- [ ] Phase 5: Audio
- [ ] Phase 6: Polish

See `IMPLEMENTATION_PLAN.md` for detailed task breakdown.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [SudachiPy](https://github.com/WorksApplications/SudachiPy) for excellent Japanese tokenization
- [jamdict](https://github.com/neocl/jamdict) for JMdict integration
- [Kanjium](https://github.com/mifunetoshiro/kanjium) for comprehensive pitch accent data
- [edge-tts](https://github.com/rany2/edge-tts) for free neural TTS
- [OpenRouter](https://openrouter.ai/) for unified AI model access
- [shadcn/ui](https://ui.shadcn.com/) for beautiful React components
