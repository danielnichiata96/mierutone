"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import {
  getHistory,
  getStats,
  type HistoryResponse,
  type StatsResponse,
} from "@/lib/api";
import Link from "next/link";

function StatCard({
  label,
  value,
  color = "bg-primary-300",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="riso-card p-6 text-center">
      <div
        className={`w-12 h-12 ${color} rounded-full mx-auto mb-3 flex items-center justify-center`}
      >
        <span className="text-xl font-bold text-ink-black">{value}</span>
      </div>
      <p className="text-sm text-ink-black/60">{label}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryResponse>({
    analyses: [],
    scores: [],
  });
  const [stats, setStats] = useState<StatsResponse>({
    total_analyses: 0,
    total_comparisons: 0,
    average_score: 0,
  });
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount (auth is handled by layout)
  useEffect(() => {
    setLoadingData(true);
    setError(null);

    Promise.all([getHistory(), getStats()])
      .then(([historyData, statsData]) => {
        setHistory(historyData);
        setStats(statsData);
      })
      .catch((err) => {
        console.error("Failed to load dashboard data:", err);
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
      .finally(() => {
        setLoadingData(false);
      });
  }, []);

  return (
    <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
        {/* Header */}
        <section className="mb-8">
          <h1 className="font-display text-3xl font-bold text-ink-black mb-2">
            Dashboard
          </h1>
          <p className="text-ink-black/60">
            Welcome back, {user?.user_metadata?.full_name || "learner"}!
          </p>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Analyses"
            value={stats.total_analyses}
            color="bg-primary-300"
          />
          <StatCard
            label="Practice Sessions"
            value={stats.total_comparisons}
            color="bg-secondary-300"
          />
          <StatCard
            label="Avg Score"
            value={stats.average_score > 0 ? `${stats.average_score}%` : "-"}
            color="bg-accent-300"
          />
        </section>

        {loadingData ? (
          <div className="text-center py-12 text-ink-black/60">
            Loading your history...
          </div>
        ) : error ? (
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
          <>
            {/* Recent Activity */}
            <section className="riso-card p-6 mb-6">
              <h2 className="font-display text-xl font-bold text-ink-black mb-4">
                Recent Analyses
              </h2>

              {history.analyses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-ink-black/60 mb-4">
                    No analyses yet. Start practicing!
                  </p>
                  <Link href="/" className="riso-button-primary">
                    Analyze Text
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.analyses.slice(0, 10).map((analysis) => (
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
                      <span className="text-xs text-ink-black/40 ml-4">
                        {formatDate(analysis.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Scores */}
            <section className="riso-card p-6">
              <h2 className="font-display text-xl font-bold text-ink-black mb-4">
                Practice Scores
              </h2>

              {history.scores.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-ink-black/60 mb-4">
                    No practice sessions yet. Try recording your pronunciation!
                  </p>
                  <Link href="/" className="riso-button-primary">
                    Start Practice
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.scores.slice(0, 10).map((score) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between py-3 border-b border-ink-black/5 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink-black truncate">
                          {score.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 ml-4">
                        <span
                          className={`text-sm font-bold ${
                            score.score >= 80
                              ? "text-green-600"
                              : score.score >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {score.score}%
                        </span>
                        <span className="text-xs text-ink-black/40">
                          {formatDate(score.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
  );
}
