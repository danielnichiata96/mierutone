import type { AchievementsResponse } from "@/types/user";
import { API_URL, getAuthHeaders } from "./client";

export async function getAchievements(): Promise<AchievementsResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/achievements`, { headers });
  if (!response.ok) throw new Error(`Failed to get achievements: ${response.status}`);
  return response.json();
}

export async function checkAchievements(): Promise<{ new_achievements: string[] }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/achievements/check`, {
    method: "POST",
    headers,
  });
  if (!response.ok) throw new Error(`Failed to check achievements: ${response.status}`);
  return response.json();
}
