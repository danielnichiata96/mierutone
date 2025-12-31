"use client";

import { useState, useRef, useCallback } from "react";
import { textToSpeech, createAudioUrl, revokeAudioUrl } from "@/lib/api";

interface PlayButtonProps {
  text: string;
  size?: "sm" | "md";
  className?: string;
  voice?: string;
  rate?: number;
}

export function PlayButton({ text, size = "sm", className = "", voice, rate }: PlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      revokeAudioUrl(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const handlePlay = async () => {
    // If already playing, stop
    if (isPlaying) {
      cleanup();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const blob = await textToSpeech(text, { voice, rate });
      const url = createAudioUrl(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        cleanup();
      };

      audio.onerror = () => {
        setError("Playback failed");
        setIsPlaying(false);
        cleanup();
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "TTS failed");
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "w-7 h-7 text-sm",
    md: "w-9 h-9 text-base",
  };

  return (
    <button
      onClick={handlePlay}
      disabled={isLoading}
      title={error || (isPlaying ? "Stop" : "Play pronunciation")}
      className={`
        ${sizeClasses[size]}
        rounded-full flex items-center justify-center
        border-2 font-bold
        transition-all duration-300
        ${error
          ? "bg-accent-300/30 border-accent-500 text-accent-500"
          : isPlaying
            ? "bg-secondary-300/30 border-secondary-500 text-ink-black"
            : "bg-primary-300/30 border-primary-500 text-ink-black hover:bg-primary-500/30"
        }
        ${isLoading ? "" : "hover:scale-105 active:scale-95"}
        ${className}
      `}
    >
      {isLoading ? (
        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isPlaying ? (
        <span>■</span>
      ) : error ? (
        <span>!</span>
      ) : (
        <span>▶</span>
      )}
    </button>
  );
}
