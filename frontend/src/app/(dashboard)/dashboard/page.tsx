"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  getHistory,
  getDashboardStats,
  type HistoryResponse,
} from "@/lib/api";
import type { StatsResponse } from "@/types/user";
import { RetentionWarningBanner } from "@/components/RetentionWarningBanner";
import Link from "next/link";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-ink-black/10 rounded ${className}`} />
  );
}

function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="riso-card p-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary-300/30 rounded-xl flex items-center justify-center text-primary-600">
          {icon}
        </div>
        <div>
          {loading ? (
            <>
              <Skeleton className="h-7 w-12 mb-1" />
              <Skeleton className="h-4 w-20" />
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-ink-black">{value}</p>
              <p className="text-sm text-ink-black/60">{label}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return format(date, "'Today at' h:mm a");
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return format(date, "MMM d, yyyy");
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryResponse>({
    analyses: [],
    scores: [],
  });
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    // Load stats
    getDashboardStats()
      .then(setStats)
      .catch((err) => {
        console.error("Failed to load stats:", err);
        toast.error("Failed to load stats");
      })
      .finally(() => setLoadingStats(false));

    // Load history
    getHistory(10)
      .then(setHistory)
      .catch((err) => {
        console.error("Failed to load history:", err);
        const errorMsg = err.message || String(err);
        if (errorMsg.includes("401")) {
          setError("Session expired. Please sign out and back in.");
        } else if (errorMsg.includes("500")) {
          setError("Server error. Please try again later.");
        } else if (errorMsg.includes("Failed to fetch")) {
          setError("Cannot reach server. Check your connection.");
        } else {
          setError(`Error: ${errorMsg}`);
        }
      })
      .finally(() => setLoadingHistory(false));
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "learner";

  return (
    <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
      {/* Retention Warning */}
      <RetentionWarningBanner className="mb-6 rounded-lg" />

      {/* Header */}
      <section className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-black mb-2">
          Dashboard
        </h1>
        <p className="text-ink-black/60">
          Welcome back, {displayName}!
        </p>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Analyses"
          value={stats?.total_analyses ?? 0}
          loading={loadingStats}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Comparisons"
          value={stats?.total_comparisons ?? 0}
          loading={loadingStats}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          }
        />
        <StatCard
          label="Avg Score"
          value={stats?.avg_score != null ? `${Math.round(stats.avg_score)}%` : "-"}
          loading={loadingStats}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label="Unique Texts"
          value={stats?.unique_texts ?? 0}
          loading={loadingStats}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          }
        />
      </section>

      {error ? (
        <div className="riso-card p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="riso-button-primary"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Analyses */}
          <section className="riso-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-ink-black">
                Recent Analyses
              </h2>
              <Link href="/history" className="text-sm text-primary-600 hover:underline">
                View all
              </Link>
            </div>

            {loadingHistory ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="py-3">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : history.analyses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-ink-black/60 mb-4">
                  No analyses yet. Start practicing!
                </p>
                <Link href="/" className="riso-button-primary">
                  Analyze Text
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {history.analyses.slice(0, 5).map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between py-3 border-b border-ink-black/5 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-black truncate">
                        {analysis.text}
                      </p>
                      <p className="text-xs text-ink-black/40">
                        {analysis.word_count} words
                      </p>
                    </div>
                    <span className="text-xs text-ink-black/40 ml-4 flex-shrink-0">
                      {formatRelativeDate(analysis.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Scores */}
          <section className="riso-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-ink-black">
                Practice Scores
              </h2>
              <Link href="/history" className="text-sm text-primary-600 hover:underline">
                View all
              </Link>
            </div>

            {loadingHistory ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            ) : history.scores.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-ink-black/60 mb-4">
                  No practice sessions yet.
                </p>
                <Link href="/" className="riso-button-primary">
                  Start Practice
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {history.scores.slice(0, 5).map((score) => (
                  <div
                    key={score.id}
                    className="flex items-center justify-between py-3 border-b border-ink-black/5 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-black truncate">
                        {score.text}
                      </p>
                      <p className="text-xs text-ink-black/40">
                        {formatRelativeDate(score.created_at)}
                      </p>
                    </div>
                    <span
                      className={`ml-4 px-2 py-0.5 rounded-full text-xs font-medium ${
                        score.score >= 80
                          ? "bg-green-100 text-green-700"
                          : score.score >= 60
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {score.score}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Quick Actions */}
      <section className="mt-8">
        <div className="riso-card p-6 bg-gradient-to-r from-primary-300/20 to-secondary-300/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-bold text-ink-black">
                Ready to practice?
              </h3>
              <p className="text-sm text-ink-black/60">
                Analyze Japanese text and improve your pitch accent.
              </p>
            </div>
            <Link href="/" className="riso-button-primary whitespace-nowrap">
              Start Practicing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
