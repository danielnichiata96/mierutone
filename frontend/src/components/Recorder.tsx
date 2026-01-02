"use client";

import { useState, useRef, useCallback } from "react";
import { MicrophoneIcon, StopIcon, CheckIcon } from "@/components/icons/DoodleIcons";

interface RecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

type RecordingState = "idle" | "recording" | "recorded" | "error";

export function Recorder({ onRecordingComplete, onError, disabled }: RecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    // Check browser support first
    if (!isRecordingSupported()) {
      const msg = "Your browser does not support audio recording. Please use Chrome, Firefox, or Safari 14.5+.";
      setErrorMsg(msg);
      setState("error");
      onError?.(msg);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Choose best available audio format (Safari doesn't support webm)
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, {
        ...(mimeType && { mimeType }),
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setErrorMsg(null);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Get actual mimeType from recorder (never assume webm - Safari uses mp4)
        const actualMimeType = mediaRecorder.mimeType || mimeType;
        const blob = new Blob(chunksRef.current, actualMimeType ? { type: actualMimeType } : undefined);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("recorded");

        // Convert to WAV for backend
        convertToWav(blob)
          .then(wavBlob => {
            onRecordingComplete(wavBlob);
          })
          .catch(err => {
            console.error("Failed to convert audio:", err);
            const msg = "Could not process audio format. Please try using Chrome or Firefox.";
            setErrorMsg(msg);
            setState("error");
            onError?.(msg);
          });

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setState("recording");
    } catch (error) {
      console.error("Failed to start recording:", error);
      const msg = "Could not access microphone. Please allow microphone access.";
      setErrorMsg(msg);
      setState("error");
      onError?.(msg);
    }
  }, [onRecordingComplete, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [state]);

  const reset = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setErrorMsg(null);
    setState("idle");
  }, [audioUrl]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Recording button */}
      <button
        onClick={state === "recording" ? stopRecording : startRecording}
        disabled={disabled || state === "recorded"}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center
          text-3xl transition-all duration-300 border-2
          shadow-[4px_4px_0_rgba(0,0,0,0.1)]
          ${state === "recording"
            ? "bg-accent-500 border-accent-500 animate-pulse scale-110"
            : state === "recorded"
              ? "bg-secondary-500 border-secondary-500"
              : "bg-white border-ink-black hover:bg-primary-300/30 hover:scale-105"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {state === "recording" ? (
          <StopIcon size={32} className="text-white" />
        ) : state === "recorded" ? (
          <CheckIcon size={32} className="text-white" />
        ) : (
          <MicrophoneIcon size={32} />
        )}
      </button>

      {/* Status text */}
      <p className={`text-sm font-medium ${state === "error" ? "text-accent-500" : "text-ink-black/50"}`}>
        {state === "idle" && "Tap to record"}
        {state === "recording" && "Recording... tap to stop"}
        {state === "recorded" && "Recording complete!"}
        {state === "error" && errorMsg}
      </p>

      {/* Retry button for errors */}
      {state === "error" && (
        <button
          onClick={reset}
          className="text-sm text-primary-500 hover:text-ink-black transition-colors font-medium"
        >
          Try again
        </button>
      )}

      {/* Playback */}
      {audioUrl && (
        <div className="flex items-center gap-3">
          <audio src={audioUrl} controls className="h-8" />
          <button
            onClick={reset}
            className="text-sm text-accent-500 hover:text-ink-black transition-colors font-medium"
          >
            Re-record
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Convert audio blob to WAV format for backend processing
 */
async function convertToWav(audioBlob: Blob): Promise<Blob> {
  const audioContext = new AudioContext();
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wavBuffer = audioBufferToWav(audioBuffer);
    return new Blob([wavBuffer], { type: "audio/wav" });
  } finally {
    // Always close AudioContext to prevent memory leak
    await audioContext.close();
  }
}

/**
 * Convert AudioBuffer to WAV ArrayBuffer
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1; // Mono
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const samples = buffer.getChannelData(0);
  const dataLength = samples.length * (bitDepth / 8);
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Write samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample * 0x7fff, true);
    offset += 2;
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Check if browser supports audio recording
 */
function isRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}

/**
 * Get the best supported audio MIME type for recording
 * Safari doesn't support webm, so fallback to mp4/aac
 */
function getSupportedMimeType(): string | undefined {
  // Guard: check MediaRecorder exists
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return undefined;
  }

  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  // Let browser choose default
  return undefined;
}
