# Mierutone

> **See the invisible melody of Japanese.**
>
> *Master pitch accent with instant visualization and native audio.*

---

## Features

- **Instant Pitch Visualization** - Type Japanese text, see HIGH/LOW patterns in real-time
- **Native TTS Audio** - Azure Neural voices for natural pronunciation
- **Record & Compare** - Overlay your voice on native pitch contours
- **Compound Word Breakdown** - Shows how compound words are analyzed with McCawley rules
- **Cross-Validation** - Kanjium + UniDic sources for higher accuracy
- **Confidence Indicators** - Solid/dashed/dotted lines show data reliability
- **Learn Section** - Guides on moras, pitch patterns, particles, and compounds
- **Romaji Input** - Type in romaji, auto-converts to hiragana

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Azure Speech API key (for TTS features)

### Docker (Recommended)

```bash
docker-compose up --build
# → http://localhost:3000
```

### Manual Setup

#### Backend (FastAPI)

```bash
cd backend

# Setup
python -m venv venv
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt

# Download pitch accent database (124k+ entries)
python scripts/download_dictionary.py

# Run
uvicorn app.main:app --reload
# → http://localhost:8000
```

#### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

## How It Works

```
User types text → SudachiPy tokenizes → Kanjium lookup + UniDic validation → Visual output
                                              ↓
                                    McCawley rules for unknown compounds
```

### The 4 Pitch Patterns

| Type | Name | Pattern | Example |
|------|------|---------|---------|
| 0 | Heiban (平板) | L-H-H-H... | 桜 (さくら) - stays high |
| 1 | Atamadaka (頭高) | H-L-L-L... | 猫 (ねこ) - drops after 1st |
| 2+ | Nakadaka (中高) | L-H-...-L | 卵 (たまご) - drops in middle |
| N | Odaka (尾高) | L-H-H↘particle | 山 (やま) - drops on particle |

### Data Sources & Confidence

| Source | Description | Confidence |
|--------|-------------|------------|
| `dictionary` | Exact match in Kanjium | High |
| `dictionary_lemma` | Matched via lemma (食べた→食べる) | Medium |
| `dictionary_unidic` | UniDic only (no Kanjium entry) | Low |
| `compound_rule` | McCawley rule prediction | Low |
| `particle` | Inherits from preceding word | High |

### McCawley Compound Rules

When a compound word isn't in the dictionary, we predict its accent:

| N2 Morae | Rule | Example |
|----------|------|---------|
| 1-2 | Accent on last mora of N1 | 外国人⁴ (がいこく + じん) |
| 3-4 | Accent on first mora of N2 | 携帯電話⁵ (けいたい + でんわ) |
| 5+ | Follow N2's original accent | (offset by N1 length) |

Dictionary entries always override predictions.

## Project Structure

```
mierutone/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app with CORS
│   │   ├── routers/
│   │   │   ├── analyze.py       # POST /api/analyze
│   │   │   ├── tts.py           # TTS endpoints
│   │   │   └── compare.py       # Pronunciation comparison
│   │   ├── services/
│   │   │   ├── pitch_analyzer.py # Core analysis logic
│   │   │   ├── tts.py           # Azure Speech + caching
│   │   │   └── audio_compare.py # Pitch extraction + DTW
│   │   └── models/
│   │       └── schemas.py       # Pydantic models
│   ├── data/
│   │   └── pitch.db             # Kanjium SQLite (124k+ entries)
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   └── (public)/learn/  # Educational content
│   │   ├── components/
│   │   │   ├── PhraseFlow.tsx   # Connected pitch visualization
│   │   │   ├── WordCard.tsx     # Individual word display
│   │   │   ├── TextInput.tsx    # Romaji → hiragana input
│   │   │   └── JapaneseText.tsx # BudouX line breaking
│   │   ├── lib/
│   │   │   └── api.ts           # API client
│   │   └── types/
│   │       └── pitch.ts         # TypeScript types
│   └── public/
├── docs/
└── supabase/                    # Database schema
```

## Tech Stack

### Backend
- **FastAPI** - REST API framework
- **SudachiPy** - Japanese tokenizer (Mode C for compounds, Mode A for splitting)
- **Fugashi + UniDic** - Secondary tokenizer for cross-validation
- **Azure Speech** - Neural TTS engine
- **Parselmouth** - Pitch extraction from audio
- **FastDTW** - Dynamic Time Warping for pitch comparison
- **SQLite** - Kanjium pitch accent database

### Frontend
- **Next.js 14** - React framework (App Router)
- **Tailwind CSS** - Styling with Riso-inspired color palette
- **Wanakana** - Romaji → Hiragana real-time conversion
- **BudouX** - Japanese line breaking at grammatical boundaries
- **Pitchy** - Real-time pitch detection from microphone
- **Tone.js** - Audio playback

## API Reference

### `POST /api/analyze`

Analyze Japanese text for pitch accent patterns.

```json
// Request
{ "text": "東京に行きます" }

// Response
{
  "words": [
    {
      "surface": "東京",
      "reading": "とうきょう",
      "accent_type": 0,
      "mora_count": 4,
      "morae": ["と", "う", "きょ", "う"],
      "pitch_pattern": ["L", "H", "H", "H"],
      "part_of_speech": "名詞",
      "source": "dictionary",
      "confidence": "high",
      "is_compound": false
    }
  ]
}
```

### `POST /api/tts`

Generate speech audio with word timings.

### `POST /api/compare`

Compare user recording against native TTS pronunciation.

## Environment Variables

### Backend (`backend/.env`)

```env
# Required for TTS
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=eastus

# Optional: Redis caching
REDIS_URL=redis://localhost:6379

# Optional: R2 cold storage
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ENDPOINT_URL=...
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Testing

```bash
# Backend
cd backend
.\venv\Scripts\pytest.exe tests/ -v --tb=short

# Frontend
cd frontend
npm run build  # Type checking included
```

## Roadmap

### Completed
- [x] Text analysis & pitch visualization
- [x] Azure Neural TTS with Redis+R2 caching
- [x] Voice recording & DTW comparison
- [x] /learn educational pages
- [x] Compound word analysis with McCawley rules
- [x] Cross-validation (Kanjium + UniDic)

### In Progress
- [ ] User accounts & progress tracking
- [ ] Study history & statistics

### Future
- [ ] Anki export for spaced repetition
- [ ] Browser extension
- [ ] Mobile app

## Data Attribution

- Pitch accent data from [Kanjium](https://github.com/mifunetoshiro/kanjium) (CC BY-SA 4.0)
- Cross-validation with [UniDic](https://clrd.ninjal.ac.jp/unidic/) (BSD-3)
- Reference: NHK日本語発音アクセント新辞典

## License

MIT
