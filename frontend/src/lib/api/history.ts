import type { PaginatedHistoryResponse, StatsResponse } from "@/types/user";
import { authFetch } from "./client";

export type { StatsResponse };

export interface HistoryAnalysis {
  id: string;
  text: string;
  word_count: number;
  created_at: string;
}

export interface HistoryScore {
  id: string;
  text: string;
  score: number;
  created_at: string;
}

export interface HistoryResponse {
  analyses: HistoryAnalysis[];
  scores: HistoryScore[];
}

export async function saveAnalysis(
  text: string,
  wordCount: number
): Promise<{ success: boolean; id: string }> {
  return authFetch("/history/analysis", {
    method: "POST",
    body: JSON.stringify({ text, word_count: wordCount }),
  });
}

export async function saveScore(
  text: string,
  score: number
): Promise<{ success: boolean; id: string }> {
  return authFetch("/history/score", {
    method: "POST",
    body: JSON.stringify({ text, score }),
  });
}

export async function getHistory(limit = 50): Promise<HistoryResponse> {
  return authFetch(`/history?limit=${limit}`);
}

export async function getStats(): Promise<StatsResponse> {
  return authFetch("/history/stats");
}

export interface PaginatedHistoryParams {
  type: "analysis" | "comparison";
  limit?: number;
  cursor?: string;
  direction?: "next" | "prev";
}

export async function getPaginatedHistory(
  params: PaginatedHistoryParams
): Promise<PaginatedHistoryResponse> {
  const searchParams = new URLSearchParams({
    type: params.type,
    limit: String(params.limit || 20),
    direction: params.direction || "next",
  });
  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  return authFetch(`/history/paginated?${searchParams}`);
}

export async function clearHistory(): Promise<void> {
  return authFetch("/history", { method: "DELETE" });
}

export async function exportData(format: "json" | "csv" = "json"): Promise<Blob | object> {
  if (format === "csv") {
    const response = await authFetch<Response>(`/history/export?format=csv`, {
      method: "POST",
      raw: true,
    });
    return response.blob();
  }
  return authFetch(`/history/export?format=json`, { method: "POST" });
}
