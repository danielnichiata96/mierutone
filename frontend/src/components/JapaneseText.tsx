"use client";

import { useMemo } from "react";
import { loadDefaultJapaneseParser } from "budoux";

// Initialize parser once (lazy loaded)
let parser: ReturnType<typeof loadDefaultJapaneseParser> | null = null;

function getParser() {
  if (!parser) {
    parser = loadDefaultJapaneseParser();
  }
  return parser;
}

interface JapaneseTextProps {
  children: string;
  className?: string;
  as?: "span" | "p" | "div";
}

/**
 * JapaneseText component that uses BudouX for proper line breaking.
 *
 * BudouX inserts word boundary opportunities so Japanese text wraps
 * at grammatically correct positions instead of mid-word.
 *
 * @example
 * <JapaneseText>今日はとても暑いですね</JapaneseText>
 * // Wraps at: 今日は / とても / 暑いですね
 */
export function JapaneseText({
  children,
  className = "",
  as: Component = "span"
}: JapaneseTextProps) {
  const segments = useMemo(() => {
    if (!children || typeof children !== "string") return [children];
    return getParser().parse(children);
  }, [children]);

  return (
    <Component className={className} style={{ wordBreak: "keep-all", overflowWrap: "anywhere" }}>
      {segments.map((segment, i) => (
        <span key={i}>
          {segment}
          {i < segments.length - 1 && <wbr />}
        </span>
      ))}
    </Component>
  );
}

/**
 * Hook to parse Japanese text with BudouX.
 * Returns array of segments that can be joined with <wbr> elements.
 *
 * @example
 * const segments = useJapaneseSegments("今日はとても暑いですね");
 * // ["今日は", "とても", "暑いですね"]
 */
export function useJapaneseSegments(text: string): string[] {
  return useMemo(() => {
    if (!text) return [];
    return getParser().parse(text);
  }, [text]);
}
