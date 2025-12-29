/**
 * Pitch info for a compound word component.
 */
export interface ComponentPitch {
  surface: string;
  reading: string;
  accent_type: number | null;
  mora_count: number;
  part_of_speech: string;  // For display (名詞, 動詞, etc.)
  reliable: boolean;       // True if source is trustworthy for prediction
}

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
  source:
    | "dictionary"          // Exact match in Kanjium
    | "dictionary_lemma"    // Matched via lemma in Kanjium
    | "dictionary_reading"  // Matched by reading only in Kanjium
    | "dictionary_unidic"   // Matched via UniDic only (Kanjium had no entry)
    | "dictionary_proper"   // Proper noun in Kanjium
    | "unidic_proper"       // Proper noun in UniDic only
    | "rule"                // Rule-based fallback
    | "particle"            // Particle (助詞/助動詞)
    | "proper_noun"         // Proper noun not in any dictionary
    | "compound_rule"       // Compound accent predicted using McCawley rules
    | "unknown";
  confidence: "high" | "medium" | "low";
  warning: string | null;
  // Compound word fields
  is_compound: boolean;
  components: ComponentPitch[] | null;
}

export function getSourceLabel(source: WordPitch["source"]): string {
  switch (source) {
    case "dictionary": return "Dictionary";
    case "dictionary_lemma": return "Dictionary (via lemma)";
    case "dictionary_reading": return "Dictionary (reading only)";
    case "dictionary_unidic": return "UniDic only";
    case "dictionary_proper": return "Proper Noun (Kanjium)";
    case "unidic_proper": return "Proper Noun (UniDic)";
    case "rule": return "Rule-based";
    case "particle": return "Particle (助詞)";
    case "proper_noun": return "Proper Noun (固有名詞)";
    case "compound_rule": return "Compound (predicted)";
    case "unknown": return "Unknown";
  }
}

/**
 * Get CSS border class for confidence level (for non-SVG elements).
 * See lib/colors.ts for SVG stroke styles.
 */
export function getConfidenceBorderClass(confidence: WordPitch["confidence"]): string {
  switch (confidence) {
    case "high": return "border-solid";
    case "medium": return "border-dashed";
    case "low": return "border-dotted";
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
