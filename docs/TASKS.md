# Mierutone - Implementation Tasks

> **Status:** Revised next steps aligned with `docs/USER_JOURNEY_SRS.md` and current codebase.

---

## Current State Summary

### Implemented (Working)
- [x] Analyzer with pitch visualization
- [x] TTS playback (Azure)
- [x] Record & Compare pronunciation
- [x] Deck library + deck detail
- [x] Card navigation (arrows/keyboard/swipe)
- [x] Progress persistence per deck
- [x] Supabase Auth (Google + GitHub OAuth)
- [x] Streak tracking + Dashboard basics

### Implemented but Needs Data Fix
- [~] Minimal Pairs deck content (seed updated; database still needs update)

### Not Implemented / Gaps
- [ ] Quiz mode (core learning loop)
- [ ] Shadowing mode (guided repetition UX)
- [ ] SRS endpoints + review UI
- [ ] Phases (1-4) with gates + completion criteria
- [ ] Stripe payment integration
- [ ] Free/Pro tier gating
- [ ] Magic Link signup (if the "email gate" model stays)
- [ ] Anonymous analyzer daily limit (10/day)
- [ ] Additional content decks (N5, Verbos, etc.)

---

## Sprint 0: Data + Alignment (P0)

**Goal:** Remove blockers before feature work.

| Task | File | Description |
|------|------|-------------|
| 0.1 | `backend/migrations/002_seed_initial_decks.sql` | Apply updated Minimal Pairs seed to DB (new pairs + 1-mora with particle) |
| 0.2 | `docs/USER_JOURNEY_SRS.md` | Define Phase 1 completion criteria (ex: both decks completed + 80% quiz) |
| 0.3 | `docs/USER_JOURNEY_SRS.md` | Decide: keep Magic Link gate or switch journey to OAuth-only |
| 0.4 | `backend/app/routers/progress.py` | Add progress summary endpoint (phase completion, % per phase) |
| 0.5 | `backend/app/routers/analyze.py` | Enforce anonymous daily limit (10/day) with rate tracking |

---

## Sprint 1: Quiz MVP (P0)

**Goal:** Ship the core learning mechanic fast.

### Backend Tasks

| Task | File | Description |
|------|------|-------------|
| 1.1 | `backend/app/models/quiz.py` | Define `QuizQuestion`, `QuizAnswer` schemas |
| 1.2 | `backend/app/routers/quiz.py` | GET `/api/quiz/decks/{slug}/questions` (server generates questions from cards) |
| 1.3 | `backend/app/routers/quiz.py` | POST `/api/quiz/answer` (server grades by card id + type) |
| 1.4 | `backend/app/routers/quiz.py` | Optional: POST `/api/quiz/results` (store summary per user) |

### Frontend Tasks

| Task | File | Description |
|------|------|-------------|
| 1.5 | `frontend/src/types/quiz.ts` | Quiz types for questions/answers |
| 1.6 | `frontend/src/lib/api/quiz.ts` | `getQuestions`, `submitAnswer`, `submitResults` |
| 1.7 | `frontend/src/lib/api/index.ts` | Re-export quiz API |
| 1.8 | `frontend/src/app/(dashboard)/decks/[slug]/quiz/page.tsx` | Quiz page (audio + 4 options) |
| 1.9 | `frontend/src/components/quiz/QuizCard.tsx` | Question UI |
| 1.10 | `frontend/src/components/quiz/QuizFeedback.tsx` | Correct/incorrect feedback |
| 1.11 | `frontend/src/components/quiz/QuizResults.tsx` | Final score + retry/continue |

### Quiz Question Types

```typescript
// Type 1: Audio → Pattern
{
  type: "audio_to_pattern",
  card_id: "...",
  audio_url: "/api/tts?text=はし",
  options: ["平板", "頭高", "中高", "尾高"]
}

// Type 2: Visual → Pattern
{
  type: "visual_to_pattern",
  card_id: "...",
  word: "日本",
  reading: "にほん",
  options: ["平板", "頭高", "中高", "尾高"]
}
```

---

## Sprint 2: Gates + Payment (P0)

**Goal:** Monetization and phase gating.

### Backend Tasks

| Task | File | Description |
|------|------|-------------|
| 2.1 | `backend/migrations/007_pro_status.sql` | Add `is_pro`, `pro_since`, `stripe_customer_id` to `profiles` |
| 2.2 | `backend/app/routers/payment.py` | Stripe checkout + webhook + status |
| 2.3 | `backend/app/core/gates.py` | `check_phase_access()`, `check_deck_access()` |
| 2.4 | `backend/app/routers/decks.py` | Enforce free/pro access rules |
| 2.5 | `backend/app/routers/quiz.py` | Gate quiz access for Pro decks |

### Frontend Tasks

| Task | File | Description |
|------|------|-------------|
| 2.6 | `frontend/src/app/(marketing)/pricing/page.tsx` | Pricing page |
| 2.7 | `frontend/src/components/gates/SignupGate.tsx` | Gate after Phase 1 (Magic Link or OAuth) |
| 2.8 | `frontend/src/components/gates/UpgradeGate.tsx` | Pro upsell modal |
| 2.9 | `frontend/src/components/gates/ProBadge.tsx` | Badge for Pro-only content |
| 2.10 | `frontend/src/lib/stripe.ts` | Stripe client setup |
| 2.11 | `frontend/src/hooks/useProStatus.ts` | Cache Pro status |

---

## Sprint 3: Shadowing Mode (P1)

