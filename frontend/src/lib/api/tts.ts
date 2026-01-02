import { apiFetch, decodeBase64ToBlob } from "./client";

export interface TTSOptions {
  voice?: string;
  rate?: number;
}

const DEFAULT_VOICE = "female1";
const DEFAULT_RATE = 1.0;

function resolveTtsOptions(options: TTSOptions = {}): Required<TTSOptions> {
  return {
    voice: options.voice ?? DEFAULT_VOICE,
    rate: options.rate ?? DEFAULT_RATE,
  };
}

function buildTtsPayload(text: string, options: TTSOptions = {}): {
  text: string;
  voice: string;
  rate: number;
} {
  const resolved = resolveTtsOptions(options);
  return {
    text,
    voice: resolved.voice,
    rate: resolved.rate,
  };
}

function buildTtsParams(text: string, options: TTSOptions = {}): URLSearchParams {
  const resolved = resolveTtsOptions(options);
  return new URLSearchParams({
    text,
    voice: resolved.voice,
    rate: String(resolved.rate),
  });
}

export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Blob> {
  const response = await apiFetch<Response>("/tts", {
    method: "POST",
    body: JSON.stringify(buildTtsPayload(text, options)),
    raw: true,
  });

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

  return apiFetch<CompareResponse>("/compare/upload", {
    method: "POST",
    body: formData,
  });
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
  const params = buildTtsParams(text, options);
  const data = await apiFetch<TTSWithPitchResponse>(`/tts/with-pitch?${params}`);

  const audioBlob = decodeBase64ToBlob(data.audio_base64, "audio/wav");
  const audioUrl = createAudioUrl(audioBlob);

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
  const params = buildTtsParams(text, options);
  const data = await apiFetch<TTSWithTimingsResponse>(`/tts/with-timings?${params}`);

  const audioBlob = decodeBase64ToBlob(data.audio_base64, "audio/wav");
  const audioUrl = createAudioUrl(audioBlob);

  return {
    audioBlob,
    audioUrl,
    wordTimings: data.word_timings,
    durationMs: data.duration_ms,
  };
}
