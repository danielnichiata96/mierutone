// API Client
export { API_URL, getAuthHeaders, authFetch } from "./client";
export type { AuthFetchOptions } from "./client";

// Analyze
export { analyzeText } from "./analyze";

// TTS
export {
  textToSpeech,
  createAudioUrl,
  revokeAudioUrl,
  comparePronunciation,
  getTTSWithPitch,
  getTTSWithTimings,
} from "./tts";
export type {
  TTSOptions,
  CompareResponse,
  TTSWithPitchResponse,
  TTSWithPitchResult,
  WordTiming,
  TTSWithTimingsResponse,
  TTSWithTimingsResult,
} from "./tts";

// User
export {
  getProfile,
  updateProfile,
  getPreferences,
  updatePreferences,
  getDashboardStats,
  deleteAccount,
} from "./user";

// History
export {
  saveAnalysis,
  saveScore,
  getHistory,
  getStats,
  getPaginatedHistory,
  clearHistory,
  exportData,
} from "./history";
export type {
  HistoryAnalysis,
  HistoryScore,
  HistoryResponse,
  StatsResponse,
  PaginatedHistoryParams,
} from "./history";

// Achievements
export { getAchievements, checkAchievements } from "./achievements";

// Decks
export {
  getDecks,
  getDeck,
  updateDeckProgress,
  getLearningStats,
} from "./decks";
