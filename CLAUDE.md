# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PitchLab JP is a Japanese pitch accent learning tool. Users type Japanese text and see visual H/L (high/low) pitch patterns instantly. The app also provides TTS playback and pronunciation comparison (record your voice vs native TTS).

## Commands

### Backend (FastAPI)

```bash
cd backend

# Setup (first time)
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python scripts/import_kanjium.py  # Downloads pitch accent database

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
2. **SudachiPy tokenizes** (Mode C keeps compounds) → Looks up pitch in Kanjium SQLite
3. **Returns `WordPitch[]`** with morae, accent type (0=heiban, 1=atamadaka, N=nakadaka/odaka), and H/L patterns
4. **Frontend visualizes** pitch patterns per mora

### Backend Structure (`backend/app/`)

- `main.py` - FastAPI app with CORS, mounts routers at `/api`
- `routers/analyze.py` - POST `/api/analyze` - pitch accent analysis
- `routers/tts.py` - TTS endpoints (Azure Speech AI) with caching
- `routers/compare.py` - Compare user recording vs native TTS pitch
- `services/pitch_analyzer.py` - Core logic: SudachiPy tokenization + Kanjium lookup + H/L pattern generation
- `services/tts.py` - Azure Speech synthesis with Redis+R2 caching
- `services/audio_compare.py` - Pitch extraction (Parselmouth) + DTW alignment
- `models/schemas.py` - Pydantic models (`WordPitch`, `AnalyzeRequest/Response`)
- `core/config.py` - Settings from `.env` (Azure keys, Redis, R2)

### Frontend Structure (`frontend/src/`)

- `app/page.tsx` - Main page with text input + pitch visualizer
- `app/ear-training/page.tsx` - Quiz mode for pitch pattern recognition
- `components/PitchVisualizer.tsx` - Renders H/L pitch patterns
- `components/RecordCompare.tsx` - Record & compare pronunciation
- `lib/api.ts` - API client functions (`analyzeText`, `textToSpeech`, `comparePronunciation`)
- `types/pitch.ts` - TypeScript types mirroring backend schemas

### Key Dependencies

**Backend:**
- `sudachipy` + `sudachidict-core` - Japanese tokenizer (Mode C for compounds)
- `azure-cognitiveservices-speech` - TTS engine
- `praat-parselmouth` - Pitch extraction from audio
- `fastdtw` - Dynamic Time Warping for pitch comparison

**Frontend:**
- `pitchy` - Real-time pitch detection from microphone
- `tone` - Audio playback

### Pitch Database

SQLite database at `backend/data/pitch.db` created by `scripts/import_kanjium.py`. Contains 124k+ entries from Kanjium with surface, reading, and accent pattern.

### Environment Variables

Backend requires `.env` in `backend/` with:
- `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` - For TTS
- `REDIS_URL` (optional) - For TTS caching
- `R2_*` keys (optional) - For cold storage

Frontend uses `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000/api`).
