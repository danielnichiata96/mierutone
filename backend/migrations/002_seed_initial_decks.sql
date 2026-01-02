-- Migration: Seed Initial Decks
-- Description: Add cards for First Steps and Minimal Pairs decks
-- Run in Supabase SQL Editor AFTER 001_deck_system.sql

-- Get deck IDs
DO $$
DECLARE
  first_steps_id UUID;
  minimal_pairs_id UUID;
BEGIN
  SELECT id INTO first_steps_id FROM decks WHERE slug = 'first-steps';
  SELECT id INTO minimal_pairs_id FROM decks WHERE slug = 'minimal-pairs';

  -- ============================================================================
  -- DECK 1: First Steps (30 cards)
  -- Goal: Learn the 4 basic pitch accent patterns
  -- ============================================================================

  -- 平板 (Heiban) - Flat pattern: LHHH...
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, notes) VALUES
  (first_steps_id, '桜', 'さくら', 'cherry blossom', 0, 'heiban', 'LHH', 1, 'Flat pattern - pitch rises after first mora and stays high'),
  (first_steps_id, '友達', 'ともだち', 'friend', 0, 'heiban', 'LHHH', 2, 'Common word with flat pattern'),
  (first_steps_id, '名前', 'なまえ', 'name', 0, 'heiban', 'LHH', 3, 'Flat pattern'),
  (first_steps_id, '言葉', 'ことば', 'word, language', 0, 'heiban', 'LHH', 4, 'Flat pattern'),
  (first_steps_id, '窓', 'まど', 'window', 0, 'heiban', 'LH', 5, 'Two mora flat'),
  (first_steps_id, '春', 'はる', 'spring', 0, 'heiban', 'LH', 6, 'Season - flat'),
  (first_steps_id, '夏', 'なつ', 'summer', 0, 'heiban', 'LH', 7, 'Season - flat'),

  -- 頭高 (Atamadaka) - Head-high pattern: HLL...
  (first_steps_id, '雨', 'あめ', 'rain', 1, 'atamadaka', 'HL', 8, 'First mora high, then drops'),
  (first_steps_id, '箸', 'はし', 'chopsticks', 1, 'atamadaka', 'HL', 9, 'Compare with 橋 (bridge)'),
  (first_steps_id, '猫', 'ねこ', 'cat', 1, 'atamadaka', 'HL', 10, 'Common word'),
  (first_steps_id, '犬', 'いぬ', 'dog', 1, 'atamadaka', 'HL', 11, 'Common animal'),
  (first_steps_id, '秋', 'あき', 'autumn', 1, 'atamadaka', 'HL', 12, 'Season - head-high'),
  (first_steps_id, '朝', 'あさ', 'morning', 1, 'atamadaka', 'HL', 13, 'Time of day'),
  (first_steps_id, '今日', 'きょう', 'today', 1, 'atamadaka', 'HL', 14, 'Common word'),

  -- 中高 (Nakadaka) - Middle-high pattern: LHHL, LHHHL, etc.
  (first_steps_id, '日本', 'にほん', 'Japan', 2, 'nakadaka', 'LHL', 15, 'Pitch drops after second mora'),
  (first_steps_id, '卵', 'たまご', 'egg', 2, 'nakadaka', 'LHL', 16, 'Middle-high pattern'),
  (first_steps_id, '心', 'こころ', 'heart, mind', 2, 'nakadaka', 'LHL', 17, 'Drop after こ'),
  (first_steps_id, '明日', 'あした', 'tomorrow', 2, 'nakadaka', 'LHL', 18, 'Common word'),
  (first_steps_id, '男', 'おとこ', 'man', 3, 'nakadaka', 'LHHL', 19, 'Drop after と'),
  (first_steps_id, '女', 'おんな', 'woman', 3, 'nakadaka', 'LHHL', 20, 'Drop after second ん'),
  (first_steps_id, '頭', 'あたま', 'head', 3, 'nakadaka', 'LHHL', 21, 'Body part'),

  -- 尾高 (Odaka) - Tail-high pattern: LHH↘ (drops on particle)
  (first_steps_id, '橋', 'はし', 'bridge', 2, 'odaka', 'LH', 22, 'Pitch drops on following particle'),
  (first_steps_id, '花', 'はな', 'flower', 2, 'odaka', 'LH', 23, 'Drops when followed by が/を'),
  (first_steps_id, '山', 'やま', 'mountain', 2, 'odaka', 'LH', 24, 'Odaka pattern'),
  (first_steps_id, '川', 'かわ', 'river', 2, 'odaka', 'LH', 25, 'Odaka pattern'),
  (first_steps_id, '海', 'うみ', 'sea', 2, 'odaka', 'LH', 26, 'Odaka pattern'),
  (first_steps_id, '妹', 'いもうと', 'younger sister', 4, 'odaka', 'LHHH', 27, 'Drops on particle'),
  (first_steps_id, '弟', 'おとうと', 'younger brother', 4, 'odaka', 'LHHH', 28, 'Drops on particle'),

  -- Mixed review
  (first_steps_id, '冬', 'ふゆ', 'winter', 2, 'odaka', 'LH', 29, 'Season - odaka'),
  (first_steps_id, '夜', 'よる', 'night', 1, 'atamadaka', 'HL', 30, 'Time - head-high');

  -- ============================================================================
  -- DECK 2: Minimal Pairs (50 cards = 25 pairs)
  -- Goal: Train ear to distinguish words that differ only in pitch
  -- ============================================================================

  -- Pair 1: 箸 vs 橋
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '箸', 'はし', 'chopsticks', 1, 'atamadaka', 'HL', 1, '橋', 'Head-high: HA-shi'),
  (minimal_pairs_id, '橋', 'はし', 'bridge', 2, 'odaka', 'LH', 2, '箸', 'Tail-high: ha-SHI (drops on particle)');

  -- Pair 2: 雨 vs 飴
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '雨', 'あめ', 'rain', 1, 'atamadaka', 'HL', 3, '飴', 'Head-high: A-me'),
  (minimal_pairs_id, '飴', 'あめ', 'candy', 0, 'heiban', 'LH', 4, '雨', 'Flat: a-ME');

  -- Pair 3: 柿 vs 牡蠣
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '柿', 'かき', 'persimmon', 0, 'heiban', 'LH', 5, '牡蠣', 'Flat: ka-KI'),
  (minimal_pairs_id, '牡蠣', 'かき', 'oyster', 1, 'atamadaka', 'HL', 6, '柿', 'Head-high: KA-ki');

  -- Pair 4: 酒 vs 鮭
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '酒', 'さけ', 'sake, alcohol', 0, 'heiban', 'LH', 7, '鮭', 'Flat: sa-KE'),
  (minimal_pairs_id, '鮭', 'さけ', 'salmon', 1, 'atamadaka', 'HL', 8, '酒', 'Head-high: SA-ke');

  -- Pair 5: 髪 vs 神
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '髪', 'かみ', 'hair', 2, 'odaka', 'LH', 9, '神', 'Tail-high: ka-MI (drops on particle)'),
  (minimal_pairs_id, '神', 'かみ', 'god', 1, 'atamadaka', 'HL', 10, '髪', 'Head-high: KA-mi');

  -- Pair 6: 花 vs 鼻
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '花', 'はな', 'flower', 2, 'odaka', 'LH', 11, '鼻', 'Tail-high: ha-NA (drops on particle)'),
  (minimal_pairs_id, '鼻', 'はな', 'nose', 0, 'heiban', 'LH', 12, '花', 'Flat: ha-NA');

  -- Pair 7: 雲 vs 蜘蛛
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '雲', 'くも', 'cloud', 1, 'atamadaka', 'HL', 13, '蜘蛛', 'Head-high: KU-mo'),
  (minimal_pairs_id, '蜘蛛', 'くも', 'spider', 0, 'heiban', 'LH', 14, '雲', 'Flat: ku-MO');

  -- Pair 8: 型 vs 肩
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '型', 'かた', 'form, mold', 2, 'odaka', 'LH', 15, '肩', 'Tail-high pattern'),
  (minimal_pairs_id, '肩', 'かた', 'shoulder', 1, 'atamadaka', 'HL', 16, '型', 'Head-high pattern');

  -- Pair 9: 日が vs 火が (1-mora words with particle)
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '日が', 'ひが', 'day (subject)', 0, 'heiban', 'LH', 17, '火が', 'Flat with particle: hi-GA'),
  (minimal_pairs_id, '火が', 'ひが', 'fire (subject)', 1, 'atamadaka', 'HL', 18, '日が', 'Head-high with particle: HI-ga');

  -- Pair 10: 白 vs 城
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '白', 'しろ', 'white', 1, 'atamadaka', 'HL', 19, '城', 'Head-high: SHI-ro'),
  (minimal_pairs_id, '城', 'しろ', 'castle', 0, 'heiban', 'LH', 20, '白', 'Flat: shi-RO');

  -- Pair 11: 足 vs 脚
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '足', 'あし', 'foot', 2, 'odaka', 'LH', 21, '脚', 'Tail-high: a-SHI'),
  (minimal_pairs_id, '脚', 'あし', 'leg', 0, 'heiban', 'LH', 22, '足', 'Flat: a-SHI');

  -- Pair 12: 今 vs 居間
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '今', 'いま', 'now', 1, 'atamadaka', 'HL', 23, '居間', 'Head-high: I-ma'),
  (minimal_pairs_id, '居間', 'いま', 'living room', 0, 'heiban', 'LH', 24, '今', 'Flat: i-MA');

  -- Pair 13: 息 vs 意気
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '息', 'いき', 'breath', 1, 'atamadaka', 'HL', 25, '意気', 'Head-high: I-ki'),
  (minimal_pairs_id, '意気', 'いき', 'spirit', 0, 'heiban', 'LH', 26, '息', 'Flat: i-KI');

  -- Pair 14: 秋 vs 空き
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '秋', 'あき', 'autumn', 1, 'atamadaka', 'HL', 27, '空き', 'Head-high: A-ki'),
  (minimal_pairs_id, '空き', 'あき', 'vacancy, free space', 0, 'heiban', 'LH', 28, '秋', 'Flat: a-KI');

  -- Pair 15: 価値 vs 勝ち
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '価値', 'かち', 'value', 1, 'atamadaka', 'HL', 29, '勝ち', 'Head-high: KA-chi'),
  (minimal_pairs_id, '勝ち', 'かち', 'victory', 0, 'heiban', 'LH', 30, '価値', 'Flat: ka-CHI');

  -- More pairs for 50 total...
  -- Pair 16: 歯が vs 葉が (1-mora words with particle)
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '歯が', 'はが', 'tooth (subject)', 1, 'atamadaka', 'HL', 31, '葉が', 'Head-high with particle: HA-ga'),
  (minimal_pairs_id, '葉が', 'はが', 'leaf (subject)', 0, 'heiban', 'LH', 32, '歯が', 'Flat with particle: ha-GA');

  -- Pair 17: 気が vs 木が (1-mora words with particle)
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '気が', 'きが', 'spirit, mind (subject)', 0, 'heiban', 'LH', 33, '木が', 'Flat with particle: ki-GA'),
  (minimal_pairs_id, '木が', 'きが', 'tree (subject)', 1, 'atamadaka', 'HL', 34, '気が', 'Head-high with particle: KI-ga');

  -- Pair 18: 目が vs 芽が (1-mora words with particle)
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '目が', 'めが', 'eye (subject)', 1, 'atamadaka', 'HL', 35, '芽が', 'Head-high with particle: ME-ga'),
  (minimal_pairs_id, '芽が', 'めが', 'bud, sprout (subject)', 0, 'heiban', 'LH', 36, '目が', 'Flat with particle: me-GA');

  -- Pair 19: 朝 vs 麻
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '朝', 'あさ', 'morning', 1, 'atamadaka', 'HL', 37, '麻', 'Head-high: A-sa'),
  (minimal_pairs_id, '麻', 'あさ', 'hemp', 2, 'odaka', 'LH', 38, '朝', 'Tail-high: a-SA (drops on particle)');

  -- Pair 20: 春 vs 張る
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '春', 'はる', 'spring', 1, 'atamadaka', 'HL', 39, '張る', 'Head-high: HA-ru'),
  (minimal_pairs_id, '張る', 'はる', 'to stretch', 0, 'heiban', 'LH', 40, '春', 'Flat: ha-RU');

  -- Pair 21: 紙 vs 神
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '紙', 'かみ', 'paper', 2, 'odaka', 'LH', 41, '神', 'Tail-high: ka-MI (drops on particle)'),
  (minimal_pairs_id, '神', 'かみ', 'god', 1, 'atamadaka', 'HL', 42, '紙', 'Head-high: KA-mi');

  -- Pair 22: 中 vs 仲
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '中', 'なか', 'inside', 1, 'atamadaka', 'HL', 43, '仲', 'Head-high: NA-ka'),
  (minimal_pairs_id, '仲', 'なか', 'relationship', 0, 'heiban', 'LH', 44, '中', 'Flat: na-KA');

  -- Pair 23: 夏 vs 梨
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '梨', 'なし', 'pear', 0, 'heiban', 'LH', 45, NULL, 'Flat pattern'),
  (minimal_pairs_id, '無し', 'なし', 'nothing, none', 1, 'atamadaka', 'HL', 46, '梨', 'Head-high pattern');

  -- Pair 24: 買う vs 飼う
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '買う', 'かう', 'to buy', 0, 'heiban', 'LH', 47, '飼う', 'Flat: ka-U'),
  (minimal_pairs_id, '飼う', 'かう', 'to keep (pet)', 1, 'atamadaka', 'HL', 48, '買う', 'Head-high: KA-u');

  -- Pair 25: 切る vs 着る
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '切る', 'きる', 'to cut', 1, 'atamadaka', 'HL', 49, '着る', 'Head-high: KI-ru'),
  (minimal_pairs_id, '着る', 'きる', 'to wear', 0, 'heiban', 'LH', 50, '切る', 'Flat: ki-RU');

END $$;

-- Update card counts
UPDATE decks SET card_count = (SELECT COUNT(*) FROM cards WHERE deck_id = decks.id);
