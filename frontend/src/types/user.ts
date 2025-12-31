// User-related types for Dashboard features

export interface ProfileResponse {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export interface PreferencesResponse {
  default_voice: string;
  playback_speed: number;
  show_accent_numbers: boolean;
  show_part_of_speech: boolean;
  show_confidence: boolean;
}

export interface StatsResponse {
  total_analyses: number;
  total_comparisons: number;
  avg_score: number | null;
  unique_texts: number;
  current_record_count: number;
}

export interface Achievement {
  id: string;
  achievement_type: string;
  achieved_at: string;
}

export interface AchievementsResponse {
  achievements: Achievement[];
}

export interface PaginatedHistoryItem {
  id: string;
  text: string;
  created_at: string;
  word_count?: number;
  score?: number;
}

export interface PaginatedHistoryResponse {
  items: PaginatedHistoryItem[];
  next_cursor: string | null;
  has_more: boolean;
}
