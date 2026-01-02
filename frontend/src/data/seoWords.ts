/**
 * Curated word list for SEO sitemap generation.
 *
 * Selection criteria:
 * - JLPT N5/N4 vocabulary (beginner-friendly, high search volume)
 * - Words with interesting pitch patterns (homophones, minimal pairs)
 * - Common conversational words
 *
 * Phase 1: ~400 high-value words
 * Phase 2: Full pitch.db export (124k+ words)
 */

export interface SeoWord {
  word: string;
  reading: string;
  jlpt?: "N5" | "N4" | "N3";
}

// JLPT N5 Core Vocabulary (~100 words)
const jlptN5: SeoWord[] = [
  // Time & Numbers
  { word: "今日", reading: "きょう", jlpt: "N5" },
  { word: "明日", reading: "あした", jlpt: "N5" },
  { word: "昨日", reading: "きのう", jlpt: "N5" },
  { word: "今", reading: "いま", jlpt: "N5" },
  { word: "朝", reading: "あさ", jlpt: "N5" },
  { word: "昼", reading: "ひる", jlpt: "N5" },
  { word: "夜", reading: "よる", jlpt: "N5" },
  { word: "週", reading: "しゅう", jlpt: "N5" },
  { word: "月", reading: "つき", jlpt: "N5" },
  { word: "年", reading: "とし", jlpt: "N5" },

  // People & Family
  { word: "人", reading: "ひと", jlpt: "N5" },
  { word: "私", reading: "わたし", jlpt: "N5" },
  { word: "友達", reading: "ともだち", jlpt: "N5" },
  { word: "先生", reading: "せんせい", jlpt: "N5" },
  { word: "学生", reading: "がくせい", jlpt: "N5" },
  { word: "子供", reading: "こども", jlpt: "N5" },
  { word: "男", reading: "おとこ", jlpt: "N5" },
  { word: "女", reading: "おんな", jlpt: "N5" },
  { word: "父", reading: "ちち", jlpt: "N5" },
  { word: "母", reading: "はは", jlpt: "N5" },
  { word: "兄", reading: "あに", jlpt: "N5" },
  { word: "姉", reading: "あね", jlpt: "N5" },
  { word: "弟", reading: "おとうと", jlpt: "N5" },
  { word: "妹", reading: "いもうと", jlpt: "N5" },

  // Places
  { word: "家", reading: "いえ", jlpt: "N5" },
  { word: "学校", reading: "がっこう", jlpt: "N5" },
  { word: "会社", reading: "かいしゃ", jlpt: "N5" },
  { word: "駅", reading: "えき", jlpt: "N5" },
  { word: "病院", reading: "びょういん", jlpt: "N5" },
  { word: "店", reading: "みせ", jlpt: "N5" },
  { word: "部屋", reading: "へや", jlpt: "N5" },
  { word: "外", reading: "そと", jlpt: "N5" },
  { word: "中", reading: "なか", jlpt: "N5" },
  { word: "上", reading: "うえ", jlpt: "N5" },
  { word: "下", reading: "した", jlpt: "N5" },
  { word: "前", reading: "まえ", jlpt: "N5" },
  { word: "後ろ", reading: "うしろ", jlpt: "N5" },
  { word: "右", reading: "みぎ", jlpt: "N5" },
  { word: "左", reading: "ひだり", jlpt: "N5" },

  // Nature
  { word: "山", reading: "やま", jlpt: "N5" },
  { word: "川", reading: "かわ", jlpt: "N5" },
  { word: "海", reading: "うみ", jlpt: "N5" },
  { word: "空", reading: "そら", jlpt: "N5" },
  { word: "花", reading: "はな", jlpt: "N5" },
  { word: "木", reading: "き", jlpt: "N5" },
  { word: "雨", reading: "あめ", jlpt: "N5" },
  { word: "雪", reading: "ゆき", jlpt: "N5" },
  { word: "風", reading: "かぜ", jlpt: "N5" },

  // Objects
  { word: "本", reading: "ほん", jlpt: "N5" },
  { word: "新聞", reading: "しんぶん", jlpt: "N5" },
  { word: "電話", reading: "でんわ", jlpt: "N5" },
  { word: "時計", reading: "とけい", jlpt: "N5" },
  { word: "傘", reading: "かさ", jlpt: "N5" },
  { word: "鍵", reading: "かぎ", jlpt: "N5" },
  { word: "机", reading: "つくえ", jlpt: "N5" },
  { word: "椅子", reading: "いす", jlpt: "N5" },
  { word: "窓", reading: "まど", jlpt: "N5" },
  { word: "ドア", reading: "どあ", jlpt: "N5" },

  // Food & Drink
  { word: "水", reading: "みず", jlpt: "N5" },
  { word: "お茶", reading: "おちゃ", jlpt: "N5" },
  { word: "ご飯", reading: "ごはん", jlpt: "N5" },
  { word: "パン", reading: "ぱん", jlpt: "N5" },
  { word: "肉", reading: "にく", jlpt: "N5" },
  { word: "魚", reading: "さかな", jlpt: "N5" },
  { word: "野菜", reading: "やさい", jlpt: "N5" },
  { word: "果物", reading: "くだもの", jlpt: "N5" },
  { word: "卵", reading: "たまご", jlpt: "N5" },

  // Body
  { word: "目", reading: "め", jlpt: "N5" },
  { word: "耳", reading: "みみ", jlpt: "N5" },
  { word: "口", reading: "くち", jlpt: "N5" },
  { word: "鼻", reading: "はな", jlpt: "N5" },
  { word: "手", reading: "て", jlpt: "N5" },
  { word: "足", reading: "あし", jlpt: "N5" },
  { word: "頭", reading: "あたま", jlpt: "N5" },
  { word: "顔", reading: "かお", jlpt: "N5" },

  // Colors
  { word: "白", reading: "しろ", jlpt: "N5" },
  { word: "黒", reading: "くろ", jlpt: "N5" },
  { word: "赤", reading: "あか", jlpt: "N5" },
  { word: "青", reading: "あお", jlpt: "N5" },

  // Common verbs
  { word: "食べる", reading: "たべる", jlpt: "N5" },
  { word: "飲む", reading: "のむ", jlpt: "N5" },
  { word: "見る", reading: "みる", jlpt: "N5" },
  { word: "聞く", reading: "きく", jlpt: "N5" },
  { word: "話す", reading: "はなす", jlpt: "N5" },
  { word: "読む", reading: "よむ", jlpt: "N5" },
  { word: "書く", reading: "かく", jlpt: "N5" },
  { word: "行く", reading: "いく", jlpt: "N5" },
  { word: "来る", reading: "くる", jlpt: "N5" },
  { word: "帰る", reading: "かえる", jlpt: "N5" },
  { word: "買う", reading: "かう", jlpt: "N5" },
  { word: "会う", reading: "あう", jlpt: "N5" },
  { word: "待つ", reading: "まつ", jlpt: "N5" },
  { word: "作る", reading: "つくる", jlpt: "N5" },
  { word: "使う", reading: "つかう", jlpt: "N5" },

  // Common adjectives
  { word: "大きい", reading: "おおきい", jlpt: "N5" },
  { word: "小さい", reading: "ちいさい", jlpt: "N5" },
  { word: "新しい", reading: "あたらしい", jlpt: "N5" },
  { word: "古い", reading: "ふるい", jlpt: "N5" },
  { word: "高い", reading: "たかい", jlpt: "N5" },
  { word: "安い", reading: "やすい", jlpt: "N5" },
  { word: "良い", reading: "よい", jlpt: "N5" },
  { word: "悪い", reading: "わるい", jlpt: "N5" },
];

