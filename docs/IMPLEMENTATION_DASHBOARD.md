# Implementation Plan: Dashboard & User Workspace

**Source PRD**: [PRD_DASHBOARD.md](./PRD_DASHBOARD.md)
**Last Updated**: 2025-12-31

---

## Overview

Este documento transforma o PRD em tasks acionáveis organizadas por dependência.

```
ORDEM DE EXECUÇÃO:
1. Database (Supabase) ─────► 2. Backend (FastAPI) ─────► 3. Frontend (Next.js)
                                      │
                                      ▼
                              4. Integração & Testes
```

---

## Sprint 1: Database & Backend Foundation

### 1.1 Database Schema (Supabase Dashboard ou Migration)

**Onde**: Supabase SQL Editor ou `supabase/migrations/`

#### Task DB-1: Criar tabela `profiles`
```sql
-- supabase/migrations/001_create_profiles.sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger para criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
**Acceptance**: Profile criado automaticamente ao fazer signup

---

#### Task DB-2: Criar ENUM e tabela `user_preferences`
```sql
-- supabase/migrations/002_create_preferences.sql
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

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger para criar preferences default no signup
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();
```
**Acceptance**: Preferences com defaults criadas automaticamente

---

#### Task DB-3: Criar tabela `analysis_history`
```sql
-- supabase/migrations/003_create_analysis_history.sql
CREATE TABLE public.analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_history_user_created
  ON public.analysis_history(user_id, created_at DESC);

ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON public.analysis_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.analysis_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.analysis_history FOR DELETE USING (auth.uid() = user_id);
```

---

#### Task DB-4: Criar tabela `comparison_scores`
```sql
-- supabase/migrations/004_create_comparison_scores.sql
CREATE TABLE public.comparison_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  score DECIMAL NOT NULL CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comparison_scores_user_created
  ON public.comparison_scores(user_id, created_at DESC);

ALTER TABLE public.comparison_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scores"
  ON public.comparison_scores FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
  ON public.comparison_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scores"
  ON public.comparison_scores FOR DELETE USING (auth.uid() = user_id);
```

---

#### Task DB-5: Criar tabela `user_achievements`
```sql
-- supabase/migrations/005_create_achievements.sql
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX idx_user_achievements_user
  ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

#### Task DB-6: Criar tabela `user_stats_snapshot` (para retenção)
```sql
-- supabase/migrations/006_create_stats_snapshot.sql
CREATE TABLE public.user_stats_snapshot (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_analyses_archived INTEGER DEFAULT 0,
  total_comparisons_archived INTEGER DEFAULT 0,
  sum_scores_archived DECIMAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_stats_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats snapshot"
  ON public.user_stats_snapshot FOR SELECT USING (auth.uid() = id);
```

---

#### Task DB-7: Criar RPC `get_user_stats()`
```sql
-- supabase/migrations/007_create_stats_rpc.sql
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY INVOKER
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
      SELECT ROUND(
        (
          (SELECT COALESCE(SUM(score)::numeric, 0) FROM public.comparison_scores WHERE user_id = auth.uid())
          + COALESCE((SELECT sum_scores_archived FROM public.user_stats_snapshot WHERE id = auth.uid()), 0)
        ) / NULLIF(
          (SELECT COUNT(*)::numeric FROM public.comparison_scores WHERE user_id = auth.uid())
          + COALESCE((SELECT total_comparisons_archived FROM public.user_stats_snapshot WHERE id = auth.uid()), 0)
        , 0),
        1
      )
    ),
    'unique_texts', (
      SELECT COUNT(DISTINCT text) FROM (
        SELECT text FROM public.analysis_history WHERE user_id = auth.uid()
        UNION
        SELECT text FROM public.comparison_scores WHERE user_id = auth.uid()
      ) t
    ),
    'current_record_count', (
      SELECT (
        SELECT COUNT(*) FROM public.analysis_history WHERE user_id = auth.uid()
      ) + (
        SELECT COUNT(*) FROM public.comparison_scores WHERE user_id = auth.uid()
      )
    )
  );
$$;
```

---

### 1.2 Backend API (FastAPI)

**Onde**: `backend/app/routers/`

#### Task BE-1: Criar `routers/user.py` - Profile endpoints
```python
# backend/app/routers/user.py
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.auth import require_auth, TokenData
from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/user", tags=["user"])  # main.py adds /api prefix

class ProfileResponse(BaseModel):
    id: str
    display_name: str | None
    avatar_url: str | None
    email: str

class ProfileUpdate(BaseModel):
    display_name: str

@router.get("/profile")
async def get_profile(user: TokenData = Depends(require_auth)):
    supabase = get_supabase_client(user.access_token)
    result = supabase.table("profiles").select("*").eq("id", user.user_id).single().execute()
    return {**result.data, "email": user.email}

@router.patch("/profile")
async def update_profile(data: ProfileUpdate, user: TokenData = Depends(require_auth)):
    supabase = get_supabase_client(user.access_token)
    supabase.table("profiles").update({
        "display_name": data.display_name,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", user.user_id).execute()
    return {"success": True}
```
**Arquivo**: `backend/app/routers/user.py`
**Registrar em**: `backend/app/main.py` como `app.include_router(user.router, prefix=settings.api_prefix)`

---

