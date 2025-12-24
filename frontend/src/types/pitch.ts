export interface WordPitch {
  surface: string;
  reading: string;
  accent_type: number | null;
  mora_count: number;
  morae: string[];
  pitch_pattern: string[];
  part_of_speech: string;
  origin: string | null;
  origin_jp: string | null;
  lemma: string | null;
}

export interface AnalyzeResponse {
  text: string;
  words: WordPitch[];
}

export type AccentType = "heiban" | "atamadaka" | "nakadaka" | "odaka" | "unknown";

export function getAccentTypeName(accentType: number | null, moraCount: number): AccentType {
  if (accentType === null) return "unknown";
  if (accentType === 0) return "heiban";
  if (accentType === 1) return "atamadaka";
  if (accentType === moraCount) return "odaka";
  return "nakadaka";
}

export function getAccentLabel(accentType: number | null, moraCount: number, partOfSpeech?: string): string {
  if (accentType === null) {
    // Show "Particle" for 助詞, 助動詞 instead of "Unknown"
    if (partOfSpeech === "助詞") return "Particle (助詞)";
    if (partOfSpeech === "助動詞") return "Auxiliary (助動詞)";
    return "Unknown";
  }
  if (accentType === 0) return "平板 (Heiban)";
  if (accentType === 1) return "頭高 (Atamadaka)";
  if (accentType === moraCount) return "尾高 (Odaka)";
  return "中高 (Nakadaka)";
}