// JLPT N4 Core Vocabulary (~100 words)
const jlptN4: SeoWord[] = [
  // Verbs - transitive/intransitive pairs
  { word: "決める", reading: "きめる", jlpt: "N4" },
  { word: "決まる", reading: "きまる", jlpt: "N4" },
  { word: "変わる", reading: "かわる", jlpt: "N4" },
  { word: "変える", reading: "かえる", jlpt: "N4" },
  { word: "始まる", reading: "はじまる", jlpt: "N4" },
  { word: "始める", reading: "はじめる", jlpt: "N4" },
  { word: "終わる", reading: "おわる", jlpt: "N4" },
  { word: "続く", reading: "つづく", jlpt: "N4" },
  { word: "続ける", reading: "つづける", jlpt: "N4" },
  { word: "集まる", reading: "あつまる", jlpt: "N4" },
  { word: "集める", reading: "あつめる", jlpt: "N4" },
  { word: "運ぶ", reading: "はこぶ", jlpt: "N4" },
  { word: "送る", reading: "おくる", jlpt: "N4" },
  { word: "届く", reading: "とどく", jlpt: "N4" },
  { word: "届ける", reading: "とどける", jlpt: "N4" },
  { word: "受ける", reading: "うける", jlpt: "N4" },
  { word: "渡す", reading: "わたす", jlpt: "N4" },
  { word: "持つ", reading: "もつ", jlpt: "N4" },
  { word: "置く", reading: "おく", jlpt: "N4" },
  { word: "落とす", reading: "おとす", jlpt: "N4" },
  { word: "落ちる", reading: "おちる", jlpt: "N4" },
  { word: "上げる", reading: "あげる", jlpt: "N4" },
  { word: "上がる", reading: "あがる", jlpt: "N4" },
  { word: "下げる", reading: "さげる", jlpt: "N4" },
  { word: "下がる", reading: "さがる", jlpt: "N4" },
  { word: "開ける", reading: "あける", jlpt: "N4" },
  { word: "開く", reading: "ひらく", jlpt: "N4" },
  { word: "閉める", reading: "しめる", jlpt: "N4" },
  { word: "閉まる", reading: "しまる", jlpt: "N4" },
  { word: "入れる", reading: "いれる", jlpt: "N4" },
  { word: "入る", reading: "はいる", jlpt: "N4" },
  { word: "出す", reading: "だす", jlpt: "N4" },
  { word: "出る", reading: "でる", jlpt: "N4" },
  { word: "止める", reading: "とめる", jlpt: "N4" },
  { word: "止まる", reading: "とまる", jlpt: "N4" },
  { word: "起きる", reading: "おきる", jlpt: "N4" },
  { word: "寝る", reading: "ねる", jlpt: "N4" },
  { word: "住む", reading: "すむ", jlpt: "N4" },
  { word: "働く", reading: "はたらく", jlpt: "N4" },
  { word: "走る", reading: "はしる", jlpt: "N4" },
  { word: "歩く", reading: "あるく", jlpt: "N4" },
  { word: "泳ぐ", reading: "およぐ", jlpt: "N4" },
  { word: "遊ぶ", reading: "あそぶ", jlpt: "N4" },
  { word: "思う", reading: "おもう", jlpt: "N4" },
  { word: "考える", reading: "かんがえる", jlpt: "N4" },
  { word: "知る", reading: "しる", jlpt: "N4" },
  { word: "分かる", reading: "わかる", jlpt: "N4" },
  { word: "忘れる", reading: "わすれる", jlpt: "N4" },
  { word: "覚える", reading: "おぼえる", jlpt: "N4" },
  { word: "教える", reading: "おしえる", jlpt: "N4" },
  { word: "習う", reading: "ならう", jlpt: "N4" },

  // Nouns - society & daily life
  { word: "社会", reading: "しゃかい", jlpt: "N4" },
  { word: "経済", reading: "けいざい", jlpt: "N4" },
  { word: "政治", reading: "せいじ", jlpt: "N4" },
  { word: "文化", reading: "ぶんか", jlpt: "N4" },
  { word: "歴史", reading: "れきし", jlpt: "N4" },
  { word: "科学", reading: "かがく", jlpt: "N4" },
  { word: "技術", reading: "ぎじゅつ", jlpt: "N4" },
  { word: "教育", reading: "きょういく", jlpt: "N4" },
  { word: "環境", reading: "かんきょう", jlpt: "N4" },
  { word: "問題", reading: "もんだい", jlpt: "N4" },
  { word: "意見", reading: "いけん", jlpt: "N4" },
  { word: "理由", reading: "りゆう", jlpt: "N4" },
  { word: "方法", reading: "ほうほう", jlpt: "N4" },
  { word: "関係", reading: "かんけい", jlpt: "N4" },
  { word: "場合", reading: "ばあい", jlpt: "N4" },
  { word: "準備", reading: "じゅんび", jlpt: "N4" },
  { word: "予定", reading: "よてい", jlpt: "N4" },
  { word: "計画", reading: "けいかく", jlpt: "N4" },
  { word: "経験", reading: "けいけん", jlpt: "N4" },
  { word: "練習", reading: "れんしゅう", jlpt: "N4" },
  { word: "試験", reading: "しけん", jlpt: "N4" },
  { word: "授業", reading: "じゅぎょう", jlpt: "N4" },
  { word: "仕事", reading: "しごと", jlpt: "N4" },
  { word: "会議", reading: "かいぎ", jlpt: "N4" },
  { word: "旅行", reading: "りょこう", jlpt: "N4" },
  { word: "趣味", reading: "しゅみ", jlpt: "N4" },
  { word: "音楽", reading: "おんがく", jlpt: "N4" },
  { word: "映画", reading: "えいが", jlpt: "N4" },
  { word: "写真", reading: "しゃしん", jlpt: "N4" },
  { word: "料理", reading: "りょうり", jlpt: "N4" },

  // Adjectives - na-adjectives
  { word: "必要", reading: "ひつよう", jlpt: "N4" },
  { word: "大切", reading: "たいせつ", jlpt: "N4" },
  { word: "大事", reading: "だいじ", jlpt: "N4" },
  { word: "簡単", reading: "かんたん", jlpt: "N4" },
  { word: "複雑", reading: "ふくざつ", jlpt: "N4" },
  { word: "正確", reading: "せいかく", jlpt: "N4" },
  { word: "丁寧", reading: "ていねい", jlpt: "N4" },
  { word: "便利", reading: "べんり", jlpt: "N4" },
  { word: "不便", reading: "ふべん", jlpt: "N4" },
  { word: "危険", reading: "きけん", jlpt: "N4" },
  { word: "安全", reading: "あんぜん", jlpt: "N4" },
  { word: "有名", reading: "ゆうめい", jlpt: "N4" },
  { word: "特別", reading: "とくべつ", jlpt: "N4" },
  { word: "普通", reading: "ふつう", jlpt: "N4" },

  // i-adjectives
  { word: "難しい", reading: "むずかしい", jlpt: "N4" },
  { word: "易しい", reading: "やさしい", jlpt: "N4" },
  { word: "優しい", reading: "やさしい", jlpt: "N4" },
  { word: "厳しい", reading: "きびしい", jlpt: "N4" },
  { word: "楽しい", reading: "たのしい", jlpt: "N4" },
  { word: "悲しい", reading: "かなしい", jlpt: "N4" },
  { word: "嬉しい", reading: "うれしい", jlpt: "N4" },
  { word: "寂しい", reading: "さびしい", jlpt: "N4" },
  { word: "眠い", reading: "ねむい", jlpt: "N4" },
  { word: "痛い", reading: "いたい", jlpt: "N4" },
];

