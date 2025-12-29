"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mierutone_history";
const MAX_HISTORY = 10;

export interface HistoryItem {
  text: string;
  timestamp: number;
}

export function useSearchHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate shape: must be array of {text: string, timestamp: number}
        if (
          Array.isArray(parsed) &&
          parsed.every(
            (item) =>
              typeof item === "object" &&
              item !== null &&
              typeof item.text === "string" &&
              typeof item.timestamp === "number"
          )
        ) {
          setHistory(parsed);
        } else {
          // Corrupt data, clear it
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Ignore localStorage errors (SSR, private mode, etc.)
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }, []);

  const addToHistory = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setHistory((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((item) => item.text !== trimmed);
      // Add new item at the start
      const updated = [{ text: trimmed, timestamp: Date.now() }, ...filtered].slice(
        0,
        MAX_HISTORY
      );

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }

      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return { history, addToHistory, clearHistory };
}
