"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getProfile,
  updateProfile,
  getPreferences,
  updatePreferences,
  exportData,
  clearHistory,
  deleteAccount,
} from "@/lib/api";
import type { ProfileResponse, PreferencesResponse } from "@/types/user";

const VOICE_OPTIONS = [
  { value: "female1", label: "Female 1 (Nanami)" },
  { value: "female2", label: "Female 2 (Aoi)" },
  { value: "female3", label: "Female 3 (Mayu)" },
  { value: "female4", label: "Female 4 (Shiori)" },
  { value: "male1", label: "Male 1 (Keita)" },
  { value: "male2", label: "Male 2 (Naoki)" },
  { value: "male3", label: "Male 3 (Kenzou)" },
];

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "bg-primary-300" : "bg-ink-black/20"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-ink-black/10 rounded ${className}`}
    />
  );
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { updateLocal: updateGlobalPrefs } = usePreferences();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [preferences, setPreferences] = useState<PreferencesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load profile and preferences
  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, prefsData] = await Promise.all([
          getProfile(),
          getPreferences(),
        ]);
        setProfile(profileData);
        setPreferences(prefsData);
        setDisplayName(profileData.display_name || "");
      } catch (err) {
        toast.error("Failed to load settings");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Save display name
  const handleSaveDisplayName = useCallback(async () => {
    if (!displayName.trim() || displayName === profile?.display_name) return;
    setSaving("displayName");
    try {
      await updateProfile(displayName.trim());
      setProfile((p) => (p ? { ...p, display_name: displayName.trim() } : p));
      toast.success("Display name updated");
    } catch (err) {
      toast.error("Failed to update display name");
      console.error(err);
    } finally {
      setSaving(null);
    }
  }, [displayName, profile?.display_name]);

  // Update preference
  const handlePreferenceChange = useCallback(
    async (key: keyof PreferencesResponse, value: unknown) => {
      setSaving(key);
      try {
        await updatePreferences({ [key]: value });
        setPreferences((p) => (p ? { ...p, [key]: value } : p));
        // Update global preferences so /app picks up changes immediately
        updateGlobalPrefs({ [key]: value } as Partial<PreferencesResponse>);
        toast.success("Preference saved");
      } catch (err) {
        toast.error("Failed to save preference");
        console.error(err);
      } finally {
        setSaving(null);
      }
    },
    [updateGlobalPrefs]
  );

  // Export data
  const handleExport = useCallback(async (format: "json" | "csv") => {
    setSaving(`export-${format}`);
    try {
      const data = await exportData(format);
      const blob =
        data instanceof Blob
          ? data
          : new Blob([JSON.stringify(data, null, 2)], {
              type: "application/json",
            });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mierutone_export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error("Failed to export data");
      console.error(err);
    } finally {
      setSaving(null);
    }
  }, []);

  // Clear history
  const handleClearHistory = useCallback(async () => {
    setSaving("clearHistory");
    try {
      await clearHistory();
      toast.success("History cleared");
      setShowClearConfirm(false);
    } catch (err) {
      toast.error("Failed to clear history");
      console.error(err);
    } finally {
      setSaving(null);
    }
  }, []);

  // Delete account
  const handleDeleteAccount = useCallback(async () => {
    setSaving("deleteAccount");
    try {
      await deleteAccount();
      toast.success("Account deleted");
      signOut();
    } catch (err) {
      toast.error("Failed to delete account");
      console.error(err);
    } finally {
      setSaving(null);
    }
  }, [signOut]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
        <Skeleton className="h-10 w-40 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 pt-16 lg:pt-8 max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-ink-black mb-8">
        Settings
      </h1>

      {/* Profile Section */}
      <section className="riso-card p-6 mb-6">
        <h2 className="font-display text-xl font-bold text-ink-black mb-4">
          Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-black/60 mb-1">
              Display Name
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 px-3 py-2 border border-ink-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-paper-white"
                placeholder="Your name"
              />
              <button
                onClick={handleSaveDisplayName}
                disabled={
                  saving === "displayName" ||
                  !displayName.trim() ||
                  displayName === profile?.display_name
                }
                className="riso-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving === "displayName" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-black/60 mb-1">
              Email
            </label>
            <p className="text-ink-black px-3 py-2 bg-ink-black/5 rounded-lg">
              {user?.email || profile?.email}
            </p>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="riso-card p-6 mb-6">
        <h2 className="font-display text-xl font-bold text-ink-black mb-4">
          Preferences
        </h2>
        <div className="space-y-6">
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-ink-black/60 mb-2">
              Default Voice
            </label>
            <select
              value={preferences?.default_voice || "female1"}
              onChange={(e) =>
                handlePreferenceChange("default_voice", e.target.value)
              }
              disabled={saving === "default_voice"}
              className="w-full px-3 py-2 border border-ink-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-paper-white"
            >
              {VOICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Playback Speed */}
          <div>
            <label className="block text-sm font-medium text-ink-black/60 mb-2">
              Playback Speed: {preferences?.playback_speed?.toFixed(1) || "1.0"}x
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={preferences?.playback_speed || 1.0}
              onChange={(e) =>
                handlePreferenceChange("playback_speed", parseFloat(e.target.value))
              }
              disabled={saving === "playback_speed"}
              className="w-full accent-primary-300"
            />
            <div className="flex justify-between text-xs text-ink-black/40 mt-1">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>1.5x</span>
            </div>
          </div>

          {/* Display Toggles */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-black">Show Accent Numbers</p>
                <p className="text-sm text-ink-black/60">
                  Display pitch accent pattern numbers
                </p>
              </div>
              <Toggle
                checked={preferences?.show_accent_numbers ?? true}
                onChange={(v) => handlePreferenceChange("show_accent_numbers", v)}
                disabled={saving === "show_accent_numbers"}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-black">Show Part of Speech</p>
                <p className="text-sm text-ink-black/60">
                  Display word type (noun, verb, etc.)
                </p>
              </div>
              <Toggle
                checked={preferences?.show_part_of_speech ?? false}
                onChange={(v) => handlePreferenceChange("show_part_of_speech", v)}
                disabled={saving === "show_part_of_speech"}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-black">Show Confidence</p>
                <p className="text-sm text-ink-black/60">
                  Show confidence indicators for pitch patterns
                </p>
              </div>
              <Toggle
                checked={preferences?.show_confidence ?? true}
                onChange={(v) => handlePreferenceChange("show_confidence", v)}
                disabled={saving === "show_confidence"}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Export Section */}
      <section className="riso-card p-6 mb-6">
        <h2 className="font-display text-xl font-bold text-ink-black mb-4">
          Export Data
        </h2>
        <p className="text-ink-black/60 text-sm mb-4">
          Download your practice history and data.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport("json")}
            disabled={saving?.startsWith("export")}
            className="riso-button-secondary disabled:opacity-50"
          >
            {saving === "export-json" ? "Exporting..." : "Export JSON"}
          </button>
          <button
            onClick={() => handleExport("csv")}
            disabled={saving?.startsWith("export")}
            className="riso-button-secondary disabled:opacity-50"
          >
            {saving === "export-csv" ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="riso-card p-6 border-red-200">
        <h2 className="font-display text-xl font-bold text-red-600 mb-4">
          Danger Zone
        </h2>
        <div className="space-y-4">
          {/* Clear History */}
          <div className="flex items-center justify-between py-3 border-b border-ink-black/10">
            <div>
              <p className="font-medium text-ink-black">Clear History</p>
              <p className="text-sm text-ink-black/60">
                Delete all your practice history. This cannot be undone.
              </p>
            </div>
            {showClearConfirm ? (
              <div className="flex gap-2">
                <button
                  onClick={handleClearHistory}
                  disabled={saving === "clearHistory"}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving === "clearHistory" ? "Clearing..." : "Confirm"}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 text-sm border border-ink-black/20 rounded-lg hover:bg-ink-black/5"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="riso-button-secondary text-red-600 border-red-300 hover:bg-red-50"
              >
                Clear History
              </button>
            )}
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-ink-black">Delete Account</p>
              <p className="text-sm text-ink-black/60">
                Permanently delete your account and all data.
              </p>
            </div>
            {showDeleteConfirm ? (
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving === "deleteAccount"}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving === "deleteAccount" ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm border border-ink-black/20 rounded-lg hover:bg-ink-black/5"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="riso-button-secondary text-red-600 border-red-300 hover:bg-red-50"
              >
                Delete Account
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Session Section */}
      <section className="riso-card p-6 mt-6">
        <h2 className="font-display text-xl font-bold text-ink-black mb-4">
          Session
        </h2>
        <button
          onClick={() => signOut()}
          className="riso-button-secondary"
        >
          Sign Out
        </button>
      </section>
    </div>
  );
}