// Pitch accent minimal pairs and homophones (high search value)
const pitchPairs: SeoWord[] = [
  // Classic はし pairs
  { word: "橋", reading: "はし" },
  { word: "箸", reading: "はし" },
  { word: "端", reading: "はし" },

  // あめ pairs
  { word: "雨", reading: "あめ" },
  { word: "飴", reading: "あめ" },

  // かみ pairs
  { word: "神", reading: "かみ" },
  { word: "紙", reading: "かみ" },
  { word: "髪", reading: "かみ" },

  // はな pairs
  { word: "花", reading: "はな" },
  { word: "鼻", reading: "はな" },

  // かわ pairs
  { word: "川", reading: "かわ" },
  { word: "皮", reading: "かわ" },
  { word: "革", reading: "かわ" },

  // いし pairs
  { word: "石", reading: "いし" },
  { word: "意志", reading: "いし" },
  { word: "医師", reading: "いし" },

  // きる pairs
  { word: "切る", reading: "きる" },
  { word: "着る", reading: "きる" },

  // かう pairs
  { word: "買う", reading: "かう" },
  { word: "飼う", reading: "かう" },

  // さけ pairs
  { word: "酒", reading: "さけ" },
  { word: "鮭", reading: "さけ" },

  // くも pairs
  { word: "雲", reading: "くも" },
  { word: "蜘蛛", reading: "くも" },

  // かき pairs
  { word: "柿", reading: "かき" },
  { word: "牡蠣", reading: "かき" },
  { word: "垣", reading: "かき" },

  // あき pairs
  { word: "秋", reading: "あき" },
  { word: "空き", reading: "あき" },

  // にわ pairs
  { word: "庭", reading: "にわ" },
  { word: "鶏", reading: "にわとり" },

  // Other commonly confused
  { word: "日本", reading: "にほん" },
  { word: "日本語", reading: "にほんご" },
  { word: "東京", reading: "とうきょう" },
  { word: "大阪", reading: "おおさか" },
  { word: "京都", reading: "きょうと" },
];

