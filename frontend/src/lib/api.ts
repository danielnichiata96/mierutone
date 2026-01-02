import type { AnalyzeResponse } from "@/types/pitch";
import type {
  ProfileResponse,
  PreferencesResponse,
  StatsResponse as DashboardStatsResponse,
  AchievementsResponse,
  PaginatedHistoryResponse,
} from "@/types/user";
import { getSupabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Helper to get auth token for protected endpoints
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = getSupabase();
  if (!supabase) return {};

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

export async function analyzeText(text: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export interface TTSOptions {
  voice?: string;  // female1-4, male1-3 (Azure Neural voices)
  rate?: number;
}

export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Blob> {
  const response = await fetch(`${API_URL}/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voice: options.voice || "female1",  // Azure Nanami (default)
      rate: options.rate || 1.0,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "TTS failed" }));
    throw new Error(error.detail || `TTS error: ${response.status}`);
  }

  return response.blob();
}

export function createAudioUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeAudioUrl(url: string): void {
  URL.revokeObjectURL(url);
}

export interface CompareResponse {
  score: number;
  feedback: string;
  native_pitch: number[];
  user_pitch: number[];
  aligned_native: number[];
  aligned_user: number[];
}

export async function comparePronunciation(
  text: string,
  userAudioBlob: Blob
): Promise<CompareResponse> {
  // Use FormData upload (better for large files, avoids UI freeze from base64)
  const formData = new FormData();
  formData.append("text", text);
  formData.append("user_audio", userAudioBlob, "recording.wav");

  const response = await fetch(`${API_URL}/compare/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Comparison failed" }));
    throw new Error(error.detail || `Compare error: ${response.status}`);
  }

  return response.json();
}

export interface TTSWithPitchResponse {
  audio_base64: string;
  pitch_curve: number[];  // Full curve with 0s for unvoiced
  voiced_curve: number[];  // Voiced-only for scoring
  duration_ms: number;
  time_step_ms: number;
}

export interface TTSWithPitchResult {
  audioBlob: Blob;
  audioUrl: string;
  pitchCurve: number[];  // Full curve for visualization
  voicedCurve: number[];  // Voiced-only for scoring
  durationMs: number;
  timeStepMs: number;  // Time between pitch frames (from backend)
}

export async function getTTSWithPitch(
  text: string,
  options: TTSOptions = {}
): Promise<TTSWithPitchResult> {
  const params = new URLSearchParams({
    text,
    voice: options.voice || "female1",  // VOICEVOX Nemo default
    rate: String(options.rate || 1.0),
  });

  const response = await fetch(`${API_URL}/tts/with-pitch?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "TTS failed" }));
    throw new Error(error.detail || `TTS error: ${response.status}`);
  }

  const data: TTSWithPitchResponse = await response.json();

  // Decode base64 audio to Blob
  const binaryString = atob(data.audio_base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const audioBlob = new Blob([bytes], { type: "audio/wav" });
  const audioUrl = URL.createObjectURL(audioBlob);

  return {
    audioBlob,
    audioUrl,
    pitchCurve: data.pitch_curve,
    voicedCurve: data.voiced_curve,
    durationMs: data.duration_ms,
    timeStepMs: data.time_step_ms,
  };
}


export interface WordTiming {
  text: string;
  offset_ms: number;
  duration_ms: number;
}

export interface TTSWithTimingsResponse {
  audio_base64: string;
  word_timings: WordTiming[];
  duration_ms: number;
}

export interface TTSWithTimingsResult {
  audioBlob: Blob;
  audioUrl: string;
  wordTimings: WordTiming[];
  durationMs: number;
}

export async function getTTSWithTimings(
  text: string,
  options: TTSOptions = {}
): Promise<TTSWithTimingsResult> {
  const params = new URLSearchParams({
    text,
    voice: options.voice || "female1",
    rate: String(options.rate || 1.0),
  });

  const response = await fetch(`${API_URL}/tts/with-timings?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "TTS failed" }));
    throw new Error(error.detail || `TTS error: ${response.status}`);
  }

  const data: TTSWithTimingsResponse = await response.json();

  // Use data URL directly - more compatible with browsers than blob URL
  const audioUrl = `data:audio/wav;base64,${data.audio_base64}`;

  // Also create blob for potential future use
  const binaryString = atob(data.audio_base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const audioBlob = new Blob([bytes], { type: "audio/wav" });

  return {
    audioBlob,
    audioUrl,
    wordTimings: data.word_timings,
    durationMs: data.duration_ms,
  };
}

// ============================================================================
// History API (protected - requires authentication)
// ============================================================================

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

export interface StatsResponse {
  total_analyses: number;
  total_comparisons: number;
  average_score: number;
}

