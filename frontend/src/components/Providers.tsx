"use client";

import { PreferencesProvider } from "@/hooks/usePreferences";

export function Providers({ children }: { children: React.ReactNode }) {
  return <PreferencesProvider>{children}</PreferencesProvider>;
}
