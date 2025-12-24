export type PitchPattern = "heiban" | "atamadaka" | "nakadaka" | "odaka";

export interface QuizWord {
  word: string;
  reading: string;
  meaning: string;
  pattern: PitchPattern;
  audioUrl?: string;
}

export interface QuizState {
  currentIndex: number;
  score: number;
  answered: boolean;
  selectedAnswer: PitchPattern | null;
  showResults: boolean;
}

export const PATTERN_INFO: Record<PitchPattern, { label: string; labelJp: string; description: string; color: string }> = {
  heiban: {
    label: "Heiban",
    labelJp: "平板",
    description: "Flat - Low start, stays high",
    color: "secondary",
  },
  atamadaka: {
    label: "Atamadaka",
    labelJp: "頭高",
    description: "Head-high - Drops after first mora",
    color: "accent",
  },
  nakadaka: {
    label: "Nakadaka",
    labelJp: "中高",
    description: "Middle-high - Drops in the middle",
    color: "primary",
  },
  odaka: {
    label: "Odaka",
    labelJp: "尾高",
    description: "Tail-high - Drops after the word",
    color: "energy",
  },
};
