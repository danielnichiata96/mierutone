# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mierutone is a Japanese pitch accent learning tool. Users type Japanese text and see visual H/L (high/low) pitch patterns instantly. The app also provides TTS playback and pronunciation comparison (record your voice vs native TTS).

## Language

**Always write in English.** All code, comments, documentation, commit messages, and user-facing text must be in English. Do not use Portuguese or any other language.

## Commands

### Backend (FastAPI)

```bash
cd backend

# Setup (first time)
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python scripts/download_dictionary.py  # Downloads pitch accent database from GitHub

# Run dev server
uvicorn app.main:app --reload  # http://localhost:8000

# Run tests
.\venv\Scripts\pytest.exe tests/test_pitch_integration.py -v
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
npm run build
npm run lint
```

### Docker (full stack)

```bash
docker-compose up --build
```

## Architecture

### Data Flow

1. **User types Japanese text** → Frontend sends to `/api/analyze`
2. **SudachiPy tokenizes** (Mode C keeps compounds) → Looks up pitch in Kanjium SQLite + UniDic cross-validation
3. **Returns `WordPitch[]`** with morae, accent type, H/L patterns, source, confidence, and compound components
4. **Frontend visualizes** pitch patterns with confidence indicators

### Pitch Analysis Pipeline

```
Token → Kanjium lookup → UniDic cross-validation → Compound detection → Final result
         ↓                    ↓                        ↓
    surface/reading      validates accent         McCawley rules
    exact match          or flags uncertainty     for prediction
```

### Source Types (transparency)

| Source | Description | Confidence |
|--------|-------------|------------|
| `dictionary` | Exact match in Kanjium | high |
| `dictionary_lemma` | Matched via lemma (食べた→食べる) | medium |
| `dictionary_reading` | Matched by reading only | low |
| `dictionary_unidic` | UniDic only (no Kanjium entry) | low |
| `dictionary_proper` | Proper noun in Kanjium | medium |
| `unidic_proper` | Proper noun in UniDic only | low |
| `compound_rule` | McCawley rule prediction | low |
| `particle` | Particle (inherits from context) | high |
| `rule` | Rule-based fallback | low |

### Compound Word Analysis

Compounds are detected via `token.split(Mode.A)` and analyzed using McCawley rules:

| N2 Morae | Rule | Example |
|----------|------|---------|
| 1-2 | Accent on last mora of N1 | 日本語 → accent=3 |
| 3-4 | Accent on first mora of N2 | 携帯電話 → accent=5 |
| 5+ | Follow N2's original accent | (offset by N1 length) |

Dictionary entries always take priority over rule predictions.

### Backend Structure (`backend/app/`)

- `main.py` - FastAPI app with CORS, mounts routers at `/api`
- `routers/analyze.py` - POST `/api/analyze` - pitch accent analysis
- `routers/tts.py` - TTS endpoints (Azure Speech AI) with caching
- `routers/compare.py` - Compare user recording vs native TTS pitch
- `services/pitch_analyzer.py` - Core logic: tokenization, lookup, compound analysis, H/L pattern generation
- `services/tts.py` - Azure Speech synthesis with Redis+R2 caching
- `services/audio_compare.py` - Pitch extraction (Parselmouth) + DTW alignment
- `models/schemas.py` - Pydantic models (`WordPitch`, `ComponentPitch`, `AnalyzeRequest/Response`)
- `core/config.py` - Settings from `.env` (Azure keys, Redis, R2)

### Frontend Structure (`frontend/src/`)

- `app/page.tsx` - Main page with text input + pitch visualizer
- `components/PitchVisualizer.tsx` - Container for WordCards
- `components/WordCard.tsx` - Individual word pitch visualization with compound breakdown
- `components/PhraseFlow.tsx` - Connected pitch visualization across word boundaries
- `components/pitch/` - Shared pitch rendering components (PitchDot, PitchGlow)
- `components/RecordCompare.tsx` - Record & compare pronunciation
- `components/JapaneseText.tsx` - BudouX-powered text component for proper Japanese line breaking
- `lib/api.ts` - API client functions (`analyzeText`, `textToSpeech`, `comparePronunciation`)
- `lib/colors.ts` - Riso color palette and styling constants
- `types/pitch.ts` - TypeScript types mirroring backend schemas

### Visual Design

- **Riso palette**: coral (HIGH), cornflower (LOW), black (text/neutral)
- **Confidence**: solid line (high), dashed (medium), dotted (low)
- **Particles**: dashed dots, reduced opacity (inherit pitch from context)
- **Proper nouns**: dotted dots (pitch may vary by region)
- **Compounds**: show component breakdown with prediction status

### Key Dependencies

**Backend:**
- `sudachipy` + `sudachidict-full` - Japanese tokenizer (Mode C for compounds, Mode A for splitting)
- `fugashi` + `unidic` - Secondary tokenizer for cross-validation
- `azure-cognitiveservices-speech` - TTS engine
- `praat-parselmouth` - Pitch extraction from audio
- `fastdtw` - Dynamic Time Warping for pitch comparison

**Frontend:**
- `pitchy` - Real-time pitch detection from microphone
- `tone` - Audio playback
- `wanakana` - Romaji to hiragana conversion
- `budoux` - Japanese line breaking (wraps text at grammatically correct positions)

### Pitch Database

SQLite database at `backend/data/pitch.db` downloaded from [mierutone-dictionary](https://github.com/danielnichiata96/mierutone-dictionary) releases. Contains 124k+ entries from Kanjium with surface, reading, accent pattern, and word origin (goshu).

Run `python scripts/download_dictionary.py` to fetch the latest version.

### Environment Variables

Backend requires `.env` in `backend/` with:
- `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` - For TTS
- `REDIS_URL` (optional) - For TTS caching
- `R2_*` keys (optional) - For cold storage

Frontend uses `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000/api`).
