"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve all query params when redirecting
    const params = searchParams.toString();
    router.replace(params ? `/?${params}` : "/");
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-paper-white flex items-center justify-center">
      <div className="animate-pulse text-ink-black/40">Redirecting...</div>
    </main>
  );
}

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-paper-white flex items-center justify-center">
          <div className="animate-pulse text-ink-black/40">Redirecting...</div>
        </main>
      }
    >
      <RedirectHandler />
    </Suspense>
  );
}