#### Task BE-2: Criar endpoints de Preferences
```python
# Adicionar a routers/user.py
from datetime import datetime, timezone

class PreferencesResponse(BaseModel):
    default_voice: str
    playback_speed: float
    show_accent_numbers: bool
    show_part_of_speech: bool
    show_confidence: bool

class PreferencesUpdate(BaseModel):
    default_voice: str | None = None
    playback_speed: float | None = None
    show_accent_numbers: bool | None = None
    show_part_of_speech: bool | None = None
    show_confidence: bool | None = None

VALID_VOICES = ['female1', 'female2', 'female3', 'female4', 'male1', 'male2', 'male3']

@router.get("/preferences")
async def get_preferences(user: TokenData = Depends(require_auth)):
    supabase = get_supabase_client(user.access_token)
    result = supabase.table("user_preferences").select("*").eq("id", user.user_id).single().execute()
    return result.data

@router.patch("/preferences")
async def update_preferences(data: PreferencesUpdate, user: TokenData = Depends(require_auth)):
    supabase = get_supabase_client(user.access_token)
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if "default_voice" in update_data and update_data["default_voice"] not in VALID_VOICES:
        raise HTTPException(400, "Invalid voice option")

    if "playback_speed" in update_data:
        if not (0.5 <= update_data["playback_speed"] <= 1.5):
            raise HTTPException(400, "Playback speed must be between 0.5 and 1.5")

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    supabase.table("user_preferences").update(update_data).eq("id", user.user_id).execute()
    return {"success": True}
```

---

#### Task BE-3: Atualizar `routers/history.py` - Adicionar paginação cursor-based

**Nota**: O arquivo `routers/history.py` já existe. Adicionar/modificar os seguintes endpoints:

```python
# backend/app/routers/history.py - MODIFICAR arquivo existente
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Literal
import base64
import json

from app.core.auth import require_auth, TokenData
from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/history", tags=["history"])  # main.py adds /api

@router.get("/paginated")
async def get_history_paginated(
    type: Literal["analysis", "comparison"],
    limit: int = Query(20, le=100),
    cursor: str | None = None,
    direction: Literal["next", "prev"] = "next",
    user: TokenData = Depends(require_auth),
):
    """Get paginated history with cursor-based pagination."""
    supabase = get_supabase_client(user.access_token)
    table = "analysis_history" if type == "analysis" else "comparison_scores"

    # Build base query - RLS handles user filtering
    query = supabase.table(table).select("*")

    if cursor:
        try:
            decoded = json.loads(base64.b64decode(cursor))
            cursor_ts = decoded["created_at"]
            cursor_id = decoded["id"]
        except Exception as e:
            # Catches: base64.binascii.Error, json.JSONDecodeError, KeyError, TypeError
            raise HTTPException(400, f"Invalid cursor: {e}")

        if direction == "next":
            # Items older than cursor: (created_at < cursor_ts) OR (created_at = cursor_ts AND id < cursor_id)
            query = query.or_(
                f"created_at.lt.{cursor_ts},"
                f"and(created_at.eq.{cursor_ts},id.lt.{cursor_id})"
            )
        else:
            # Items newer than cursor
            query = query.or_(
                f"created_at.gt.{cursor_ts},"
                f"and(created_at.eq.{cursor_ts},id.gt.{cursor_id})"
            )

    # Order by (created_at, id) to ensure stable pagination
    desc = direction == "next"
    query = query.order("created_at", desc=desc).order("id", desc=desc).limit(limit + 1)
    result = query.execute()

    items = result.data[:limit]
    has_more = len(result.data) > limit

    next_cursor = None
    if has_more and items:
        last = items[-1]
        next_cursor = base64.b64encode(json.dumps({
            "created_at": last["created_at"],
            "id": last["id"]
        }).encode()).decode()

    return {
        "items": items,
        "next_cursor": next_cursor,
        "has_more": has_more
    }

@router.get("/stats")
async def get_stats(user: TokenData = Depends(require_auth)):
    """Get user statistics via RPC function."""
    supabase = get_supabase_client(user.access_token)
    result = supabase.rpc("get_user_stats").execute()
    return result.data

@router.delete("")
async def clear_history(user: TokenData = Depends(require_auth)):
    """Clear all user history."""
    supabase = get_supabase_client(user.access_token)
    # RLS ensures only user's own records are deleted
    supabase.table("analysis_history").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("comparison_scores").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    return {"success": True}
```

**Nota sobre DELETE**: Supabase requer um filtro para DELETE. Usamos `.neq("id", "nil-uuid")` como workaround para deletar todos os registros do usuário (RLS garante escopo).

---

#### Task BE-4: Adicionar save automático ao `/api/analyze`
```python
# Modificar backend/app/routers/analyze.py
from fastapi import Depends
from app.core.auth import get_current_user, TokenData
from app.core.supabase import get_supabase_client

# Modificar a assinatura do endpoint para incluir user opcional:
@router.post("/analyze")
async def analyze_text(
    request: AnalyzeRequest,
    user: TokenData | None = Depends(get_current_user),  # None se não autenticado
):
    # ... código existente de análise ...

    # Ao final, se usuário autenticado, salvar no histórico
    if user:
        try:
            supabase = get_supabase_client(user.access_token)
            supabase.table("analysis_history").insert({
                "user_id": user.user_id,
                "text": request.text,
                "word_count": len(result.words)
            }).execute()
        except Exception:
            pass  # Não falhar análise se histórico falhar

    return result
```
**Nota**: `get_current_user` já retorna `None` se não há token (auto_error=False no HTTPBearer).

---

#### Task BE-5: Adicionar save automático ao `/api/compare`
```python
# Modificar backend/app/routers/compare.py
from fastapi import Depends
from app.core.auth import get_current_user, TokenData
from app.core.supabase import get_supabase_client

# Modificar a assinatura do endpoint para incluir user opcional:
@router.post("/compare/upload")
async def compare_upload(
    text: str = Form(...),
    user_audio: UploadFile = File(...),
    user: TokenData | None = Depends(get_current_user),
):
    # ... código existente de comparação ...

    # Ao final, se usuário autenticado, salvar score
    if user:
        try:
            supabase = get_supabase_client(user.access_token)
            supabase.table("comparison_scores").insert({
                "user_id": user.user_id,
                "text": text,
                "score": result.score
            }).execute()
        except Exception:
            pass  # Não falhar comparação se histórico falhar

    return result
```
**Nota**: Achievement check é feito pelo frontend após receber resposta (Task FE-11).

---

