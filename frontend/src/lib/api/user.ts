import type {
  ProfileResponse,
  PreferencesResponse,
  StatsResponse as DashboardStatsResponse,
} from "@/types/user";
import { authFetch } from "./client";

export async function getProfile(): Promise<ProfileResponse> {
  return authFetch("/user/profile");
}

export async function updateProfile(displayName: string): Promise<void> {
  return authFetch("/user/profile", {
    method: "PATCH",
    body: JSON.stringify({ display_name: displayName }),
  });
}

export async function getPreferences(): Promise<PreferencesResponse> {
  return authFetch("/user/preferences");
}

export async function updatePreferences(prefs: Partial<PreferencesResponse>): Promise<void> {
  return authFetch("/user/preferences", {
    method: "PATCH",
    body: JSON.stringify(prefs),
  });
}

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  return authFetch("/history/stats");
}

export async function deleteAccount(): Promise<void> {
  return authFetch("/user/account", { method: "DELETE" });
}
