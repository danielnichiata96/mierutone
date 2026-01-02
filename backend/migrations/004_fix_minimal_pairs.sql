-- Migration: Fix Minimal Pairs deck
-- Description:
--   1. Remove pairs with different readings (not minimal pairs)
--   2. Add particles to 1-mora pairs to make them distinguishable
--   3. Replace removed pairs with valid minimal pairs
-- Run in Supabase SQL Editor

-- Get the minimal-pairs deck ID
DO $$
DECLARE
  deck_id UUID;
BEGIN
  SELECT id INTO deck_id FROM decks WHERE slug = 'minimal-pairs';

  -- ============================================================================
  -- 1. REMOVE INVALID PAIRS (different readings)
  -- ============================================================================

  -- Pair 14: 音 (おと) vs 鬼 (おに) - different readings
  DELETE FROM cards WHERE deck_id = deck_id AND word IN ('音', '鬼');

  -- Pair 19: 手 (て) vs 寺 (てら) - different readings
  DELETE FROM cards WHERE deck_id = deck_id AND word = '手' AND reading = 'て';
  DELETE FROM cards WHERE deck_id = deck_id AND word = '寺';

  -- Pair 20: 端 (はし) vs 恥 (はじ) - different readings
  DELETE FROM cards WHERE deck_id = deck_id AND word = '端' AND reading = 'はし';
  DELETE FROM cards WHERE deck_id = deck_id AND word = '恥';

  -- Pair 21: 風 (かぜ) vs 蓋 (ふた) - completely different readings
  DELETE FROM cards WHERE deck_id = deck_id AND word = '風' AND reading = 'かぜ';
  DELETE FROM cards WHERE deck_id = deck_id AND word = '蓋';

  -- Pair 25: 来る (くる) vs 切る (きる) - different readings AND same pitch
  DELETE FROM cards WHERE deck_id = deck_id AND word = '来る';
  DELETE FROM cards WHERE deck_id = deck_id AND word = '切る';

  -- ============================================================================
  -- 2. UPDATE 1-MORA PAIRS WITH PARTICLES
  -- ============================================================================

  -- Pair 9: 日 vs 火 → 日が vs 火が
  UPDATE cards SET
    word = '日が',
    reading = 'ひが',
    meaning = 'day/sun + subject particle',
    pitch_pattern = 'HH',
    notes = 'Flat: hi-GA (pitch stays high)'
  WHERE deck_id = deck_id AND word = '日' AND reading = 'ひ';

  UPDATE cards SET
    word = '火が',
    reading = 'ひが',
    meaning = 'fire + subject particle',
    pitch_pattern = 'HL',
    notes = 'Head-high: HI-ga (pitch drops on particle)'
  WHERE deck_id = deck_id AND word = '火' AND reading = 'ひ';

  -- Pair 16: 歯 vs 葉 → 歯が vs 葉が
  UPDATE cards SET
    word = '歯が',
    reading = 'はが',
    meaning = 'tooth + subject particle',
    pitch_pattern = 'HL',
    pair_word = '葉が',
    notes = 'Head-high: HA-ga (pitch drops on particle)'
  WHERE deck_id = deck_id AND word = '歯' AND reading = 'は';

  UPDATE cards SET
    word = '葉が',
    reading = 'はが',
    meaning = 'leaf + subject particle',
    pitch_pattern = 'HH',
    pair_word = '歯が',
    notes = 'Flat: ha-GA (pitch stays high)'
  WHERE deck_id = deck_id AND word = '葉' AND reading = 'は';

  -- Pair 17: 気 vs 木 → 気が vs 木が
  UPDATE cards SET
    word = '気が',
    reading = 'きが',
    meaning = 'spirit/mind + subject particle',
    pitch_pattern = 'HH',
    pair_word = '木が',
    notes = 'Flat: ki-GA (pitch stays high)'
  WHERE deck_id = deck_id AND word = '気' AND reading = 'き';

  UPDATE cards SET
    word = '木が',
    reading = 'きが',
    meaning = 'tree + subject particle',
    pitch_pattern = 'HL',
    pair_word = '気が',
    notes = 'Head-high: KI-ga (pitch drops on particle)'
  WHERE deck_id = deck_id AND word = '木' AND reading = 'き';

  -- Pair 18: 目 vs 芽 → 目が vs 芽が
  UPDATE cards SET
    word = '目が',
    reading = 'めが',
    meaning = 'eye + subject particle',
    pitch_pattern = 'HL',
    pair_word = '芽が',
    notes = 'Head-high: ME-ga (pitch drops on particle)'
  WHERE deck_id = deck_id AND word = '目' AND reading = 'め';

  UPDATE cards SET
    word = '芽が',
    reading = 'めが',
    meaning = 'bud/sprout + subject particle',
    pitch_pattern = 'HH',
    pair_word = '目が',
    notes = 'Flat: me-GA (pitch stays high)'
  WHERE deck_id = deck_id AND word = '芽' AND reading = 'め';

  -- ============================================================================
  -- 3. ADD REPLACEMENT PAIRS (valid minimal pairs)
  -- ============================================================================

  -- New Pair: 猿 vs 去る (さる)
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (deck_id, '猿', 'さる', 'monkey', 1, 'atamadaka', 'HL', 27, '去る', 'Head-high: SA-ru'),
  (deck_id, '去る', 'さる', 'to leave', 0, 'heiban', 'LH', 28, '猿', 'Flat: sa-RU');

  -- New Pair: 蛙 vs 帰る (かえる)
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (deck_id, '蛙', 'かえる', 'frog', 0, 'heiban', 'LHH', 37, '帰る', 'Flat: ka-e-RU'),
  (deck_id, '帰る', 'かえる', 'to return', 1, 'atamadaka', 'HLL', 38, '蛙', 'Head-high: KA-e-ru');

  -- New Pair: 菊 vs 聞く (きく)
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (deck_id, '菊', 'きく', 'chrysanthemum', 0, 'heiban', 'LH', 39, '聞く', 'Flat: ki-KU'),
  (deck_id, '聞く', 'きく', 'to listen', 1, 'atamadaka', 'HL', 40, '菊', 'Head-high: KI-ku');

  -- New Pair: 釣り vs 吊り (つり)
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (deck_id, '釣り', 'つり', 'fishing', 0, 'heiban', 'LH', 41, '吊り', 'Flat: tsu-RI'),
  (deck_id, '吊り', 'つり', 'hanging', 1, 'atamadaka', 'HL', 42, '釣り', 'Head-high: TSU-ri');

  -- New Pair: 糸 vs 意図 (いと)
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (deck_id, '糸', 'いと', 'thread', 2, 'odaka', 'LH', 49, '意図', 'Tail-high: i-TO (drops on particle)'),
  (deck_id, '意図', 'いと', 'intention', 1, 'atamadaka', 'HL', 50, '糸', 'Head-high: I-to');

END $$;

-- Update card count
UPDATE decks SET card_count = (SELECT COUNT(*) FROM cards WHERE deck_id = decks.id) WHERE slug = 'minimal-pairs';