#### Task BE-6: Criar `routers/achievements.py`
```python
# backend/app/routers/achievements.py
from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import require_auth, TokenData
from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/achievements", tags=["achievements"])  # main.py adds /api

@router.get("")
async def get_achievements(user: TokenData = Depends(require_auth)):
    supabase = get_supabase_client(user.access_token)
    result = supabase.table("user_achievements").select("*").execute()  # RLS filters
    return {"achievements": result.data}

@router.post("/check")
async def check_achievements(user: TokenData = Depends(require_auth)):
    supabase = get_supabase_client(user.access_token)

    # Get current stats via RPC
    try:
        stats_result = supabase.rpc("get_user_stats").execute()
        if not stats_result.data:
            raise HTTPException(500, "Failed to fetch user stats")
        stats = stats_result.data
    except Exception as e:
        raise HTTPException(500, f"Stats RPC failed: {e}")

    # Get existing achievements (RLS filters by user)
    existing = supabase.table("user_achievements").select("achievement_type").execute()
    existing_types = {a["achievement_type"] for a in existing.data}

    # Check for new achievements
    new_achievements = []

    if stats["total_analyses"] >= 1 and "first_analysis" not in existing_types:
        new_achievements.append("first_analysis")
    if stats["total_analyses"] >= 10 and "10_analyses" not in existing_types:
        new_achievements.append("10_analyses")
    if stats["total_analyses"] >= 100 and "100_analyses" not in existing_types:
        new_achievements.append("100_analyses")
    if stats["total_comparisons"] >= 1 and "first_comparison" not in existing_types:
        new_achievements.append("first_comparison")

    # Check max score achievement
    if "score_90" not in existing_types:
        max_score = supabase.table("comparison_scores").select("score").order("score", desc=True).limit(1).execute()
        if max_score.data and max_score.data[0]["score"] >= 90:
            new_achievements.append("score_90")

    # Insert new achievements
    for achievement in new_achievements:
        supabase.table("user_achievements").insert({
            "user_id": user.user_id,
            "achievement_type": achievement
        }).execute()

    return {"new_achievements": new_achievements}
```
**Registrar em**: `backend/app/main.py` como `app.include_router(achievements.router, prefix=settings.api_prefix)`

---

#### Task BE-7: Criar endpoint DELETE `/api/user/account`
```python
# Adicionar a routers/user.py
from supabase import create_client
from app.core.config import settings

@router.delete("/account")
async def delete_account(user: TokenData = Depends(require_auth)):
    """Delete user account and all associated data."""
    # Usar service role client para deletar usuário (admin operation)
    admin_client = create_client(
        settings.supabase_url,
        settings.supabase_service_role_key  # Adicionar ao .env e config.py
    )

    # CASCADE nas FKs cuida das outras tabelas automaticamente
    admin_client.auth.admin.delete_user(user.user_id)

    return {"success": True}
```
**Requisitos**:
1. Adicionar `SUPABASE_SERVICE_ROLE_KEY` ao `.env`
2. Adicionar em `core/config.py`:
```python
supabase_service_role_key: str = Field(default="", env="SUPABASE_SERVICE_ROLE_KEY")
```

**Nota**: `get_supabase_client` já existe em `app/core/supabase.py` - não precisa criar nova dependency.

---

#### Task BE-8: Criar endpoint de Export
```python
# Adicionar a routers/history.py
from datetime import datetime, timezone
from fastapi.responses import StreamingResponse
import csv
import io

@router.post("/export")
async def export_data(
    format: Literal["json", "csv"] = "json",
    user: TokenData = Depends(require_auth),
):
    supabase = get_supabase_client(user.access_token)

    # RLS filtra automaticamente por usuário
    analyses = supabase.table("analysis_history").select("*").limit(10000).execute()
    scores = supabase.table("comparison_scores").select("*").limit(10000).execute()
    profile = supabase.table("profiles").select("*").eq("id", user.user_id).single().execute()

    data = {
        "profile": profile.data,
        "analyses": analyses.data,
        "comparison_scores": scores.data,
        "exported_at": datetime.now(timezone.utc).isoformat()
    }

    if format == "json":
        return data

    # CSV format - unified table with type column (Excel/BI compatible)
    output = io.StringIO()

    # Combine analyses and scores into unified format
    rows = []
    for a in analyses.data:
        rows.append({
            "type": "analysis",
            "id": a["id"],
            "text": a["text"],
            "value": a["word_count"],  # word_count for analyses
            "created_at": a["created_at"]
        })
    for s in scores.data:
        rows.append({
            "type": "comparison",
            "id": s["id"],
            "text": s["text"],
            "value": s["score"],  # score for comparisons
            "created_at": s["created_at"]
        })

    # Sort by date descending
    rows.sort(key=lambda x: x["created_at"], reverse=True)

    writer = csv.DictWriter(output, fieldnames=["type", "id", "text", "value", "created_at"])
    writer.writeheader()
    writer.writerows(rows)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mierutone_export.csv"}
    )
```

---

## Sprint 2: Frontend Implementation

### 2.0 Dependências Adicionais

**Instalar antes de começar**:
```bash
cd frontend
npm install date-fns sonner
```

| Pacote | Uso |
|--------|-----|
| `date-fns` | Formatação de timestamps (formatDistanceToNow) |
| `sonner` | Toast notifications (alternativa leve ao react-hot-toast) |

---

### 2.1 API Client Updates

#### Task FE-1: Adicionar funções ao `lib/api.ts`
```typescript
// frontend/src/lib/api.ts - Adicionar:

// Profile (rota: /api/user/profile)
export async function getProfile(): Promise<ProfileResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/user/profile`, { headers });
  if (!response.ok) throw new Error(`Failed to get profile: ${response.status}`);
  return response.json();
}

export async function updateProfile(displayName: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/user/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ display_name: displayName }),
  });
  if (!response.ok) throw new Error(`Failed to update profile: ${response.status}`);
}

