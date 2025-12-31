-- ============================================================================
-- Security & Performance Patch
-- Run AFTER 001_dashboard_schema.sql if already applied
-- ============================================================================

-- Ensure pgcrypto is available (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Fix SECURITY DEFINER functions with SET search_path
-- ============================================================================

-- Fix handle_new_user
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

-- Fix handle_new_user_preferences
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

-- ============================================================================
-- Add compound indexes for better pagination performance
-- ============================================================================

-- Drop old simple pagination indexes
DROP INDEX IF EXISTS idx_analysis_history_pagination;
DROP INDEX IF EXISTS idx_comparison_scores_pagination;

-- Create compound indexes with user_id for RLS efficiency
CREATE INDEX IF NOT EXISTS idx_analysis_history_pagination
  ON public.analysis_history(user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_comparison_scores_pagination
  ON public.comparison_scores(user_id, created_at DESC, id DESC);

-- ============================================================================
-- Done! Verify with:
-- \df public.handle_new_user  -- should show SET search_path
-- \di idx_analysis_history_pagination  -- should include user_id
-- ============================================================================
