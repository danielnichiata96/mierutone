import { API_URL, decodeBase64ToBlob } from "./client";

export interface TTSOptions {
  voice?: string;
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
      voice: options.voice || "female1",
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
  pitch_curve: number[];
  voiced_curve: number[];
  duration_ms: number;
  time_step_ms: number;
}

export interface TTSWithPitchResult {
  audioBlob: Blob;
  audioUrl: string;
  pitchCurve: number[];
  voicedCurve: number[];
  durationMs: number;
  timeStepMs: number;
}

export async function getTTSWithPitch(
  text: string,
  options: TTSOptions = {}
): Promise<TTSWithPitchResult> {
  const params = new URLSearchParams({
    text,
    voice: options.voice || "female1",
    rate: String(options.rate || 1.0),
  });

  const response = await fetch(`${API_URL}/tts/with-pitch?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "TTS failed" }));
    throw new Error(error.detail || `TTS error: ${response.status}`);
  }

  const data: TTSWithPitchResponse = await response.json();

  const audioBlob = decodeBase64ToBlob(data.audio_base64, "audio/wav");
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

  const audioUrl = `data:audio/wav;base64,${data.audio_base64}`;
  const audioBlob = decodeBase64ToBlob(data.audio_base64, "audio/wav");

  return {
    audioBlob,
    audioUrl,
    wordTimings: data.word_timings,
    durationMs: data.duration_ms,
  };
}