// Preferences (rota: /api/user/preferences)
export async function getPreferences(): Promise<PreferencesResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/user/preferences`, { headers });
  if (!response.ok) throw new Error(`Failed to get preferences: ${response.status}`);
  return response.json();
}

export async function updatePreferences(prefs: Partial<PreferencesResponse>): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/user/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(prefs),
  });
  if (!response.ok) throw new Error(`Failed to update preferences: ${response.status}`);
}

// History (rota: /api/history/paginated)
export interface PaginatedHistoryParams {
  type: "analysis" | "comparison";
  limit?: number;
  cursor?: string;
  direction?: "next" | "prev";
}

export interface PaginatedHistoryResponse {
  items: Array<{
    id: string;
    text: string;
    created_at: string;
    word_count?: number;
    score?: number;
  }>;
  next_cursor: string | null;
  has_more: boolean;
}

export async function getHistory(params: PaginatedHistoryParams): Promise<PaginatedHistoryResponse> {
  const headers = await getAuthHeaders();
  const searchParams = new URLSearchParams({
    type: params.type,
    limit: String(params.limit || 20),
    direction: params.direction || "next",
  });
  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  const response = await fetch(`${API_URL}/history/paginated?${searchParams}`, { headers });
  if (!response.ok) throw new Error(`Failed to get history: ${response.status}`);
  return response.json();
}

// Dashboard Stats (rota: /api/history/stats)
export async function getDashboardStats(): Promise<StatsResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/history/stats`, { headers });
  if (!response.ok) throw new Error(`Failed to get stats: ${response.status}`);
  return response.json();
}

// Achievements (rota: /api/achievements)
export async function getAchievements(): Promise<AchievementsResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/achievements`, { headers });
  if (!response.ok) throw new Error(`Failed to get achievements: ${response.status}`);
  return response.json();
}

export async function checkAchievements(): Promise<{ new_achievements: string[] }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/achievements/check`, {
    method: "POST",
    headers,
  });
  if (!response.ok) throw new Error(`Failed to check achievements: ${response.status}`);
  return response.json();
}

// Delete Account (rota: /api/user/account)
export async function deleteAccount(): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/user/account`, {
    method: "DELETE",
    headers,
  });
  if (!response.ok) throw new Error(`Failed to delete account: ${response.status}`);
}

// Clear History (rota: /api/history)
export async function clearHistory(): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/history`, {
    method: "DELETE",
    headers,
  });
  if (!response.ok) throw new Error(`Failed to clear history: ${response.status}`);
}

// Export Data (rota: /api/history/export)
export async function exportData(format: "json" | "csv" = "json"): Promise<Blob | object> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/history/export?format=${format}`, {
    method: "POST",
    headers,
  });
  if (!response.ok) throw new Error(`Failed to export data: ${response.status}`);

  if (format === "csv") {
    return response.blob();
  }
  return response.json();
}
```

---

#### Task FE-2: Adicionar types ao `types/`
```typescript
// frontend/src/types/user.ts
export interface ProfileResponse {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string;
}

export interface PreferencesResponse {
  default_voice: string;
  playback_speed: number;
  show_accent_numbers: boolean;
  show_part_of_speech: boolean;
  show_confidence: boolean;
}

export interface StatsResponse {
  total_analyses: number;
  total_comparisons: number;
  avg_score: number | null;
  unique_texts: number;
  current_record_count: number;
}

export interface Achievement {
  id: string;
  achievement_type: string;
  achieved_at: string;
}

export interface AchievementsResponse {
  achievements: Achievement[];
}
```

---

### 2.2 Dashboard Page

#### Task FE-3: Implementar `/dashboard/page.tsx`
```typescript
// frontend/src/app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getDashboardStats, getHistory, getAchievements } from "@/lib/api";
import { StatsResponse, Achievement } from "@/types/user";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AchievementBadges } from "@/components/dashboard/AchievementBadges";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<Array<{ id: string; text: string; created_at: string; word_count?: number }>>([]);
  const [recentScores, setRecentScores] = useState<Array<{ id: string; text: string; created_at: string; score?: number }>>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, analysesData, scoresData, achievementsData] = await Promise.all([
          getDashboardStats(),
          getHistory({ type: "analysis", limit: 5 }),
          getHistory({ type: "comparison", limit: 5 }),
          getAchievements(),
        ]);

        setStats(statsData);
        setRecentAnalyses(analysesData.items);
        setRecentScores(scoresData.items);
        setAchievements(achievementsData.achievements);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>

      <StatsCards stats={stats} />

      <div className="grid lg:grid-cols-2 gap-6">
        <RecentActivity analyses={recentAnalyses} scores={recentScores} />
        <AchievementBadges achievements={achievements} />
      </div>

      <QuickActions />
    </div>
  );
}
```

---

#### Task FE-4: Criar `components/dashboard/StatsCards.tsx`
```typescript
// frontend/src/components/dashboard/StatsCards.tsx
import { StatsResponse } from "@/types/user";

interface StatsCardsProps {
  stats: StatsResponse | null;
}

// Type-safe key mapping for StatsResponse properties
type StatKey = "total_analyses" | "total_comparisons" | "avg_score" | "unique_texts";

interface CardConfig {
  key: StatKey;
  label: string;
  icon: string;
  suffix?: string;
}

const cards: CardConfig[] = [
  { key: "total_analyses", label: "Total Analyses", icon: "📝" },
  { key: "total_comparisons", label: "Practice Sessions", icon: "🎤" },
  { key: "avg_score", label: "Average Score", icon: "📊", suffix: "%" },
  { key: "unique_texts", label: "Unique Texts", icon: "📚" },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const value = stats?.[card.key];
        return (
          <div key={card.key} className="riso-card p-4">
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold">
              {value ?? "-"}
              {card.suffix && value != null && card.suffix}
            </div>
            <div className="text-sm text-ink-black/60">{card.label}</div>
          </div>
        );
      })}
    </div>
  );
}
```

---

