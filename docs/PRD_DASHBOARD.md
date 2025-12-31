# PRD: Dashboard & User Workspace

**Product**: MieruTone
**Feature**: Dashboard, Settings & User Management
**Version**: 1.0
**Last Updated**: 2025-12-30
**Status**: Draft

---

## 1. Overview

### 1.1 Problem Statement

Currently, MieruTone provides a powerful pitch accent analysis tool, but lacks a cohesive user workspace for logged-in users. Users cannot:
- View their practice history and progress over time
- Customize their experience (voice preferences, display settings)
- Manage their account and data

### 1.2 Goal

Create a separated "workspace" experience for authenticated users that provides:
- Persistent navigation via sidebar
- Dashboard with usage statistics
- Full history of analyses and practice sessions
- Customizable settings and preferences
- Secure, personalized data access

### 1.3 Success Metrics

| Metric | Target |
|--------|--------|
| User retention (7-day) | +20% |
| Average session duration | +30% |
| Settings page engagement | >40% of logged-in users |
| History page views | >60% of logged-in users |

---

## 2. User Stories

### 2.1 Core Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US-01 | Logged-in user | See my practice statistics on a dashboard | I can track my progress |
| US-02 | Logged-in user | View my complete analysis history | I can review words I've practiced |
| US-03 | Logged-in user | Change my display name | My profile reflects how I want to be called |
| US-04 | Logged-in user | Select a default TTS voice | I don't have to change it every session |
| US-05 | Logged-in user | Export my data | I have ownership of my practice history |
| US-06 | Logged-in user | Delete my account | I can remove all my data if needed |

### 2.2 Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-01 | User accesses /dashboard without login | Redirect to /login?next=/dashboard |
| EC-02 | User's token expires during session | Client-side token refresh via Supabase SDK (silent); if refresh fails, redirect to /login |
| EC-03 | User has no history yet | Show empty state with CTA to practice |

---

## 3. Functional Requirements

### 3.1 Navigation & Layout

#### FR-3.1.1 Sidebar Navigation (Desktop)

**Description**: Persistent sidebar for authenticated pages with neobrutalist styling.

**Requirements**:
- Width: 256px (w-64)
- Position: Fixed left
- Visual style: Riso color palette, thick borders (2px)
- Background: paper-white with subtle border

**Menu Items**:

| Item | Icon | Route | Description |
|------|------|-------|-------------|
| Overview | Grid | /dashboard | Statistics dashboard |
| History | Clock | /history | Analysis & score history |
| Progress | Chart | /progress | Learning progress visualization |
| Practice | Target | /app | Link back to practice tool |
| Settings | Gear | /settings | Account & preferences |

**User Section** (bottom):
- Avatar (from OAuth or initial)
- Display name
- Email (truncated)
- Sign out button

#### FR-3.1.2 Mobile Navigation

**Description**: Responsive navigation for mobile devices.

**Requirements**:
- Hamburger menu button (top-left, fixed)
- Slide-out drawer (same content as desktop sidebar)
- Overlay backdrop when open
- Close on navigation or backdrop click

#### FR-3.1.3 Route Protection

**Description**: All dashboard routes require authentication.

**Requirements**:
- Middleware checks Supabase session on every request
- Invalid/expired session → redirect to /login
- Preserve original URL in `next` query param
- Preserve query params in redirect (e.g., /settings?tab=voice)

---

### 3.2 Dashboard Page (/dashboard)

#### FR-3.2.1 Statistics Cards

**Display the following metrics**:

| Stat | Source | Display | Note |
|------|--------|---------|------|
| Total Analyses | COUNT(analyses) | Number | All analysis requests |
| Total Practice Sessions | COUNT(comparison_scores) | Number | Voice comparisons completed |
| Average Score | AVG(comparison_scores.score) | Percentage | Mean of all comparison scores |
| Unique Texts | COUNT(DISTINCT text) | Number | Unique phrases analyzed (not tokenized words) |

**Visual Requirements**:
- 2x2 grid on desktop, stacked on mobile
- Riso card styling with primary accent
- Icon + label + value format

#### FR-3.2.2 Recent Activity

