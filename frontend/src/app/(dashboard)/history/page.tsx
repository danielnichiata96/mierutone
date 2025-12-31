"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { getPaginatedHistory } from "@/lib/api";
import type { PaginatedHistoryItem, PaginatedHistoryResponse } from "@/types/user";

type HistoryType = "analysis" | "comparison";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-ink-black/10 rounded ${className}`} />
  );
}

function EmptyState({ type }: { type: HistoryType }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ink-black/5 mb-4">
        {type === "analysis" ? (
          <svg className="w-8 h-8 text-ink-black/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-ink-black/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </div>
      <p className="text-ink-black/60">
        No {type === "analysis" ? "analyses" : "comparisons"} yet.
      </p>
      <p className="text-sm text-ink-black/40 mt-1">
        Start practicing to build your history!
      </p>
    </div>
  );
}

function HistoryItem({ item, type }: { item: PaginatedHistoryItem; type: HistoryType }) {
  const formattedDate = format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a");

  return (
    <div className="flex items-start justify-between py-4 border-b border-ink-black/10 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-ink-black font-medium truncate" title={item.text}>
          {item.text}
        </p>
        <div className="flex items-center gap-3 mt-1 text-sm text-ink-black/50">
          <span>{formattedDate}</span>
          {type === "analysis" && item.word_count !== undefined && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {item.word_count} words
            </span>
          )}
        </div>
      </div>
      {type === "comparison" && item.score !== undefined && (
        <div className="ml-4 flex-shrink-0">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              item.score >= 80
                ? "bg-green-100 text-green-800"
                : item.score >= 60
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {item.score}%
          </span>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<HistoryType>("analysis");
  const [items, setItems] = useState<PaginatedHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Load history for active tab
  const loadHistory = useCallback(async (type: HistoryType, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setCursor(null);
    }

    try {
      const result: PaginatedHistoryResponse = await getPaginatedHistory({
        type,
        limit: 20,
        cursor: append ? cursor || undefined : undefined,
      });

      setItems((prev) => (append ? [...prev, ...result.items] : result.items));
      setCursor(result.next_cursor);
      setHasMore(result.has_more);
    } catch (err) {
      toast.error("Failed to load history");
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor]);

  // Load on tab change
  useEffect(() => {
    setItems([]);
    loadHistory(activeTab);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    loadHistory(activeTab, true);
  };

  return (
    <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-ink-black mb-6">
        History
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-ink-black/5 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "analysis"
              ? "bg-paper-white text-ink-black shadow-sm"
              : "text-ink-black/60 hover:text-ink-black"
          }`}
        >
          Analyses
        </button>
        <button
          onClick={() => setActiveTab("comparison")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "comparison"
              ? "bg-paper-white text-ink-black shadow-sm"
              : "text-ink-black/60 hover:text-ink-black"
          }`}
        >
          Comparisons
        </button>
      </div>

      {/* Content */}
      <div className="riso-card p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                {activeTab === "comparison" && (
                  <Skeleton className="h-8 w-16 rounded-full" />
                )}
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <>
            <div className="divide-y divide-ink-black/10">
              {items.map((item) => (
                <HistoryItem key={item.id} item={item} type={activeTab} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="riso-button-secondary disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Footer */}
      {!loading && items.length > 0 && (
        <p className="text-center text-sm text-ink-black/40 mt-4">
          Showing {items.length} {activeTab === "analysis" ? "analyses" : "comparisons"}
          {hasMore && " (more available)"}
        </p>
      )}
    </div>
  );
}
