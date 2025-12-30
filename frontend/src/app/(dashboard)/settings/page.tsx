"use client";

import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { user, signOut } = useAuth();

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

      {/* Coming Soon */}
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
