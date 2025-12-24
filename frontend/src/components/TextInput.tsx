"use client";

import { useState } from "react";

interface TextInputProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
}

export function TextInput({ onAnalyze, isLoading }: TextInputProps) {
  const [text, setText] = useState("昨日は橋を渡って箸でご飯を食べました");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAnalyze(text);
    }
  };

  const handleExampleClick = () => {
    const example = "昨日は橋を渡って箸でご飯を食べました";
    setText(example);
    onAnalyze(example);
  };

  return (
    <form onSubmit={handleSubmit} className="riso-card space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="日本語のテキストを入力..."
          rows={6}
          className="w-full bg-transparent border-0 resize-none focus:ring-0 text-lg leading-relaxed text-ink-black placeholder:text-ink-black/30 font-sans p-0 focus:outline-none"
          style={{ minHeight: "150px" }}
        />
        <div className="absolute bottom-0 right-0 text-xs text-ink-black/30 font-mono pointer-events-none">
          {text.length} chars
        </div>
      </div>

      <div className="pt-4 border-t-2 border-ink-black/10 flex flex-col gap-3">
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="riso-button w-full justify-center text-lg py-3"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : (
            "Analyze Pitch"
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-sm text-ink-black/50 font-medium">
          <span>Or try:</span>
          <button
            type="button"
            onClick={handleExampleClick}
            className="text-primary-500 hover:text-ink-black underline decoration-dotted underline-offset-4 transition-colors"
          >
            Standard Example
          </button>
        </div>
      </div>
    </form>
  );
}
