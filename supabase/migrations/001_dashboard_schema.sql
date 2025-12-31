-- ============================================================================
-- MieruTone Dashboard Schema Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- DB-1: Profiles table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- DB-2: User Preferences table
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE voice_option AS ENUM (
    'female1', 'female2', 'female3', 'female4',
    'male1', 'male2', 'male3'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_voice voice_option DEFAULT 'female1',
  playback_speed DECIMAL DEFAULT 1.0 CHECK (playback_speed >= 0.5 AND playback_speed <= 1.5),
  show_accent_numbers BOOLEAN DEFAULT true,
  show_part_of_speech BOOLEAN DEFAULT false,
  show_confidence BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger: create preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_preferences (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- ============================================================================
-- DB-3: Analysis History table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_history_user_created
  ON public.analysis_history(user_id, created_at DESC);

-- Compound index for cursor-based pagination (user_id, created_at, id)
CREATE INDEX IF NOT EXISTS idx_analysis_history_pagination
  ON public.analysis_history(user_id, created_at DESC, id DESC);

ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analyses" ON public.analysis_history;
CREATE POLICY "Users can view own analyses"
  ON public.analysis_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analyses" ON public.analysis_history;
CREATE POLICY "Users can insert own analyses"
  ON public.analysis_history FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own analyses" ON public.analysis_history;
CREATE POLICY "Users can delete own analyses"
  ON public.analysis_history FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- DB-4: Comparison Scores table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comparison_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  score DECIMAL NOT NULL CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comparison_scores_user_created
  ON public.comparison_scores(user_id, created_at DESC);

-- Compound index for cursor-based pagination (user_id, created_at, id)
CREATE INDEX IF NOT EXISTS idx_comparison_scores_pagination
  ON public.comparison_scores(user_id, created_at DESC, id DESC);

ALTER TABLE public.comparison_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own scores" ON public.comparison_scores;
CREATE POLICY "Users can view own scores"
  ON public.comparison_scores FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own scores" ON public.comparison_scores;
CREATE POLICY "Users can insert own scores"
  ON public.comparison_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own scores" ON public.comparison_scores;
CREATE POLICY "Users can delete own scores"
  ON public.comparison_scores FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- DB-5: User Achievements table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user
  ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- DB-6: User Stats Snapshot table (for data retention)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_stats_snapshot (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_analyses_archived INTEGER DEFAULT 0,
  total_comparisons_archived INTEGER DEFAULT 0,
  sum_scores_archived DECIMAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_stats_snapshot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stats snapshot" ON public.user_stats_snapshot;
CREATE POLICY "Users can view own stats snapshot"
  ON public.user_stats_snapshot FOR SELECT USING (auth.uid() = id);

-- ============================================================================
-- DB-7: RPC function get_user_stats()
-- ============================================================================
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

-- ============================================================================
-- Backfill: Create profiles/preferences for existing users
-- ============================================================================
INSERT INTO public.profiles (id, display_name, avatar_url)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_preferences (id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_preferences)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Done! Verify with:
-- SELECT * FROM public.profiles;
-- SELECT * FROM public.user_preferences;
-- SELECT get_user_stats();
-- ============================================================================
