-- Migration: Rename Primeiros Passos to First Steps
-- Description: Update deck slug and title from Portuguese to English
-- Run in Supabase SQL Editor

UPDATE decks
SET
  slug = 'first-steps',
  title = 'First Steps'
WHERE slug = 'primeiros-passos';
