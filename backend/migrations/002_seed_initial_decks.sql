-- Migration: Seed Initial Decks
-- Description: Add cards for Primeiros Passos and Minimal Pairs decks
-- Run in Supabase SQL Editor AFTER 001_deck_system.sql

-- Get deck IDs
DO $$
DECLARE
  primeiros_passos_id UUID;
  minimal_pairs_id UUID;
BEGIN
  SELECT id INTO primeiros_passos_id FROM decks WHERE slug = 'primeiros-passos';
  SELECT id INTO minimal_pairs_id FROM decks WHERE slug = 'minimal-pairs';

  -- ============================================================================
  -- DECK 1: Primeiros Passos (30 cards)
  -- Goal: Learn the 4 basic pitch accent patterns
  -- ============================================================================

  -- 平板 (Heiban) - Flat pattern: LHHH...
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, notes) VALUES
  (primeiros_passos_id, '桜', 'さくら', 'cherry blossom', 0, 'heiban', 'LHH', 1, 'Flat pattern - pitch rises after first mora and stays high'),
  (primeiros_passos_id, '友達', 'ともだち', 'friend', 0, 'heiban', 'LHHH', 2, 'Common word with flat pattern'),
  (primeiros_passos_id, '名前', 'なまえ', 'name', 0, 'heiban', 'LHH', 3, 'Flat pattern'),
  (primeiros_passos_id, '言葉', 'ことば', 'word, language', 0, 'heiban', 'LHH', 4, 'Flat pattern'),
  (primeiros_passos_id, '窓', 'まど', 'window', 0, 'heiban', 'LH', 5, 'Two mora flat'),
  (primeiros_passos_id, '春', 'はる', 'spring', 0, 'heiban', 'LH', 6, 'Season - flat'),
  (primeiros_passos_id, '夏', 'なつ', 'summer', 0, 'heiban', 'LH', 7, 'Season - flat'),

  -- 頭高 (Atamadaka) - Head-high pattern: HLL...
  (primeiros_passos_id, '雨', 'あめ', 'rain', 1, 'atamadaka', 'HL', 8, 'First mora high, then drops'),
  (primeiros_passos_id, '箸', 'はし', 'chopsticks', 1, 'atamadaka', 'HL', 9, 'Compare with 橋 (bridge)'),
  (primeiros_passos_id, '猫', 'ねこ', 'cat', 1, 'atamadaka', 'HL', 10, 'Common word'),
  (primeiros_passos_id, '犬', 'いぬ', 'dog', 1, 'atamadaka', 'HL', 11, 'Common animal'),
  (primeiros_passos_id, '秋', 'あき', 'autumn', 1, 'atamadaka', 'HL', 12, 'Season - head-high'),
  (primeiros_passos_id, '朝', 'あさ', 'morning', 1, 'atamadaka', 'HL', 13, 'Time of day'),
  (primeiros_passos_id, '今日', 'きょう', 'today', 1, 'atamadaka', 'HL', 14, 'Common word'),

  -- 中高 (Nakadaka) - Middle-high pattern: LHHL, LHHHL, etc.
  (primeiros_passos_id, '日本', 'にほん', 'Japan', 2, 'nakadaka', 'LHL', 15, 'Pitch drops after second mora'),
  (primeiros_passos_id, '卵', 'たまご', 'egg', 2, 'nakadaka', 'LHL', 16, 'Middle-high pattern'),
  (primeiros_passos_id, '心', 'こころ', 'heart, mind', 2, 'nakadaka', 'LHL', 17, 'Drop after こ'),
  (primeiros_passos_id, '明日', 'あした', 'tomorrow', 2, 'nakadaka', 'LHL', 18, 'Common word'),
  (primeiros_passos_id, '男', 'おとこ', 'man', 3, 'nakadaka', 'LHHL', 19, 'Drop after と'),
  (primeiros_passos_id, '女', 'おんな', 'woman', 3, 'nakadaka', 'LHHL', 20, 'Drop after second ん'),
  (primeiros_passos_id, '頭', 'あたま', 'head', 3, 'nakadaka', 'LHHL', 21, 'Body part'),

  -- 尾高 (Odaka) - Tail-high pattern: LHH↘ (drops on particle)
  (primeiros_passos_id, '橋', 'はし', 'bridge', 2, 'odaka', 'LH', 22, 'Pitch drops on following particle'),
  (primeiros_passos_id, '花', 'はな', 'flower', 2, 'odaka', 'LH', 23, 'Drops when followed by が/を'),
  (primeiros_passos_id, '山', 'やま', 'mountain', 2, 'odaka', 'LH', 24, 'Odaka pattern'),
  (primeiros_passos_id, '川', 'かわ', 'river', 2, 'odaka', 'LH', 25, 'Odaka pattern'),
  (primeiros_passos_id, '海', 'うみ', 'sea', 2, 'odaka', 'LH', 26, 'Odaka pattern'),
  (primeiros_passos_id, '妹', 'いもうと', 'younger sister', 4, 'odaka', 'LHHH', 27, 'Drops on particle'),
  (primeiros_passos_id, '弟', 'おとうと', 'younger brother', 4, 'odaka', 'LHHH', 28, 'Drops on particle'),

  -- Mixed review
  (primeiros_passos_id, '冬', 'ふゆ', 'winter', 2, 'odaka', 'LH', 29, 'Season - odaka'),
  (primeiros_passos_id, '夜', 'よる', 'night', 1, 'atamadaka', 'HL', 30, 'Time - head-high');

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

  -- Pair 9: 日 vs 火
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '日', 'ひ', 'day, sun', 0, 'heiban', 'H', 17, '火', 'Flat (one mora)'),
  (minimal_pairs_id, '火', 'ひ', 'fire', 1, 'atamadaka', 'H', 18, '日', 'Head-high (drops on particle)');

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

  -- Pair 14: 音 vs 鬼
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '音', 'おと', 'sound', 2, 'odaka', 'LH', 27, '鬼', 'Tail-high pattern'),
  (minimal_pairs_id, '鬼', 'おに', 'demon', 2, 'odaka', 'LH', 28, '音', 'Tail-high pattern');

  -- Pair 15: 価値 vs 勝ち
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '価値', 'かち', 'value', 1, 'atamadaka', 'HL', 29, '勝ち', 'Head-high: KA-chi'),
  (minimal_pairs_id, '勝ち', 'かち', 'victory', 0, 'heiban', 'LH', 30, '価値', 'Flat: ka-CHI');

  -- More pairs for 50 total...
  -- Pair 16: 歯 vs 葉
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '歯', 'は', 'tooth', 1, 'atamadaka', 'H', 31, '葉', 'Head-high'),
  (minimal_pairs_id, '葉', 'は', 'leaf', 0, 'heiban', 'H', 32, '歯', 'Flat');

  -- Pair 17: 気 vs 木
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '気', 'き', 'spirit, mind', 0, 'heiban', 'H', 33, '木', 'Flat'),
  (minimal_pairs_id, '木', 'き', 'tree', 1, 'atamadaka', 'H', 34, '気', 'Head-high (drops on particle)');

  -- Pair 18: 目 vs 芽
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '目', 'め', 'eye', 1, 'atamadaka', 'H', 35, '芽', 'Head-high'),
  (minimal_pairs_id, '芽', 'め', 'bud, sprout', 0, 'heiban', 'H', 36, '目', 'Flat');

  -- Pair 19: 手 vs 寺
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '手', 'て', 'hand', 1, 'atamadaka', 'H', 37, NULL, 'Head-high - single mora'),
  (minimal_pairs_id, '寺', 'てら', 'temple', 2, 'odaka', 'LH', 38, NULL, 'Tail-high: te-RA');

  -- Pair 20: 端 vs 恥
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '端', 'はし', 'edge', 0, 'heiban', 'LH', 39, '恥', 'Flat pattern'),
  (minimal_pairs_id, '恥', 'はじ', 'shame', 2, 'odaka', 'LH', 40, '端', 'Tail-high pattern');

  -- Pair 21: 風 vs 蓋
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '風', 'かぜ', 'wind', 0, 'heiban', 'LH', 41, '蓋', 'Flat: ka-ZE'),
  (minimal_pairs_id, '蓋', 'ふた', 'lid', 0, 'heiban', 'LH', 42, '風', 'Flat: fu-TA');

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

  -- Pair 25: 来る vs 切る
  INSERT INTO cards (deck_id, word, reading, meaning, accent_position, accent_type, pitch_pattern, sort_order, pair_word, notes) VALUES
  (minimal_pairs_id, '来る', 'くる', 'to come', 1, 'atamadaka', 'HL', 49, '切る', 'Head-high: KU-ru'),
  (minimal_pairs_id, '切る', 'きる', 'to cut', 1, 'atamadaka', 'HL', 50, '来る', 'Head-high: KI-ru');

END $$;

-- Update card counts
UPDATE decks SET card_count = (SELECT COUNT(*) FROM cards WHERE deck_id = decks.id);
