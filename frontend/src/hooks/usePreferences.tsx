"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { getPreferences } from "@/lib/api";
import type { PreferencesResponse } from "@/types/user";
import { useAuth } from "./useAuth";

// Default preferences for unauthenticated users or before loading
const DEFAULT_PREFERENCES: PreferencesResponse = {
  default_voice: "female1",
  playback_speed: 1.0,
  show_accent_numbers: true,
  show_part_of_speech: false,
  show_confidence: true,
};

interface PreferencesContextValue {
  preferences: PreferencesResponse;
  loading: boolean;
  refresh: () => Promise<void>;
  updateLocal: (updates: Partial<PreferencesResponse>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: DEFAULT_PREFERENCES,
  loading: false,
  refresh: async () => {},
  updateLocal: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<PreferencesResponse>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);

  const loadPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      return;
    }

    setLoading(true);
    try {
      const prefs = await getPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error("Failed to load preferences:", err);
      // Keep defaults on error
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load preferences when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Update local state without API call (for immediate UI feedback)
  const updateLocal = useCallback((updates: Partial<PreferencesResponse>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        loading,
        refresh: loadPreferences,
        updateLocal,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

/**
 * Hook to access user preferences.
 * Returns defaults for unauthenticated users.
 */
export function usePreferences() {
  return useContext(PreferencesContext);
}
