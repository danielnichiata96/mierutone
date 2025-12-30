"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  getSubscriptionStatus,
  createPortalSession,
  SubscriptionStatus,
} from "@/lib/api";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    getSubscriptionStatus().then(setSubscription).catch(console.error);
  }, []);

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to open portal:", error);
      setLoadingPortal(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-ink-black mb-4">
        Settings
      </h1>

      {/* Account Section */}
      <section className="riso-card p-6 mb-6">
        <h2 className="font-display text-xl font-bold text-ink-black mb-4">
          Account
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-ink-black/60">Name</label>
            <p className="text-ink-black font-medium">
              {user?.user_metadata?.full_name || "Not set"}
            </p>
          </div>
          <div>
            <label className="text-sm text-ink-black/60">Email</label>
            <p className="text-ink-black font-medium">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="riso-card p-6 mb-6">
        <h2 className="font-display text-xl font-bold text-ink-black mb-4">
          Subscription
        </h2>

        {subscription ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscription.plan === "pro"
                    ? "bg-primary-300/30 text-primary-700"
                    : "bg-ink-black/10 text-ink-black/60"
                }`}
              >
                {subscription.plan === "pro" ? "Pro" : "Free"}
              </span>
              {subscription.status && subscription.plan === "pro" && (
                <span className="text-sm text-ink-black/60">
                  {subscription.cancel_at_period_end
                    ? "Cancels"
                    : "Renews"}{" "}
                  {subscription.current_period_end &&
                    formatDate(subscription.current_period_end)}
                </span>
              )}
            </div>

            {subscription.plan === "pro" ? (
              <button
                onClick={handleManageSubscription}
                disabled={loadingPortal}
                className="riso-button-secondary disabled:opacity-50"
              >
                {loadingPortal ? "Loading..." : "Manage Subscription"}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-ink-black/60">
                  Upgrade to Pro for unlimited TTS, comparisons, history
                  tracking, and more.
                </p>
                <Link href="/pricing" className="riso-button-primary inline-block">
                  View Plans
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-ink-black/60 text-sm">Loading...</div>
        )}
      </section>

      {/* Preferences */}
      <section className="riso-card p-6 mb-6">
        <h2 className="font-display text-xl font-bold text-ink-black mb-4">
          Preferences
        </h2>
        <p className="text-ink-black/60 text-sm">
          Voice selection, theme, and other preferences coming soon.
        </p>
      </section>

      {/* Sign Out */}
      <section className="riso-card p-6">
        <h2 className="font-display text-xl font-bold text-ink-black mb-4">
          Session
        </h2>
        <button
          onClick={() => signOut()}
          className="riso-button-secondary text-red-600 border-red-300 hover:bg-red-50"
        >
          Sign Out
        </button>
      </section>
    </div>
  );
}
