# MieruTone 🎵

> **See the invisible melody of Japanese.**
>
> *Master pitch accent with instant visualization and native audio.*

---

## 🚀 Features

-   **Instant Pitch Visualization**: Type any Japanese and see HIGH/LOW patterns immediately
-   **Native TTS Audio**: Azure Neural voices for natural pronunciation
-   **Record & Compare**: Overlay your voice on native pitch contours
-   **80+ Curated Examples**: Minimal pairs, verbs, greetings, and more
-   **Learn Section**: Guides on moras, the 4 pitch patterns, and more
-   **Cozy Risograph Design**: Soft, print-inspired aesthetic for stress-free study

## 🛠️ Tech Stack

-   **Frontend**: Next.js (App Router), Tailwind CSS, TypeScript
-   **Backend**: FastAPI, Python
-   **NLP Engine**: `SudachiPy` (Mode C for compound words) + `Kanjium` (124k+ pitch accent entries)
-   **Pitch Data**: [Kanjium](https://github.com/mifunetoshiro/kanjium) (CC BY-SA 4.0)

## 📦 Getting Started

### Prerequisites
-   Node.js 18+
-   Python 3.9+
-   Docker (Optional, but recommended)

### Quick Start (Docker)

```bash
docker-compose up --build
```

Access the app at `http://localhost:3000`.

### Manual Setup

#### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate

pip install -r requirements.txt
python scripts/import_kanjium.py  # Download pitch accent database
uvicorn app.main:app --reload
```
*Backend runs on http://localhost:8000*

#### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on http://localhost:3000*

## 🗺️ Roadmap

### Completed
-   [x] **Phase 1: MVP Core** - Text analysis & pitch visualization
-   [x] **Phase 2: Audio (TTS)** - Azure Neural TTS with caching
-   [x] **Phase 3: Record & Compare** - Voice comparison with DTW alignment
-   [x] **Phase 4: Content** - /learn pages, /examples library, landing page

### In Progress
-   [ ] **Phase 5: Auth** - User accounts, progress tracking

### Future
-   [ ] **Anki Export** - Download pitch cards for spaced repetition
-   [ ] **Browser Extension** - Pitch accent on any website

## 📄 License

MIT © MieruTone
