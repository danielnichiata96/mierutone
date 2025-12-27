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
  // Transparency fields
  source: "dictionary" | "dictionary_lemma" | "dictionary_reading" | "dictionary_proper" | "rule" | "particle" | "proper_noun" | "unknown";
  confidence: "high" | "medium" | "low";
  warning: string | null;
}

export function getSourceLabel(source: WordPitch["source"]): string {
  switch (source) {
    case "dictionary": return "Dictionary";
    case "dictionary_lemma": return "Dictionary (via lemma)";
    case "dictionary_reading": return "Dictionary (reading only)";
    case "dictionary_proper": return "Proper Noun (in dict)";
    case "rule": return "Rule-based";
    case "particle": return "Particle (助詞)";
    case "proper_noun": return "Proper Noun (固有名詞)";
    case "unknown": return "Unknown";
  }
}

export function getConfidenceColor(confidence: WordPitch["confidence"], source?: WordPitch["source"]): string {
  // Particles get purple color
  if (source === "particle") return "text-violet-600";
  // Proper nouns get amber color (both dictionary_proper and proper_noun)
  if (source === "proper_noun" || source === "dictionary_proper") return "text-amber-600";
  switch (confidence) {
    case "high": return "text-green-600";
    case "medium": return "text-yellow-600";
    case "low": return "text-red-500";
  }
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