#### Task FE-5: Criar `components/dashboard/RecentActivity.tsx`
```typescript
// frontend/src/components/dashboard/RecentActivity.tsx
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function RecentActivity({ analyses, scores }) {
  const isEmpty = analyses.length === 0 && scores.length === 0;

  if (isEmpty) {
    return (
      <div className="riso-card p-6 text-center">
        <p className="text-ink-black/60 mb-4">No activity yet</p>
        <Link href="/app" className="riso-button-primary">
          Start Practicing
        </Link>
      </div>
    );
  }

  return (
    <div className="riso-card p-6">
      <h2 className="font-display font-bold mb-4">Recent Activity</h2>

      <div className="space-y-3">
        {analyses.slice(0, 3).map((item) => (
          <div key={item.id} className="flex justify-between items-center py-2 border-b border-ink-black/10">
            <span className="font-mono">{item.text}</span>
            <span className="text-xs text-ink-black/40">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </div>
        ))}

        {scores.slice(0, 2).map((item) => (
          <div key={item.id} className="flex justify-between items-center py-2 border-b border-ink-black/10">
            <span className="font-mono">{item.text}</span>
            <span className="px-2 py-1 bg-primary-100 rounded text-sm font-bold">
              {item.score}%
            </span>
          </div>
        ))}
      </div>

      <Link href="/history" className="block text-center mt-4 text-primary-500 hover:underline">
        View All History →
      </Link>
    </div>
  );
}
```

---

### 2.3 Settings Page

#### Task FE-6: Implementar `/settings/page.tsx`
```typescript
// frontend/src/app/(dashboard)/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getProfile, getPreferences, updateProfile, updatePreferences } from "@/lib/api";
import { ProfileResponse, PreferencesResponse } from "@/types/user";
import { AccountSection } from "@/components/settings/AccountSection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { ExportSection } from "@/components/settings/ExportSection";
import { DangerZone } from "@/components/settings/DangerZone";
import { SettingsSkeleton } from "@/components/ui/Skeleton";

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [preferences, setPreferences] = useState<PreferencesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, prefsData] = await Promise.all([
          getProfile(),
          getPreferences(),
        ]);
        setProfile(profileData);
        setPreferences(prefsData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <AccountSection
        profile={profile}
        onUpdate={(name) => updateProfile(name).then(() => setProfile({...profile, display_name: name}))}
      />

      <PreferencesSection
        preferences={preferences}
        onUpdate={(prefs) => updatePreferences(prefs).then(() => setPreferences({...preferences, ...prefs}))}
      />

      <ExportSection />

      <DangerZone />
    </div>
  );
}
```

---

#### Task FE-7: Criar `components/settings/PreferencesSection.tsx`
```typescript
// frontend/src/components/settings/PreferencesSection.tsx
"use client";

import { useState } from "react";
import { VALID_VOICES } from "@/lib/constants";

const VOICE_LABELS = {
  female1: "Female 1 (Nanami)",
  female2: "Female 2 (Aoi)",
  female3: "Female 3 (Shiori)",
  female4: "Female 4 (Mayu)",
  male1: "Male 1 (Keita)",
  male2: "Male 2 (Takumi)",
  male3: "Male 3 (Naoki)",
};

export function PreferencesSection({ preferences, onUpdate }) {
  const [saving, setSaving] = useState(false);

  const handleChange = async (key: string, value: any) => {
    setSaving(true);
    try {
      await onUpdate({ [key]: value });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="riso-card p-6">
      <h2 className="font-display font-bold mb-4">Preferences</h2>

      {/* Voice Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Default Voice</label>
        <select
          value={preferences.default_voice}
          onChange={(e) => handleChange("default_voice", e.target.value)}
          className="w-full p-2 border-2 border-ink-black/20 rounded"
          disabled={saving}
        >
          {VALID_VOICES.map((voice) => (
            <option key={voice} value={voice}>{VOICE_LABELS[voice]}</option>
          ))}
        </select>
      </div>

      {/* Playback Speed */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Playback Speed: {preferences.playback_speed}x
        </label>
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.1"
          value={preferences.playback_speed}
          onChange={(e) => handleChange("playback_speed", parseFloat(e.target.value))}
          className="w-full"
          disabled={saving}
        />
      </div>

      {/* Display Toggles */}
      <div className="space-y-3">
        <Toggle
          label="Show Accent Numbers"
          checked={preferences.show_accent_numbers}
          onChange={(v) => handleChange("show_accent_numbers", v)}
          disabled={saving}
        />
        <Toggle
          label="Show Part of Speech"
          checked={preferences.show_part_of_speech}
          onChange={(v) => handleChange("show_part_of_speech", v)}
          disabled={saving}
        />
        <Toggle
          label="Show Confidence Indicators"
          checked={preferences.show_confidence}
          onChange={(v) => handleChange("show_confidence", v)}
          disabled={saving}
        />
      </div>
    </div>
  );
}
```

---

### 2.4 History Page

#### Task FE-8: Implementar `/history/page.tsx`
```typescript
// frontend/src/app/(dashboard)/history/page.tsx
"use client";

import { useState } from "react";
import { HistoryTabs } from "@/components/history/HistoryTabs";
import { HistoryList } from "@/components/history/HistoryList";

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"analysis" | "comparison">("analysis");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">History</h1>

      <HistoryTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <HistoryList type={activeTab} />
    </div>
  );
}
```

---

