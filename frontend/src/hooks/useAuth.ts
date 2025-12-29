"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Use singleton - stable reference across renders
  const supabase = useMemo(() => getSupabase(), []);

  useEffect(() => {
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
    const base = `${window.location.origin}/auth/callback`;
    return next ? `${base}?next=${encodeURIComponent(next)}` : base;
  }, []);

  const signInWithGoogle = useCallback(
    (next?: string) =>
      supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getRedirectUrl(next) },
      }),
    [supabase, getRedirectUrl]
  );

  const signInWithGithub = useCallback(
    (next?: string) =>
      supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: getRedirectUrl(next) },
      }),
    [supabase, getRedirectUrl]
  );

  const signOut = useCallback(() => supabase.auth.signOut(), [supabase]);

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithGithub,
    signOut,
  };
}
