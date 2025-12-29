"use client";

import Link from "next/link";
import { AudioPlayButton } from "./AudioPlayButton";

interface ExampleLinkProps {
  word: string;
  reading?: string;
  accent?: string;
  meaning: string;
  pattern?: string;
  className?: string;
  showAudio?: boolean;
}

export function ExampleLink({
  word,
  reading,
  accent,
  meaning,
  pattern,
  className = "",
  showAudio = true,
}: ExampleLinkProps) {
  const displayText = reading && accent ? `${word} (${reading}${accent})` : word;

  return (
    <Link
      href={`/?text=${encodeURIComponent(word)}`}
      className={`p-3 bg-ink-black/5 rounded-riso hover:bg-primary-300/20 hover:border-primary-500 border-2 border-transparent transition-all group block relative ${className}`}
      title="Click to analyze"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold group-hover:text-primary-500 transition-colors">
            {displayText}
          </p>
          <p className="text-ink-black/60">{meaning}</p>
          {pattern && (
            <p className="font-mono text-xs mt-1">{pattern}</p>
          )}
        </div>
        {showAudio && (
          <AudioPlayButton text={word} size="sm" />
        )}
      </div>
      <p className="text-[10px] text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
        Analyze →
      </p>
    </Link>
  );
}