#### Task FE-9: Criar `components/history/HistoryList.tsx` com paginação
```typescript
// frontend/src/components/history/HistoryList.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { getHistory } from "@/lib/api";
import { EmptyState } from "@/components/history/EmptyState";
import { HistoryItem } from "@/components/history/HistoryItem";

export function HistoryList({ type }: { type: "analysis" | "comparison" }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async (newCursor?: string) => {
    setLoading(true);
    try {
      const data = await getHistory({ type, limit: 20, cursor: newCursor });

      if (newCursor) {
        setItems(prev => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }

      setCursor(data.next_cursor);
      setHasMore(data.has_more);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    setItems([]);
    setCursor(null);
    loadItems();
  }, [type, loadItems]);

  if (!loading && items.length === 0) {
    return <EmptyState type={type} />;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <HistoryItem key={item.id} item={item} type={type} />
      ))}

      {hasMore && (
        <button
          onClick={() => loadItems(cursor)}
          disabled={loading}
          className="w-full py-3 text-center riso-button-secondary"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

---

### 2.5 Componentes Auxiliares

#### Task FE-10: Criar componentes de UI reutilizáveis

```typescript
// frontend/src/components/ui/Toggle.tsx
interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-primary-500" : "bg-ink-black/20"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
```

```typescript
// frontend/src/components/ui/Skeleton.tsx
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-ink-black/10 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="riso-card p-4 h-24 bg-ink-black/5" />
        ))}
      </div>
      <div className="riso-card p-6 h-64 bg-ink-black/5" />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-8 max-w-2xl animate-pulse">
      <div className="h-8 w-32 bg-ink-black/10 rounded" />
      <div className="riso-card p-6 h-48 bg-ink-black/5" />
      <div className="riso-card p-6 h-64 bg-ink-black/5" />
    </div>
  );
}
```

```typescript
// frontend/src/components/history/HistoryItem.tsx
import { formatDistanceToNow } from "date-fns";

interface HistoryItemProps {
  item: { id: string; text: string; created_at: string; word_count?: number; score?: number };
  type: "analysis" | "comparison";
}

export function HistoryItem({ item, type }: HistoryItemProps) {
  return (
    <div className="riso-card p-4 flex justify-between items-center">
      <div>
        <p className="font-mono text-lg">{item.text}</p>
        <p className="text-xs text-ink-black/40">
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </p>
      </div>
      {type === "analysis" ? (
        <span className="text-sm text-ink-black/60">{item.word_count} words</span>
      ) : (
        <span className="px-3 py-1 bg-primary-100 rounded-full font-bold">{item.score}%</span>
      )}
    </div>
  );
}
```

```typescript
// frontend/src/components/history/EmptyState.tsx
import Link from "next/link";

interface EmptyStateProps {
  type: "analysis" | "comparison";
}

export function EmptyState({ type }: EmptyStateProps) {
  const message = type === "analysis"
    ? "No analyses yet. Start practicing to build your history!"
    : "No practice scores yet. Record your pronunciation to get feedback!";

  return (
    <div className="riso-card p-8 text-center">
      <div className="text-4xl mb-4">{type === "analysis" ? "📝" : "🎤"}</div>
      <p className="text-ink-black/60 mb-6">{message}</p>
      <Link href="/app" className="riso-button-primary">
        Start Practicing
      </Link>
    </div>
  );
}
```

```typescript
// frontend/src/components/history/HistoryTabs.tsx
interface HistoryTabsProps {
  activeTab: "analysis" | "comparison";
  onTabChange: (tab: "analysis" | "comparison") => void;
}

export function HistoryTabs({ activeTab, onTabChange }: HistoryTabsProps) {
  return (
    <div className="flex gap-2 border-b-2 border-ink-black/10">
      <button
        onClick={() => onTabChange("analysis")}
        className={`px-4 py-2 font-medium transition-colors ${
          activeTab === "analysis"
            ? "border-b-2 border-primary-500 text-primary-500"
            : "text-ink-black/60 hover:text-ink-black"
        }`}
      >
        Analyses
      </button>
      <button
        onClick={() => onTabChange("comparison")}
        className={`px-4 py-2 font-medium transition-colors ${
          activeTab === "comparison"
            ? "border-b-2 border-primary-500 text-primary-500"
            : "text-ink-black/60 hover:text-ink-black"
        }`}
      >
        Practice Scores
      </button>
    </div>
  );
}
```

```typescript
// frontend/src/components/dashboard/AchievementBadges.tsx
import { Achievement } from "@/types/user";

const BADGE_CONFIG: Record<string, { icon: string; label: string }> = {
  first_analysis: { icon: "🎯", label: "First Analysis" },
  "10_analyses": { icon: "📚", label: "10 Analyses" },
  "100_analyses": { icon: "🌟", label: "100 Analyses" },
  first_comparison: { icon: "🎤", label: "First Recording" },
  score_90: { icon: "🏆", label: "90%+ Score" },
};

interface AchievementBadgesProps {
  achievements: Achievement[];
}

