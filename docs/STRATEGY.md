# PitchLab JP: Product Strategy

> **Vision**: "See the Invisible" structure of Japanese pronunciation.
> Not a dictionary. A training tool with visual feedback.

---

## Current State (What's Built)

| Component | Status |
|-----------|--------|
| Lens A (X-Ray): Mora, Furigana, Accent Labels | ✅ Done |
| Lens B (Mic): Record & Compare with DTW | ✅ Done |
| Lens C (Ear): Quiz, Minimal Pairs | ❌ Not started |
| Curated Decks | ❌ Not started |
| Auth & Payments | ❌ Not started |

---

## Core Insight

**Content is the moat, not code.**

Anyone can build pitch visualization in a week.
Nobody will curate 500 N5 words with audio + explanations.

The Decks are the product. The tool is the delivery mechanism.

---

## Execution Strategy: Validate Before Monetize

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Phase 1          Phase 2          Phase 3            │
│   ────────         ────────         ────────           │
│   Launch Free  →   Collect Data  →  Monetize          │
│                                                         │
│   • No auth        • Who uses it?   • One-time first   │
│   • No limits      • What for?      • SaaS later       │
│   • Feedback form  • Pain points?   • Based on data    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Launch Free (NOW)

**Goal**: Get real users and feedback. Zero friction.

### Checklist
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway/Render
- [ ] Add feedback widget (Typeform embed or simple form)
- [ ] Share in Japanese learning communities
  - Reddit: r/LearnJapanese, r/japanese
  - Discord: AJATT, Refold, TheMoeWay
  - Twitter/X: Japanese learning accounts

### Success Metrics
- 100 unique visitors in first week
- 10 feedback submissions
- Understand: Who are they? What do they want?

---

## Phase 2: Content & Feedback Loop

**Goal**: Build what users actually want.

### Create Starter Decks (Free)
| Deck | Cards | Purpose |
|------|-------|---------|
| Robot Detox | 10 | Fix "foreigner flat" intonation |
| Minimal Pairs | 15 | 箸/橋, 雨/飴, 酒/鮭 |
| Greetings | 10 | Daily phrases done right |

### Collect Structured Feedback
- What's confusing?
- What's missing?
- Would you pay? For what?

---

## Phase 3: Monetize (After Validation)

**Start with one-time purchase, not subscription.**

Why: 5-10x higher conversion for niche products.

### Option A: Premium Deck ($19-29 one-time)
```
"N5 Pitch Mastery Pack"
- 500 words with pitch patterns
- Organized by accent type
- Audio for each word
- Practice sentences
```

### Option B: SaaS (Only if demand proven)
```
Free: Unlimited analysis + 1 starter deck
Pro ($9/mo): All decks + Quiz mode + History
```

---

## The 3 Lenses (Product Framework)

### Lens A: X-Ray (Analysis)
**"Why does it sound like that?"**
- Mora breakdown: とうきょう = 4 beats
- Accent type: 平板, 頭高, 中高, 尾高
- Part of speech context

### Lens B: Mic (Performance)
**"Let me try."**
- Record your voice
- Compare with native (DTW shape matching)
- Score 0-100 with feedback

### Lens C: Ear (Perception) [Future]
**"Can I hear the difference?"**
- Hidden pitch quiz
- Minimal pair discrimination
- Ear training exercises

---

## Technical Stack

| Component | Technology | Cost |
|-----------|------------|------|
| Frontend | Next.js 14 + Vercel | Free |
| Backend | FastAPI + Railway | ~$5/mo |
| TTS | Azure Speech AI | Pay-per-use (~$4/1M chars) |
| Analysis | fugashi + UniDic | Free |

**TTS Voices (Azure Speech AI - Neural, high quality):**
- 4 female voices (Nanami, Aoi, Mayu, Shiori)
- 3 male voices (Keita, Daichi, Naoki)
- No attribution required

---

## Next Step

**Deploy and share. Get 10 real users.**

```
1. Deploy Backend to Railway (with Azure Speech key)
2. Deploy frontend to Vercel
3. Add simple feedback form
4. Post in r/LearnJapanese
5. Listen and iterate
```
 