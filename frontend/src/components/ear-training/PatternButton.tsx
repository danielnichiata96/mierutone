"use client";

import type { PitchPattern } from "@/types/quiz";
import { PATTERN_INFO } from "@/types/quiz";

interface PatternButtonProps {
  pattern: PitchPattern;
  isSelected: boolean;
  isCorrect: boolean | null;
  disabled: boolean;
  onClick: () => void;
}

export function PatternButton({
  pattern,
  isSelected,
  isCorrect,
  disabled,
  onClick,
}: PatternButtonProps) {
  const info = PATTERN_INFO[pattern];

  const getButtonClass = () => {
    const base = "w-full p-4 rounded-riso border-2 transition-all duration-200 text-left";

    if (isCorrect === true) {
      return `${base} border-secondary-500 bg-secondary-300/30 shadow-riso`;
    }
    if (isCorrect === false && isSelected) {
      return `${base} border-accent-500 bg-accent-300/30`;
    }
    if (isSelected) {
      return `${base} border-primary-500 bg-primary-300/20 shadow-riso`;
    }
    if (disabled) {
      return `${base} border-ink-black/10 bg-paper-cream/50 opacity-60 cursor-not-allowed`;
    }
    return `${base} border-ink-black/20 bg-paper-white hover:border-primary-500 hover:bg-primary-300/10 cursor-pointer`;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={getButtonClass()}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-bold text-ink-black">
            {info.labelJp}
            <span className="ml-2 text-sm font-normal text-ink-black/60">
              {info.label}
            </span>
          </div>
          <div className="text-xs text-ink-black/50 mt-1">{info.description}</div>
        </div>
        {isCorrect === true && (
          <span className="text-secondary-500 font-bold text-lg">✓</span>
        )}
        {isCorrect === false && isSelected && (
          <span className="text-accent-500 font-bold text-lg">✗</span>
        )}
      </div>
    </button>
  );
}