**Requirements**:
- Show last 5 analyses with timestamp
- Show last 5 comparison scores with score badge
- "View All" link to /history
- Empty state if no activity

#### FR-3.2.3 Quick Actions

**Requirements**:
- "Start Practicing" button → /app
- "View Progress" button → /progress (if implemented)

#### FR-3.2.4 Achievements & Milestones (MVP)

**Implementation**: In-app only (no email in MVP).

**Milestone Toasts** (shown once when achieved):

| Milestone | Message | Badge |
|-----------|---------|-------|
| First Analysis | "Welcome! You analyzed your first word!" | 🎯 |
| 10 Analyses | "Getting started! 10 analyses complete." | 📚 |
| 100 Analyses | "Dedicated learner! 100 analyses!" | 🌟 |
| First Comparison | "Great work recording your first comparison!" | 🎤 |
| Score 90%+ | "Excellent pronunciation! 90%+ score!" | 🏆 |
| 7-Day Streak | "One week streak! Keep it up!" | 🔥 |

**Display**:
- Toast notification on achievement (auto-dismiss 5s)
- Badge collection shown on Dashboard (earned badges only)
- Badges stored in `public.user_achievements` table

**Phase 2 (Future)**: Email notifications with opt-in, max 1/week frequency.

---

### 3.3 History Page (/history)

#### FR-3.3.1 History List

**Requirements**:
- Two tabs: "Analyses" and "Practice Scores"
- Paginated list (20 items per page)
- Each item shows: text, timestamp, word count (analyses) or score (practice)
- Click to expand/view details

**Pagination Strategy**: Cursor-based (recommended for real-time data)

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | enum | **Required**: `analysis` or `comparison` (each tab maintains independent cursor) |
| `limit` | int | Items per page (default: 20, max: 100) |
| `cursor` | string | Opaque cursor from previous response (base64 encoded `created_at:id`) |
| `direction` | enum | `next` (older) or `prev` (newer), default: `next` |

**Response Format**:
```json
{
  "items": [...],
  "next_cursor": "eyJjcmVhdGVkX2F0IjoiMjAyNS0wMS0wMVQxMjowMDowMFoiLCJpZCI6IjEyMyJ9",
  "prev_cursor": null,
  "has_more": true
}
```

#### FR-3.3.2 Filters (P3 - Future)

**Requirements**:
- Date range picker
- Accent type filter (Heiban, Atamadaka, Nakadaka, Odaka)
- Search by word/phrase
- Sort by date (newest/oldest)

#### FR-3.3.3 Empty State

**Requirements**:
- Friendly illustration or icon
- Message: "No history yet"
- CTA: "Start practicing" → /app

#### FR-3.3.4 Data Retention Policy

**Tier Limits**:

| Tier | Time Limit | Record Limit | Aggregate Stats |
|------|------------|--------------|-----------------|
| Free | 12 months | 10,000 records | Always preserved |
| Pro | Unlimited | Unlimited | Always preserved |

**Enforcement**:
- Limits apply to `analysis_history` + `comparison_scores` combined
- Cleanup runs via scheduled job (daily at 3 AM UTC)
- Oldest records deleted first when limit exceeded
- Aggregate stats (totals, averages) preserved in `user_stats_snapshot` before deletion

**User Notifications**:

| Threshold | Action |
|-----------|--------|
| 80% of limit | In-app banner: "You're approaching your history limit" |
| 95% of limit | Email + banner: "Export your data before oldest records are removed" |
| At limit | Toast on each new record: "Oldest record removed to make space" |

**Export CTA**: All limit warnings include prominent "Export Data" button.

---

### 3.4 Settings Page (/settings)

#### FR-3.4.1 Account Section

**Fields**:

| Field | Type | Editable | Source |
|-------|------|----------|--------|
| Avatar | Image | No | OAuth provider |
| Email | Text | No | OAuth provider |
| Display Name | Text | Yes | public.profiles |
| Provider | Badge | No | OAuth provider (Google/GitHub) |

**Save Behavior**:
- Auto-save on blur or Enter key
- Show success toast on save
- Show error toast on failure

#### FR-3.4.2 Preferences Section

**TTS Preferences**:

| Setting | Type | Options | Default |
|---------|------|---------|---------|
| Default Voice | Select | Female 1-4, Male 1-3 | Female 1 |
| Playback Speed | Slider | 0.5x - 1.5x | 1.0x |

**Validation** (frontend + backend):
```typescript
// lib/constants.ts
export const VALID_VOICES = [
  'female1', 'female2', 'female3', 'female4',
  'male1', 'male2', 'male3'
] as const;

export type VoiceOption = typeof VALID_VOICES[number];

// Validate before API call
function isValidVoice(voice: string): voice is VoiceOption {
  return VALID_VOICES.includes(voice as VoiceOption);
}
```

**Display Preferences**:

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| Show Accent Numbers | Toggle | Display numerical accent notation | On |
| Show Part of Speech | Toggle | Display word class (noun, verb, etc.) | Off |
| Show Confidence | Toggle | Display confidence indicators | On |

**Storage Strategy**:
- **Source of truth**: Server (public.user_preferences table)
- **Flow**: On page load, fetch from server → cache in memory. On change, update server first → update local state on success.
- **Offline**: No offline support. On unstable connection, show warning banner and disable preference controls until reconnected.
- **Multi-device**: Server always wins; no client-side persistence to avoid stale overwrites.

#### FR-3.4.3 Data & Privacy Section

**Export Data**:
- Button: "Export My Data"
- Formats: JSON (default), CSV
- Contents: All analyses, all scores, profile data
- **Limits**: Max 10,000 records per export; if exceeded, show message to contact support
- **Delivery**: Immediate download for <1000 records; for larger exports, generate async and email download link (future enhancement)

**Danger Zone**:

| Action | Confirmation | Effect |
|--------|--------------|--------|
| Clear History | Double confirm modal | Delete all analyses & scores (user's RLS scope) |
| Delete Account | Type "DELETE" to confirm | Remove all data, sign out, delete auth user |

**Delete Account Implementation**:
- Requires backend endpoint with **service role key** (not anon key)
- Flow:
  1. User confirms deletion (type "DELETE")
  2. Frontend calls `DELETE /api/account` with user's JWT
  3. Backend validates JWT, extracts user_id
  4. Backend uses **service role client** to:
     - Delete from public.profiles (CASCADE handles related tables)
     - Call `supabase.auth.admin.delete_user(user_id)`
  5. Frontend clears local session, redirects to home
- **Security**: Service role key is server-side only, never exposed to client

---

## 4. Technical Requirements

### 4.1 Authentication Middleware

**Location**: `frontend/src/middleware.ts`

**Logic**:
```
1. Check if route matches /dashboard, /history, /progress, /settings
2. Get Supabase session from cookies
3. If no valid session:
   a. Capture current path + query params
   b. Redirect to /login?next={encoded_path}
4. If valid session:
   a. Continue to requested page
```

**Session Handling Strategy**:

| Scenario | Handler | Behavior |
|----------|---------|----------|
| No session on page load | Middleware (server) | Redirect to /login?next={path} |
| Token expires during use | Client (useAuth hook) | Silent refresh via Supabase SDK |
| Refresh token expired | Client (useAuth hook) | Redirect to /login?next={path} |
| API returns 401 | Client (API layer) | Trigger re-auth flow |

**Note**: Middleware handles initial access control. Client-side handles token lifecycle during active sessions to avoid interrupting user workflow.

### 4.2 Database Schema

#### Table: public.profiles

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### Table: public.user_preferences

```sql
-- Valid voices enum (matches Azure Neural voices in backend)
CREATE TYPE voice_option AS ENUM (
  'female1', 'female2', 'female3', 'female4',
  'male1', 'male2', 'male3'
);

CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_voice voice_option DEFAULT 'female1',
  playback_speed DECIMAL DEFAULT 1.0 CHECK (playback_speed >= 0.5 AND playback_speed <= 1.5),
  show_accent_numbers BOOLEAN DEFAULT true,
  show_part_of_speech BOOLEAN DEFAULT false,
  show_confidence BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = id);
```

#### Table: public.analysis_history

```sql
CREATE TABLE public.analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_history_user_created
  ON public.analysis_history(user_id, created_at DESC);

-- RLS Policy
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON public.analysis_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.analysis_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.analysis_history FOR DELETE
  USING (auth.uid() = user_id);
```

#### Table: public.comparison_scores

```sql
CREATE TABLE public.comparison_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  score DECIMAL NOT NULL CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comparison_scores_user_created
  ON public.comparison_scores(user_id, created_at DESC);

-- RLS Policy
ALTER TABLE public.comparison_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scores"
  ON public.comparison_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
  ON public.comparison_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scores"
  ON public.comparison_scores FOR DELETE
  USING (auth.uid() = user_id);
```

**Note**: Both tables use `ON DELETE CASCADE` on `user_id` FK, so deleting the auth user automatically removes all history.

#### Table: public.user_achievements

```sql
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,  -- 'first_analysis', '10_analyses', '100_analyses', etc.
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX idx_user_achievements_user
  ON public.user_achievements(user_id);

-- RLS Policy
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### Table: public.user_stats_snapshot

```sql
-- Preserves aggregate stats before data retention cleanup
CREATE TABLE public.user_stats_snapshot (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_analyses_archived INTEGER DEFAULT 0,
  total_comparisons_archived INTEGER DEFAULT 0,
  sum_scores_archived DECIMAL DEFAULT 0,  -- For recalculating average
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE public.user_stats_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats snapshot"
  ON public.user_stats_snapshot FOR SELECT
  USING (auth.uid() = id);
```

**Note**: When cleanup job removes old records, it first adds their counts to `user_stats_snapshot` so lifetime totals remain accurate.

### 4.3 API Endpoints

#### Backend (FastAPI)

| Method | Endpoint | Auth | Supabase Client | Description |
|--------|----------|------|-----------------|-------------|
| GET | /api/profile | JWT | anon + RLS | Get user profile |
| PATCH | /api/profile | JWT | anon + RLS | Update display name |
| GET | /api/preferences | JWT | anon + RLS | Get user preferences |
| PATCH | /api/preferences | JWT | anon + RLS | Update preferences |
| GET | /api/history | JWT | anon + RLS | Get paginated history (`?type=analysis&limit=20&cursor=...`) |
| GET | /api/history/stats | JWT | anon + RLS | Get aggregate statistics (includes retention limit info) |
| POST | /api/history/export | JWT | anon + RLS | Generate data export |
| DELETE | /api/history | JWT | anon + RLS | Clear all history |
| GET | /api/achievements | JWT | anon + RLS | Get user's earned achievements |
| POST | /api/achievements/check | JWT | anon + RLS | Check & grant new achievements (called after actions) |
| DELETE | /api/account | JWT | **service role** | Delete account (requires admin API) |

### 4.4 Row Level Security

**Requirement**: All queries must pass user's access_token to Supabase for RLS to apply.

**Implementation (supabase-py v2)**:
```python
# Backend: Create authenticated Supabase client per request
from supabase import create_client, Client

def get_authenticated_supabase(access_token: str) -> Client:
    """
    Create a Supabase client with the user's JWT for RLS.
    The token is passed via Authorization header to PostgREST.
    """
    client = create_client(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        options={
            "headers": {
                "Authorization": f"Bearer {access_token}"
            }
        }
    )
    return client
```

**Alternative (per-request header)**:
```python
# If reusing client, set auth per query
client.postgrest.auth(access_token)
response = client.table("analyses").select("*").execute()
```

**Important**: Do NOT use `client.auth.set_session()` for RLS - it manages client-side session state but doesn't set the PostgREST Authorization header needed for RLS policies.

### 4.5 Performance Optimizations

#### 4.5.1 Middleware Static Asset Exclusion

The auth middleware should skip validation for static assets to avoid unnecessary latency:

```typescript
// middleware.ts
export const config = {
  matcher: [
    // Only match dashboard routes, exclude static files
    '/(dashboard|history|progress|settings)/:path*',
    // Exclude: _next, static, images, favicon, manifest
  ],
};

// Or explicit check
if (pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(ico|png|jpg|svg|webp|woff2?)$/)) {
  return NextResponse.next();
}
```

#### 4.5.2 Dashboard Statistics Optimization

For users with large history (1000+ records), real-time `COUNT`/`AVG` queries can be slow.

**Recommended: PostgreSQL RPC Function** (single round-trip, uses actual tables)

```sql
-- RPC Function using auth.uid() - no user_id parameter to prevent IDOR
-- Includes archived stats from user_stats_snapshot for accurate lifetime totals
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY INVOKER  -- Uses caller's permissions, RLS applies
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_analyses', (
      SELECT COUNT(*) FROM public.analysis_history WHERE user_id = auth.uid()
    ) + COALESCE((
      SELECT total_analyses_archived FROM public.user_stats_snapshot WHERE id = auth.uid()
    ), 0),
    'total_comparisons', (
      SELECT COUNT(*) FROM public.comparison_scores WHERE user_id = auth.uid()
    ) + COALESCE((
      SELECT total_comparisons_archived FROM public.user_stats_snapshot WHERE id = auth.uid()
    ), 0),
    'avg_score', (
      -- Weighted average including archived scores
      SELECT ROUND(
        (COALESCE(SUM(score), 0) + COALESCE(s.sum_scores_archived, 0)) /
        NULLIF(COUNT(*) + COALESCE(s.total_comparisons_archived, 0), 0)
      ::numeric, 1)
      FROM public.comparison_scores c
      LEFT JOIN public.user_stats_snapshot s ON s.id = auth.uid()
      WHERE c.user_id = auth.uid()
    ),
    'unique_texts', (
      -- Note: archived unique texts not tracked (would require storing all texts)
      SELECT COUNT(DISTINCT text) FROM (
        SELECT text FROM public.analysis_history WHERE user_id = auth.uid()
        UNION
        SELECT text FROM public.comparison_scores WHERE user_id = auth.uid()
      ) t
    ),
    'current_record_count', (
      -- For retention limit warnings
      SELECT (
        SELECT COUNT(*) FROM public.analysis_history WHERE user_id = auth.uid()
      ) + (
        SELECT COUNT(*) FROM public.comparison_scores WHERE user_id = auth.uid()
      )
    )
  );
