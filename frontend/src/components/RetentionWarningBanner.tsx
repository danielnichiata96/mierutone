"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getDashboardStats } from "@/lib/api";
import type { StatsResponse } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";

// Retention limit - should match backend policy if one exists
// Currently informational only (backend doesn't enforce limits)
const MAX_RECORDS = 1000;
const WARNING_THRESHOLD = 0.8; // Show warning at 80% capacity

interface RetentionWarningBannerProps {
  className?: string;
}

export function RetentionWarningBanner({ className = "" }: RetentionWarningBannerProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Check if user previously dismissed the warning this session
    const dismissedKey = `retention_warning_dismissed_${user.id}`;
    if (sessionStorage.getItem(dismissedKey)) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const handleDismiss = () => {
    if (user) {
      sessionStorage.setItem(`retention_warning_dismissed_${user.id}`, "true");
    }
    setDismissed(true);
  };

  // Don't show if:
  // - User is not logged in
  // - Still loading
  // - Already dismissed
  // - No stats available
  // - Below warning threshold
  if (!user || loading || dismissed || !stats) {
    return null;
  }

  const currentCount = stats.current_record_count || 0;
  const percentUsed = currentCount / MAX_RECORDS;

  if (percentUsed < WARNING_THRESHOLD) {
    return null;
  }

  const isAtLimit = percentUsed >= 1;
  const recordsRemaining = Math.max(0, MAX_RECORDS - currentCount);

  return (
    <div
      className={`relative bg-amber-50 border-l-4 ${
        isAtLimit ? "border-red-500" : "border-amber-400"
      } p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isAtLimit ? (
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${isAtLimit ? "text-red-800" : "text-amber-800"}`}>
            {isAtLimit ? "Storage Limit Reached" : "Approaching Storage Limit"}
          </h3>
          <p className={`mt-1 text-sm ${isAtLimit ? "text-red-700" : "text-amber-700"}`}>
            {isAtLimit ? (
              <>
                You have {currentCount.toLocaleString()} records stored.
                Consider exporting and clearing old data to free up space.
              </>
            ) : (
              <>
                You have {currentCount.toLocaleString()} of {MAX_RECORDS.toLocaleString()} records
                ({Math.round(percentUsed * 100)}% used).
                Consider exporting your data periodically.
              </>
            )}
          </p>
          <div className="mt-3 flex gap-3">
            <Link
              href="/settings"
              className={`text-sm font-medium ${
                isAtLimit
                  ? "text-red-800 hover:text-red-900"
                  : "text-amber-800 hover:text-amber-900"
              } underline`}
            >
              Export Data
            </Link>
            {!isAtLimit && (
              <button
                onClick={handleDismiss}
                className="text-sm text-amber-600 hover:text-amber-700"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        {!isAtLimit && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-amber-400 hover:text-amber-500"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
