import type { QuizWord } from "@/types/quiz";

export const quizWords: QuizWord[] = [
  // Heiban - Flat pattern
  { word: "桜", reading: "さくら", meaning: "cherry blossom", pattern: "heiban" },
  { word: "友達", reading: "ともだち", meaning: "friend", pattern: "heiban" },
  { word: "電話", reading: "でんわ", meaning: "telephone", pattern: "heiban" },
  { word: "言葉", reading: "ことば", meaning: "word/language", pattern: "heiban" },
  { word: "窓", reading: "まど", meaning: "window", pattern: "heiban" },
  { word: "鼻", reading: "はな", meaning: "nose", pattern: "heiban" }, // Corrected from Odaka

  // Atamadaka - Head-high pattern
  { word: "箸", reading: "はし", meaning: "chopsticks", pattern: "atamadaka" },
  { word: "猫", reading: "ねこ", meaning: "cat", pattern: "atamadaka" },
  { word: "命", reading: "いのち", meaning: "life", pattern: "atamadaka" },
  { word: "秋", reading: "あき", meaning: "autumn", pattern: "atamadaka" },
  { word: "朝", reading: "あさ", meaning: "morning", pattern: "atamadaka" },

  // Nakadaka - Middle-high pattern (drop in the middle, before last mora)
  { word: "卵", reading: "たまご", meaning: "egg", pattern: "nakadaka" },
  { word: "先生", reading: "せんせい", meaning: "teacher", pattern: "nakadaka" },
  { word: "果物", reading: "くだもの", meaning: "fruit", pattern: "nakadaka" },
  { word: "お菓子", reading: "おかし", meaning: "sweets", pattern: "nakadaka" },
  { word: "お化け", reading: "おばけ", meaning: "ghost", pattern: "nakadaka" },

  // Odaka - Tail-high pattern
  { word: "橋", reading: "はし", meaning: "bridge", pattern: "odaka" },
  { word: "山", reading: "やま", meaning: "mountain", pattern: "odaka" }, // Verified Correct
  { word: "川", reading: "かわ", meaning: "river", pattern: "odaka" }, // Verified Correct
  { word: "花", reading: "はな", meaning: "flower", pattern: "odaka" },
  { word: "男", reading: "おとこ", meaning: "man", pattern: "odaka" }, // Corrected from Nakadaka
  { word: "女", reading: "おんな", meaning: "woman", pattern: "odaka" }, // Corrected from Nakadaka
  { word: "頭", reading: "あたま", meaning: "head", pattern: "odaka" }, // Corrected from Nakadaka
];

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