$$;
```

**Security Notes**:
- Uses `SECURITY INVOKER` (not DEFINER) so RLS policies apply
- Uses `auth.uid()` directly - no user_id parameter to prevent IDOR attacks
- Explicit `search_path` prevents schema hijacking

**API Call**:
```python
# Single RPC call - no params needed, uses auth.uid() from JWT
result = client.rpc('get_user_stats').execute()
```

**Alternative: Materialized View** (for very large datasets, refresh on schedule)
```sql
CREATE MATERIALIZED VIEW user_stats AS
SELECT
  user_id,
  (SELECT COUNT(*) FROM analysis_history a WHERE a.user_id = u.id) as total_analyses,
  (SELECT COUNT(*) FROM comparison_scores c WHERE c.user_id = u.id) as total_comparisons,
  (SELECT AVG(score) FROM comparison_scores c WHERE c.user_id = u.id) as avg_score
FROM auth.users u;

-- Refresh periodically
REFRESH MATERIALIZED VIEW user_stats;
```

#### 4.5.3 Export Format Compatibility

Data export should be compatible with popular SRS tools:

**Anki-Compatible Format** (for `/api/history/export?format=anki`):
```json
{
  "notes": [
    {
      "front": "東京",
      "back": "とうきょう [0] - Heiban",
      "tags": ["mierutone", "heiban", "2025-01"]
    }
  ],
  "deck_name": "MieruTone Pitch Accent",
  "note_type": "Basic"
}
```

**Standard Formats**:
| Format | Use Case |
|--------|----------|
| `json` | Full data backup, programmatic access |
| `csv` | Spreadsheet analysis, custom imports |
| `anki` | Direct Anki deck import (.apkg generation future) |

---

## 5. UI/UX Specifications

### 5.1 Design System Compliance

- **Colors**: Riso palette (coral, cornflower, black, paper-white)
- **Typography**: font-display for headings, system font for body
- **Borders**: 2px solid, rounded-riso (4px radius)
- **Shadows**: shadow-riso for elevated elements
- **Spacing**: 4px base unit (Tailwind default)

### 5.2 Component Patterns

| Pattern | Usage |
|---------|-------|
| riso-card | Container for sections |
| riso-button-primary | Primary actions |
| riso-button-secondary | Secondary actions |
| Toast notifications | Success/error feedback |
| Confirmation modal | Destructive actions |

### 5.3 Responsive Breakpoints

| Breakpoint | Sidebar | Layout |
|------------|---------|--------|
| < 1024px (lg) | Hidden (drawer) | Full width |
| >= 1024px | Fixed 256px | Content offset |

---

## 6. Implementation Plan

### Phase 1: Foundation (P0)

| Task | Priority | Estimate | Status |
|------|----------|----------|--------|
| Route protection middleware | P0 | 2h | Done |
| Sidebar component | P0 | 3h | Done |
| Dashboard layout with auth | P0 | 2h | Done |
| Mobile drawer navigation | P0 | 2h | Done |

### Phase 2: Core Features (P1)

| Task | Priority | Estimate | Status |
|------|----------|----------|--------|
| Dashboard statistics cards | P1 | 3h | Pending |
| Recent activity section | P1 | 2h | Pending |
| Connect to /api/history/stats | P1 | 2h | Pending |
| Settings: Account section | P1 | 3h | Pending |

### Phase 3: Preferences (P2)

| Task | Priority | Estimate | Status |
|------|----------|----------|--------|
| Settings: TTS preferences | P2 | 3h | Pending |
| Settings: Display preferences | P2 | 2h | Pending |
| Preferences persistence | P2 | 2h | Pending |
| Data export functionality | P2 | 4h | Pending |

### Phase 4: Polish (P3)

| Task | Priority | Estimate | Status |
|------|----------|----------|--------|
| History page with pagination | P3 | 4h | Pending |
| History filters & search | P3 | 4h | Pending |
| Progress visualization | P3 | 6h | Pending |
| Account deletion flow | P3 | 3h | Pending |

---

## 7. Resolved Questions

| # | Question | Decision |
|---|----------|----------|
| 1 | What's the data retention policy for history? | **Free**: 12 months OR 10k records (whichever first). **Pro**: Indefinite. Always preserve aggregate stats. Warn user near limit + offer export. |
| 2 | Should we add email notifications for milestones? | **Not in MVP**. Phase 2: opt-in only, max 1/week, key events (7-day streak, 100 analyses). MVP uses in-app toasts/badges. |
| 3 | Should preferences support offline caching? | **No**. Server-only to avoid sync conflicts. Show warning on unstable connection, block changes until reconnect. |

---

## 8. Appendix

### A. Wireframes

```
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD LAYOUT                                            │
├────────────┬────────────────────────────────────────────────┤
│            │                                                 │
│  SIDEBAR   │  MAIN CONTENT                                  │
│            │                                                 │
│  ┌──────┐  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐│
│  │Logo  │  │  │Analyses │ │Practice │ │Avg Score│ │Words  ││
│  └──────┘  │  │   42    │ │   18    │ │  78%    │ │  156  ││
│            │  └─────────┘ └─────────┘ └─────────┘ └───────┘│
│  Overview  │                                                 │
│  History   │  ┌─────────────────────────────────────────────┤
│  Progress  │  │ Recent Activity                             │
│  Settings  │  │                                             │
│            │  │ • こんにちは - 2 min ago                     │
│  ────────  │  │ • 東京 - Score: 85% - 1 hour ago            │
│            │  │ • ありがとう - 3 hours ago                   │
│  Practice  │  │                                             │
│            │  │ [View All History →]                        │
│  ────────  │  └─────────────────────────────────────────────┤
│            │                                                 │
│  [Avatar]  │  ┌─────────────────────────────────────────────┤
│  Name      │  │ Quick Actions                               │
│  Sign Out  │  │ [Start Practicing]  [View Progress]         │
│            │  └─────────────────────────────────────────────┘
└────────────┴────────────────────────────────────────────────┘
```

### B. Related Documents

- [SITE_ARCHITECTURE.md](./SITE_ARCHITECTURE.md) - Overall site structure
- [CLAUDE.md](../CLAUDE.md) - Technical implementation guide