**Goal:** Guided repetition with pitch scoring.

### Backend Tasks

| Task | File | Description |
|------|------|-------------|
| 3.1 | `backend/app/routers/shadowing.py` | GET `/api/shadowing/{deck_slug}/next` |
| 3.2 | `backend/app/routers/shadowing.py` | POST `/api/shadowing/compare` (reuse compare) |
| 3.3 | `backend/app/routers/shadowing.py` | POST `/api/shadowing/complete` |
| 3.4 | `backend/migrations/006_shadowing_progress.sql` | Optional: store shadowing sessions |

### Frontend Tasks

| Task | File | Description |
|------|------|-------------|
| 3.5 | `frontend/src/app/(dashboard)/shadowing/[slug]/page.tsx` | Shadowing page |
| 3.6 | `frontend/src/components/shadowing/ShadowingCard.tsx` | Listen → Record → Compare |
| 3.7 | `frontend/src/components/shadowing/ComparisonResult.tsx` | Pitch curve overlay |
| 3.8 | `frontend/src/components/shadowing/ShadowingProgress.tsx` | Session progress |

---

## Sprint 4: SRS (P1)

**Goal:** Daily review loop and retention.

> Note: `user_card_progress` already contains SM-2 fields (see `backend/migrations/001_deck_system.sql`).

### Backend Tasks

| Task | File | Description |
|------|------|-------------|
| 4.1 | `backend/app/services/srs.py` | SM-2 algorithm implementation |
| 4.2 | `backend/app/routers/srs.py` | GET `/api/srs/due` |
| 4.3 | `backend/app/routers/srs.py` | POST `/api/srs/review` |
| 4.4 | `backend/app/routers/srs.py` | GET `/api/srs/stats` |

### Frontend Tasks

| Task | File | Description |
|------|------|-------------|
| 4.5 | `frontend/src/app/(dashboard)/review/page.tsx` | Daily review page |
| 4.6 | `frontend/src/components/srs/ReviewCard.tsx` | Easy/Good/Hard/Again |
| 4.7 | `frontend/src/components/srs/ReviewStats.tsx` | Mastery summary |
| 4.8 | `frontend/src/components/dashboard/DueCards.tsx` | Dashboard widget |

---

## Sprint 5: Content & Polish (P2)

**Goal:** Scale content and refine UX.

### Content Tasks

| Task | Description |
|------|-------------|
| 5.1 | Create deck: N5 Essencial (200 words) |
| 5.2 | Create deck: Verbos Básicos (100 words) |
| 5.3 | Create deck: Cumprimentos (80 words) |
| 5.4 | Create deck: Números/Contadores (100 words) |
| 5.5 | Create deck: Partículas (50 patterns) |

### UX Tasks

| Task | File | Description |
|------|------|-------------|
| 5.6 | `frontend/src/components/onboarding/` | Guided onboarding for Phase 1 |
| 5.7 | `frontend/src/app/(dashboard)/progress/page.tsx` | Detailed progress page with phase breakdown |
| 5.8 | `frontend/src/components/dashboard/ActivityHeatmap.tsx` | Activity heatmap |
| 5.9 | `frontend/src/components/certificates/` | Phase completion certificates |

---

## Database Schema Additions (Planned)

```sql
-- Optional: quiz sessions + answers (if persisting results)
CREATE TABLE quiz_sessions (...);
CREATE TABLE quiz_answers (...);

-- Optional: shadowing sessions
CREATE TABLE shadowing_sessions (...);

-- Pro status on profiles
ALTER TABLE profiles ADD COLUMN
  is_pro BOOLEAN DEFAULT false,
  pro_since TIMESTAMPTZ,
  stripe_customer_id TEXT;
```

---

## Environment Variables to Add

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...  # $29 Pro price
STRIPE_EARLY_BIRD_PRICE_ID=price_...  # $19 Early Bird price

# Frontend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Testing Checklist

### Sprint 0
- [ ] Minimal Pairs data updated in DB
- [ ] Phase 1 completion criteria finalized
- [ ] Gate trigger rules defined and testable

### Sprint 1 (Quiz MVP)
- [ ] Start quiz for free deck (no auth)
- [ ] Start quiz for Pro deck (requires auth + Pro)
- [ ] Submit correct answer → feedback
- [ ] Submit wrong answer → shows correct answer
- [ ] Complete quiz → show final score

### Sprint 2 (Gates + Stripe)
- [ ] Signup gate after Phase 1
- [ ] Upgrade gate blocks Phase 2+ content
- [ ] Stripe checkout creates session
- [ ] Webhook updates `profiles.is_pro`
- [ ] Pro user bypasses all gates

### Sprint 3 (Shadowing)
- [ ] Play native audio
- [ ] Record user audio
- [ ] Compare returns similarity score
- [ ] Free user limited to 3/day
- [ ] Pro user unlimited

### Sprint 4 (SRS)
- [ ] New cards start with interval=1
- [ ] "Good" increases interval (1→3→7→14...)
- [ ] "Again" resets interval to 1
- [ ] Due cards appear in dashboard
- [ ] Review session updates `next_review_at`

---

## Recommended Execution Order

```
Week 0:   Data + Alignment (Sprint 0)
Week 1-2: Quiz MVP (Sprint 1)
Week 3-4: Gates + Payment (Sprint 2)
Week 5-6: Shadowing (Sprint 3)
Week 7-8: SRS (Sprint 4)
Week 9+:  Content + Polish (Sprint 5)
```