export async function saveAnalysis(
  text: string,
  wordCount: number
): Promise<{ success: boolean; id: string }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/history/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ text, word_count: wordCount }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save analysis: ${response.status}`);
  }

  return response.json();
}

export async function saveScore(
  text: string,
  score: number
): Promise<{ success: boolean; id: string }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/history/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ text, score }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save score: ${response.status}`);
  }

  return response.json();
}

export async function getHistory(limit = 50): Promise<HistoryResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/history?limit=${limit}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to get history: ${response.status}`);
  }

  return response.json();
}

export async function getStats(): Promise<StatsResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/history/stats`, { headers });

  if (!response.ok) {
    throw new Error(`Failed to get stats: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// User Profile & Preferences API
// ============================================================================

export async function getProfile(): Promise<ProfileResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/user/profile`, { headers });
  if (!response.ok) throw new Error(`Failed to get profile: ${response.status}`);
  return response.json();
}

export async function updateProfile(displayName: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/user/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ display_name: displayName }),
  });
  if (!response.ok) throw new Error(`Failed to update profile: ${response.status}`);
}

export async function getPreferences(): Promise<PreferencesResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/user/preferences`, { headers });
  if (!response.ok) throw new Error(`Failed to get preferences: ${response.status}`);
  return response.json();
}

export async function updatePreferences(prefs: Partial<PreferencesResponse>): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/user/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(prefs),
  });
  if (!response.ok) throw new Error(`Failed to update preferences: ${response.status}`);
}

// ============================================================================
// Dashboard Stats (enhanced)
// ============================================================================

export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/history/stats`, { headers });
  if (!response.ok) throw new Error(`Failed to get stats: ${response.status}`);
  return response.json();
}

// ============================================================================
// Paginated History API
// ============================================================================

export interface PaginatedHistoryParams {
  type: "analysis" | "comparison";
  limit?: number;
  cursor?: string;
  direction?: "next" | "prev";
}

export async function getPaginatedHistory(
  params: PaginatedHistoryParams
): Promise<PaginatedHistoryResponse> {
  const headers = await getAuthHeaders();
  const searchParams = new URLSearchParams({
    type: params.type,
    limit: String(params.limit || 20),
    direction: params.direction || "next",
  });
  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  const response = await fetch(`${API_URL}/history/paginated?${searchParams}`, { headers });
  if (!response.ok) throw new Error(`Failed to get history: ${response.status}`);
  return response.json();
}

export async function clearHistory(): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/history`, {
    method: "DELETE",
    headers,
  });
  if (!response.ok) throw new Error(`Failed to clear history: ${response.status}`);
}

export async function exportData(format: "json" | "csv" = "json"): Promise<Blob | object> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/history/export?format=${format}`, {
    method: "POST",
    headers,
  });
  if (!response.ok) throw new Error(`Failed to export data: ${response.status}`);

  if (format === "csv") {
    return response.blob();
  }
  return response.json();
}

// ============================================================================
// Achievements API
// ============================================================================

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

// ============================================================================
// Account Management
// ============================================================================

export async function deleteAccount(): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/user/account`, {
    method: "DELETE",
    headers,
  });
  if (!response.ok) throw new Error(`Failed to delete account: ${response.status}`);
}

// ============================================================================
// Decks & Learning API
// ============================================================================

import type {
  DeckSummary,
  DeckDetail,
  DeckListResponse,
  LearningStats,
} from "@/types/deck";

export async function getDecks(phase?: number): Promise<DeckListResponse> {
  const headers = await getAuthHeaders();
  const params = phase ? `?phase=${phase}` : "";
  const response = await fetch(`${API_URL}/decks${params}`, { headers });
  if (!response.ok) throw new Error(`Failed to get decks: ${response.status}`);
  return response.json();
}

export async function getDeck(slug: string): Promise<DeckDetail> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/decks/${slug}`, { headers });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Sign in to access this deck");
    }
    if (response.status === 404) {
      throw new Error("Deck not found");
    }
    throw new Error(`Failed to get deck: ${response.status}`);
  }
  return response.json();
}

export async function updateDeckProgress(
  slug: string,
  cardIndex: number,
  options: { seen?: boolean; mastered?: boolean; cardId?: string } = {}
): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/decks/${slug}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({
      card_index: cardIndex,
      card_id: options.cardId,
      seen: options.seen ?? true,
      mastered: options.mastered ?? false,
    }),
  });
  if (!response.ok) throw new Error(`Failed to update progress: ${response.status}`);
}

export async function getLearningStats(): Promise<LearningStats> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/decks/stats/summary`, { headers });
  if (!response.ok) throw new Error(`Failed to get learning stats: ${response.status}`);
  return response.json();
}
