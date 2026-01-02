"use client";

import { useState, useEffect, useRef } from "react";
import { bind, unbind } from "wanakana";
import { useSearchHistory, type HistoryItem } from "@/hooks/useSearchHistory";
import { normalizeInput } from "@/lib/normalizeInput";

interface TextInputProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
  initialValue?: string | null;
  onInputStart?: () => void;
}

export function TextInput({ onAnalyze, isLoading, initialValue, onInputStart }: TextInputProps) {
  const [text, setText] = useState("昨日は橋を渡って箸でご飯を食べました");
  const [showHistory, setShowHistory] = useState(false);
  const { history, addToHistory } = useSearchHistory();
  const historyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Bind wanakana for real-time romaji → hiragana conversion
  // IMEMode: false = immediate conversion (nn not required for ん before vowel)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      bind(textarea, { IMEMode: false });
      return () => unbind(textarea);
    }
  }, []);

  // Update text when initialValue changes (from query param) - normalize romaji
  useEffect(() => {
    if (initialValue) {
      setText(normalizeInput(initialValue));
    }
  }, [initialValue]);

  // Close history dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed) {
      addToHistory(trimmed);
      onAnalyze(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to submit
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const trimmed = text.trim();
      if (trimmed && !isLoading) {
        addToHistory(trimmed);
        onAnalyze(trimmed);
      }
    }
  };

  const handleExampleClick = () => {
    if (isLoading) return;
    const example = "昨日は橋を渡って箸でご飯を食べました";
    setText(example);
    addToHistory(example);
    onAnalyze(example);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    if (isLoading) return;
    const normalized = normalizeInput(item.text);
    setText(normalized);
    setShowHistory(false);
    addToHistory(normalized);
    onAnalyze(normalized);
  };

  return (
    <form onSubmit={handleSubmit} className="riso-card space-y-4">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onInputStart?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder="日本語のテキストを入力... (type romaji for auto-conversion)"
          rows={6}
          className="w-full bg-transparent border-0 resize-none focus:ring-0 text-lg leading-relaxed text-ink-black placeholder:text-ink-black/30 font-sans p-0 focus:outline-none"
          style={{ minHeight: "150px" }}
        />
        <div className="absolute bottom-0 right-0 text-xs text-ink-black/30 font-mono pointer-events-none">
          {text.length} chars
        </div>
      </div>

      <div className="pt-4 border-t-2 border-ink-black/10 flex flex-col gap-3">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="riso-button flex-1 justify-center text-lg py-3"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              "Analyze"
            )}
          </button>

          {/* History dropdown */}
          {history.length > 0 && (
            <div className="relative" ref={historyRef}>
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="riso-button-secondary px-3 py-3"
                title="Recent searches"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              {showHistory && (
                <div className="absolute right-0 mt-2 w-64 bg-paper-white border-2 border-ink-black/10 rounded-riso shadow-riso py-1 z-50 max-h-60 overflow-y-auto">
                  <div className="px-3 py-1.5 text-xs text-ink-black/40 font-medium uppercase tracking-wide">
                    Recent
                  </div>
                  {history.map((item) => (
                    <button
                      key={`${item.timestamp}-${item.text.slice(0, 10)}`}
                      type="button"
                      onClick={() => handleHistorySelect(item)}
                      className="w-full text-left px-3 py-2 text-sm text-ink-black/80 hover:bg-ink-black/5 truncate disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {item.text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-ink-black/40">
          <span className="font-mono hidden sm:inline">⌘/Ctrl + Enter</span>
          <div className="flex items-center gap-2 font-medium">
            <span>Try:</span>
            <button
              type="button"
              onClick={handleExampleClick}
              className="text-primary-500 hover:text-ink-black underline decoration-dotted underline-offset-4 transition-colors"
            >
              Example
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
