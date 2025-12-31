import { toHiragana } from "wanakana";

/**
 * Normalize text by converting only ASCII romaji to hiragana.
 * Preserves katakana, hiragana, kanji, and punctuation.
 *
 * Note: Punctuation like - . , stays as-is (not converted to ー 。 、).
 * This differs slightly from wanakana.bind IME mode, but correct kana
 * conversion (nn→ん, n before consonant→ん) is more important for analysis.
 */
export function normalizeInput(text: string): string {
  let result = "";
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // Start of romaji sequence: ASCII letters or apostrophe (for n'ya etc.)
    if (/[a-zA-Z]/.test(char)) {
      let romajiSegment = "";
      // Collect letters and apostrophe (syllable separator)
      while (i < text.length && /[a-zA-Z']/.test(text[i])) {
        romajiSegment += text[i];
        i++;
      }
      // Standard toHiragana handles nn→ん, n at word end→ん correctly
      result += toHiragana(romajiSegment);
    } else {
      // Preserve everything else: katakana, hiragana, kanji, punctuation
      result += char;
      i++;
    }
  }

  return result;
}