export function AchievementBadges({ achievements }: AchievementBadgesProps) {
  if (achievements.length === 0) {
    return (
      <div className="riso-card p-6 text-center">
        <p className="text-ink-black/60">No badges earned yet. Start practicing!</p>
      </div>
    );
  }

  return (
    <div className="riso-card p-6">
      <h2 className="font-display font-bold mb-4">Badges Earned</h2>
      <div className="flex flex-wrap gap-3">
        {achievements.map((a) => {
          const config = BADGE_CONFIG[a.achievement_type];
          if (!config) return null;
          return (
            <div
              key={a.id}
              className="flex items-center gap-2 px-3 py-2 bg-primary-100 rounded-full"
              title={`Earned ${new Date(a.achieved_at).toLocaleDateString()}`}
            >
              <span className="text-xl">{config.icon}</span>
              <span className="text-sm font-medium">{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

```typescript
// frontend/src/components/dashboard/QuickActions.tsx
import Link from "next/link";

export function QuickActions() {
  return (
    <div className="riso-card p-6">
      <h2 className="font-display font-bold mb-4">Quick Actions</h2>
      <div className="flex flex-wrap gap-4">
        <Link href="/app" className="riso-button-primary">
          Start Practicing
        </Link>
        <Link href="/history" className="riso-button-secondary">
          View History
        </Link>
      </div>
    </div>
  );
}
```

```typescript
// frontend/src/components/settings/AccountSection.tsx
"use client";

import { useState } from "react";
import { ProfileResponse } from "@/types/user";

interface AccountSectionProps {
  profile: ProfileResponse | null;
  onUpdate: (displayName: string) => Promise<void>;
}

export function AccountSection({ profile, onUpdate }: AccountSectionProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim() || displayName === profile?.display_name) return;
    setSaving(true);
    try {
      await onUpdate(displayName.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="riso-card p-6">
      <h2 className="font-display font-bold mb-4">Account</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary-300 flex items-center justify-center">
          <span className="text-2xl font-bold">
            {profile?.display_name?.[0] || profile?.email?.[0] || "U"}
          </span>
        </div>
        <div>
          <p className="font-medium">{profile?.email}</p>
          <p className="text-xs text-ink-black/40">Google Account</p>
        </div>
      </div>

      {/* Display Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="w-full p-2 border-2 border-ink-black/20 rounded"
          disabled={saving}
          placeholder="Your name"
        />
      </div>
    </div>
  );
}
```

```typescript
// frontend/src/components/settings/ExportSection.tsx
"use client";

import { useState } from "react";
import { exportData } from "@/lib/api";

export function ExportSection() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: "json" | "csv") => {
    setExporting(true);
    try {
      const data = await exportData(format);

      if (format === "csv") {
        // Download CSV file
        const blob = data as Blob;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mierutone_export.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Download JSON file
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mierutone_export.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="riso-card p-6">
      <h2 className="font-display font-bold mb-4">Export Data</h2>
      <p className="text-sm text-ink-black/60 mb-4">
        Download all your analyses and practice scores.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => handleExport("json")}
          disabled={exporting}
          className="px-4 py-2 border-2 border-ink-black/20 rounded hover:bg-ink-black/5 transition-colors disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export JSON"}
        </button>
        <button
          onClick={() => handleExport("csv")}
          disabled={exporting}
          className="px-4 py-2 border-2 border-ink-black/20 rounded hover:bg-ink-black/5 transition-colors disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>
    </div>
  );
}
```

```typescript
// frontend/src/components/settings/DangerZone.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearHistory, deleteAccount } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function DangerZone() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear all your history? This cannot be undone.")) {
      return;
    }
    setLoading(true);
    try {
      await clearHistory();
      alert("History cleared successfully");
    } catch (error) {
      alert("Failed to clear history");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setLoading(true);
    try {
      await deleteAccount();
      await signOut();
      router.push("/");
    } catch (error) {
      alert("Failed to delete account");
      setLoading(false);
    }
  };

  return (
    <div className="riso-card p-6 border-2 border-red-500">
      <h2 className="font-display font-bold mb-4 text-red-600">Danger Zone</h2>

      <div className="space-y-4">
        {/* Clear History */}
        <div className="flex justify-between items-center py-3 border-b border-ink-black/10">
          <div>
            <p className="font-medium">Clear History</p>
            <p className="text-sm text-ink-black/60">Delete all analyses and scores</p>
          </div>
          <button
            onClick={handleClearHistory}
            disabled={loading}
            className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Delete Account */}
        <div className="flex justify-between items-center py-3">
          <div>
            <p className="font-medium">Delete Account</p>
            <p className="text-sm text-ink-black/60">Permanently remove all data</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/50">
          <div className="bg-paper-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="font-display font-bold text-xl mb-4">Delete Account</h3>
            <p className="text-ink-black/60 mb-4">
              This will permanently delete your account and all associated data.
              This action cannot be undone.
            </p>
            <p className="mb-4">Type <strong>DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full p-2 border-2 border-ink-black/20 rounded mb-4"
              placeholder="DELETE"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                }}
                className="px-4 py-2 border-2 border-ink-black/20 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || loading}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Sprint 3: Integration & Polish

### 3.1 Achievement Toasts

#### Task FE-11: Criar hook `useAchievementToast`
```typescript
// frontend/src/hooks/useAchievementToast.ts
import { useEffect } from "react";
import { toast } from "sonner";  // Usando sonner (instalado em 2.0)

const ACHIEVEMENT_MESSAGES: Record<string, { message: string; badge: string }> = {
  first_analysis: { message: "Welcome! You analyzed your first word!", badge: "🎯" },
  "10_analyses": { message: "Getting started! 10 analyses complete.", badge: "📚" },
  "100_analyses": { message: "Dedicated learner! 100 analyses!", badge: "🌟" },
  first_comparison: { message: "Great work recording your first comparison!", badge: "🎤" },
  score_90: { message: "Excellent pronunciation! 90%+ score!", badge: "🏆" },
};

export function useAchievementToast(newAchievements: string[]) {
  useEffect(() => {
    newAchievements.forEach((achievement) => {
      const config = ACHIEVEMENT_MESSAGES[achievement];
      if (config) {
        toast.success(`${config.badge} ${config.message}`, {
          duration: 5000,
        });
      }
    });
  }, [newAchievements]);
}
```

---

#### Task FE-12: Integrar achievement check após análise
```typescript
// Modificar frontend/src/components/TextInput.tsx ou onde análise é feita

import { checkAchievements } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAchievementToast } from "@/hooks/useAchievementToast";

// Dentro do componente:
const { user } = useAuth();
const [newAchievements, setNewAchievements] = useState<string[]>([]);

useAchievementToast(newAchievements);

const handleAnalyze = async () => {
  const result = await analyzeText(text);
  // ... handle result

  // Check achievements if logged in
  if (user) {
    const { new_achievements } = await checkAchievements();
    if (new_achievements.length > 0) {
      setNewAchievements(new_achievements);
    }
  }
};
```

---

### 3.2 Retention Limit Warning

#### Task FE-13: Criar `RetentionWarningBanner`
```typescript
// frontend/src/components/dashboard/RetentionWarningBanner.tsx
import Link from "next/link";

interface Props {
  currentCount: number;
  limit: number;  // 10000 for free tier
}

export function RetentionWarningBanner({ currentCount, limit }: Props) {
  const percentage = (currentCount / limit) * 100;

  if (percentage < 80) return null;

  const isUrgent = percentage >= 95;

  return (
    <div className={`p-4 rounded-lg mb-6 ${isUrgent ? "bg-red-100 border-red-500" : "bg-yellow-100 border-yellow-500"} border-2`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold">
            {isUrgent ? "⚠️ Storage Almost Full" : "📊 Approaching Storage Limit"}
          </p>
          <p className="text-sm">
            {currentCount.toLocaleString()} / {limit.toLocaleString()} records ({percentage.toFixed(0)}%)
          </p>
        </div>
        <Link href="/settings" className="riso-button-primary">
          Export Data
        </Link>
      </div>
    </div>
  );
}
```

---

### 3.3 Tests

#### Task TEST-1: Backend API tests
```python
# backend/tests/test_dashboard_api.py
import pytest
from fastapi.testclient import TestClient

# === Profile & Preferences Tests ===

def test_get_profile_unauthorized(client: TestClient):
    response = client.get("/api/user/profile")
    assert response.status_code == 401

def test_get_profile_authorized(authenticated_client: TestClient):
    response = authenticated_client.get("/api/user/profile")
    assert response.status_code == 200
    assert "display_name" in response.json()

def test_update_preferences_invalid_voice(authenticated_client: TestClient):
    response = authenticated_client.patch("/api/user/preferences", json={
        "default_voice": "invalid_voice"
    })
    assert response.status_code == 400

def test_update_preferences_valid(authenticated_client: TestClient):
    response = authenticated_client.patch("/api/user/preferences", json={
        "default_voice": "male1",
        "playback_speed": 1.2
    })
    assert response.status_code == 200

# === History Tests ===

def test_get_history_paginated_unauthorized(client: TestClient):
    response = client.get("/api/history/paginated?type=analysis")
    assert response.status_code == 401

def test_get_history_paginated_missing_type(authenticated_client: TestClient):
    response = authenticated_client.get("/api/history/paginated")
    assert response.status_code == 422  # Validation error

def test_get_history_paginated_valid(authenticated_client: TestClient):
    response = authenticated_client.get("/api/history/paginated?type=analysis&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "next_cursor" in data
    assert "has_more" in data

def test_get_history_paginated_invalid_cursor(authenticated_client: TestClient):
    response = authenticated_client.get("/api/history/paginated?type=analysis&cursor=invalid")
    assert response.status_code == 400
    assert "Invalid cursor" in response.json()["detail"]

def test_get_history_stats(authenticated_client: TestClient):
    response = authenticated_client.get("/api/history/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_analyses" in data
    assert "total_comparisons" in data

# === Achievements Tests ===

def test_get_achievements_unauthorized(client: TestClient):
    response = client.get("/api/achievements")
    assert response.status_code == 401

def test_get_achievements_authorized(authenticated_client: TestClient):
    response = authenticated_client.get("/api/achievements")
    assert response.status_code == 200
    assert "achievements" in response.json()

def test_check_achievements(authenticated_client: TestClient):
    response = authenticated_client.post("/api/achievements/check")
    assert response.status_code == 200
    assert "new_achievements" in response.json()
```

---

## Checklist de Entrega

### Database (Supabase)
- [x] DB-1: Tabela `profiles` com trigger
- [x] DB-2: Tabela `user_preferences` com ENUM
- [x] DB-3: Tabela `analysis_history`
- [x] DB-4: Tabela `comparison_scores`
- [x] DB-5: Tabela `user_achievements`
- [x] DB-6: Tabela `user_stats_snapshot`
- [x] DB-7: RPC `get_user_stats()`

### Backend (FastAPI)
- [x] BE-1: GET/PATCH `/api/user/profile`
- [x] BE-2: GET/PATCH `/api/user/preferences`
- [x] BE-3: GET `/api/history/paginated` + `/api/history/stats` + DELETE `/api/history`
- [x] BE-4: Auto-save análise no histórico (modificar analyze.py)
- [x] BE-5: Auto-save comparison no histórico (modificar compare.py)
- [x] BE-6: GET/POST `/api/achievements`
- [x] BE-7: DELETE `/api/user/account` (+ adicionar service role key)
- [x] BE-8: POST `/api/history/export`

### Frontend (Next.js)
- [x] FE-0: Instalar dependências (date-fns, sonner)
- [x] FE-1: Funções API client (`/api/user/*`, `/api/history/*`, `/api/achievements/*`)
- [x] FE-2: Types TypeScript
- [x] FE-3: Dashboard page
- [x] FE-4: StatsCards component (implementado inline no dashboard)
- [x] FE-5: RecentActivity component (implementado inline no dashboard)
- [x] FE-6: Settings page
- [x] FE-7: PreferencesSection component (implementado inline em Settings)
- [x] FE-8: History page
- [x] FE-9: HistoryList com paginação cursor-based (implementado inline)
- [x] FE-10: Componentes auxiliares (implementados inline quando aplicavel)
- [x] FE-11: useAchievementToast hook (via AchievementToast + useAchievements)
- [x] FE-12: Achievement check integration (após análise/comparação)
- [x] FE-13: RetentionWarningBanner

### Tests
- [x] TEST-1: Backend API tests

---

## Environment Variables Needed

```env
# backend/.env (adicionar)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # NOVO - para delete account
```

**Nota**: `get_supabase_client` já existe em `app/core/supabase.py` - não precisa criar.

---

## Ordem de Execução Recomendada

```
Semana 1: Database + Backend Foundation
├── Day 1-2: DB-1 → DB-7 (todas as migrations)
├── Day 3: BE-1, BE-2 (profile/preferences em /api/user/*)
└── Day 4-5: BE-3 → BE-6 (history, achievements)

Semana 2: Frontend + Integration
├── Day 1: FE-0, FE-1, FE-2 (deps, API client c/ rotas corretas, types)
├── Day 2-3: FE-3 → FE-5 (Dashboard)
├── Day 4: FE-6, FE-7 (Settings)
└── Day 5: FE-10 (componentes auxiliares)

Semana 3: History + Polish
├── Day 1-2: FE-8, FE-9 (History com paginação cursor-based)
├── Day 3: FE-11, FE-12 (Achievement toasts + integration)
├── Day 4: FE-13, BE-7, BE-8 (Retention warning, Delete, Export)
└── Day 5: BE-4, BE-5 (auto-save) + TEST-1
```
