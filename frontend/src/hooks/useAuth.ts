"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Use singleton - stable reference across renders
  const supabase = useMemo(() => getSupabase(), []);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    // Skip if Supabase is not configured
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Client-only: uses window.location
  const getRedirectUrl = useCallback((next?: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const base = `${origin}/auth/callback`;
    return next ? `${base}?next=${encodeURIComponent(next)}` : base;
  }, []);

  const signInWithGoogle = useCallback(
    (next?: string) => {
      if (!supabase) return Promise.resolve({ data: null, error: new Error("Supabase not configured") });
      return supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getRedirectUrl(next) },
      });
    },
    [supabase, getRedirectUrl]
  );

  const signInWithGithub = useCallback(
    (next?: string) => {
      if (!supabase) return Promise.resolve({ data: null, error: new Error("Supabase not configured") });
      return supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: getRedirectUrl(next) },
      });
    },
    [supabase, getRedirectUrl]
  );

  const signOut = useCallback(() => {
    if (!supabase) return Promise.resolve({ error: null });
    return supabase.auth.signOut();
  }, [supabase]);

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithGithub,
    signOut,
  };
}
