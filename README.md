# PitchLab JP 🇯🇵

> **The "Grammarly" of Japanese Pronunciation.**
>
> *Stop sounding like a robot. Start sounding native.*


![PitchLab Preview](/assets/preview.png)

---

## 🚀 Features

-   **Real-time Pitch Visualization**: Type any Japanese sentence and see the high/low pitch pattern instantly.
-   **Studio Layout**: A distraction-free, premium editor environment designed for serious study. 
-   **Soft Risograph Aesthetic**: A beautiful, calming UI inspired by print design to make studying less stressful.
-   **Analyze Anything**: Works with Kanji, Hiragana, and Katakana.
-   **Detailed Breakdown**: clear visibility of accent types (Heiban, Atamadaka, Nakadaka, Odaka).

## 🛠️ Tech Stack

-   **Frontend**: Next.js (App Router), Tailwind CSS, TypeScript
-   **Backend**: FastAPI, Python
-   **NLP Engine**: `fugashi` (MeCab wrapper) + `unidic` (Accent dictionary)

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
python -m unidic download
uvicorn main:app --reload
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

-   [x] **Phase 1: MVP Core** - Text Analysis & Visualization
-   [ ] **Phase 2: Audio (TTS)** - Native-level text-to-speech playback
-   [ ] **Phase 3: Record & Compare** - Overlay your voice on native pitch
-   [ ] **Phase 4: Browser Extension** - Pitch accent on any website

## 📄 License

MIT © PitchLab JP
