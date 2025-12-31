import { normalizeInput } from "./normalizeInput";

describe("normalizeInput", () => {
  describe("romaji → hiragana conversion", () => {
    it("converts basic romaji", () => {
      expect(normalizeInput("konnichiwa")).toBe("こんにちわ");
      expect(normalizeInput("ohayou")).toBe("おはよう");
      expect(normalizeInput("arigatou")).toBe("ありがとう");
    });

    it("handles n before vowel correctly (no IME mode)", () => {
      expect(normalizeInput("minna")).toBe("みんな");
      expect(normalizeInput("kan")).toBe("かん");
      expect(normalizeInput("kinyoubi")).toBe("きにょうび");
    });

    it("handles apostrophe for syllable separation", () => {
      expect(normalizeInput("shin'ya")).toBe("しんや");
      expect(normalizeInput("kan'i")).toBe("かんい");
    });

    it("handles double consonants", () => {
      expect(normalizeInput("kitto")).toBe("きっと");
      expect(normalizeInput("gakkou")).toBe("がっこう");
    });
  });

  describe("preservation", () => {
    it("preserves katakana", () => {
      expect(normalizeInput("コンピュータ")).toBe("コンピュータ");
      expect(normalizeInput("カタカナ")).toBe("カタカナ");
    });

    it("preserves hiragana", () => {
      expect(normalizeInput("ひらがな")).toBe("ひらがな");
      expect(normalizeInput("こんにちは")).toBe("こんにちは");
    });

    it("preserves kanji", () => {
      expect(normalizeInput("日本語")).toBe("日本語");
      expect(normalizeInput("漢字")).toBe("漢字");
    });

    it("preserves punctuation between Japanese text", () => {
      expect(normalizeInput("あ-い")).toBe("あ-い");
      expect(normalizeInput("。、！？")).toBe("。、！？");
    });
  });

  describe("mixed content", () => {
    it("converts only romaji portions in mixed text", () => {
      expect(normalizeInput("今日はohayou")).toBe("今日はおはよう");
    });

    it("handles URL-style queries with katakana", () => {
      expect(normalizeInput("コンピュータ")).toBe("コンピュータ");
    });

    it("handles URL-style queries with romaji", () => {
      expect(normalizeInput("konnichiwa")).toBe("こんにちわ");
    });
  });
});