// Common expressions and greetings
const expressions: SeoWord[] = [
  { word: "おはよう", reading: "おはよう" },
  { word: "おはようございます", reading: "おはようございます" },
  { word: "こんにちは", reading: "こんにちは" },
  { word: "こんばんは", reading: "こんばんは" },
  { word: "さようなら", reading: "さようなら" },
  { word: "ありがとう", reading: "ありがとう" },
  { word: "ありがとうございます", reading: "ありがとうございます" },
  { word: "すみません", reading: "すみません" },
  { word: "ごめんなさい", reading: "ごめんなさい" },
  { word: "お願いします", reading: "おねがいします" },
  { word: "いただきます", reading: "いただきます" },
  { word: "ごちそうさま", reading: "ごちそうさま" },
  { word: "お疲れ様", reading: "おつかれさま" },
  { word: "よろしく", reading: "よろしく" },
  { word: "はじめまして", reading: "はじめまして" },
];

// Combine and deduplicate
const allWords = [...jlptN5, ...jlptN4, ...pitchPairs, ...expressions];
const seen = new Set<string>();

export const seoWords: SeoWord[] = allWords.filter((w) => {
  if (seen.has(w.word)) return false;
  seen.add(w.word);
  return true;
});

// Export just the words for sitemap
export const seoWordList: string[] = seoWords.map((w) => w.word);
