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
| EC-02 | User's session expires mid-session | Show re-auth modal, preserve current state |
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

| Stat | Source | Display |
|------|--------|---------|
| Total Analyses | COUNT(analyses) | Number |
| Total Practice Sessions | COUNT(comparison_scores) | Number |
| Average Score | AVG(comparison_scores.score) | Percentage |
| Words Practiced | COUNT(DISTINCT text) | Number |

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

---

### 3.3 History Page (/history)

#### FR-3.3.1 History List

**Requirements**:
- Two tabs: "Analyses" and "Practice Scores"
- Paginated list (20 items per page)
- Each item shows: text, timestamp, word count (analyses) or score (practice)
- Click to expand/view details

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

**Display Preferences**:

| Setting | Type | Description | Default |
|---------|------|-------------|---------|
| Show Accent Numbers | Toggle | Display numerical accent notation | On |
| Show Part of Speech | Toggle | Display word class (noun, verb, etc.) | Off |
| Show Confidence | Toggle | Display confidence indicators | On |

**Storage**: Preferences stored in localStorage + synced to public.user_preferences table.

#### FR-3.4.3 Data & Privacy Section

**Export Data**:
- Button: "Export My Data"
- Formats: JSON (default), CSV
- Contents: All analyses, all scores, profile data
- Delivery: Immediate download

**Danger Zone**:

| Action | Confirmation | Effect |
|--------|--------------|--------|
| Clear History | Double confirm modal | Delete all analyses & scores |
| Delete Account | Type "DELETE" to confirm | Remove all data, sign out, delete auth user |

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

**Edge Cases**:
- Handle expired tokens gracefully
- Support token refresh without full redirect

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
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_voice TEXT DEFAULT 'female1',
  playback_speed DECIMAL DEFAULT 1.0,
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

### 4.3 API Endpoints

#### Backend (FastAPI)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/profile | Yes | Get user profile |
| PATCH | /api/profile | Yes | Update display name |
| GET | /api/preferences | Yes | Get user preferences |
| PATCH | /api/preferences | Yes | Update preferences |
| GET | /api/history | Yes | Get paginated history |
| GET | /api/history/stats | Yes | Get aggregate statistics |
| POST | /api/history/export | Yes | Generate data export |
| DELETE | /api/history | Yes | Clear all history |
| DELETE | /api/account | Yes | Delete account |

### 4.4 Row Level Security

**Requirement**: All queries must pass user's access_token to Supabase client.

**Implementation**:
```python
# Backend: Create authenticated Supabase client per request
from supabase import create_client

def get_supabase_client(access_token: str):
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.auth.set_session(access_token)
    return client
```

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

## 7. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Should preferences sync across devices or be local-only? | Product | Pending |
| 2 | What's the data retention policy for history? | Product | Pending |
| 3 | Should we add email notifications for milestones? | Product | Pending |

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
