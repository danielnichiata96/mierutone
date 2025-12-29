"use client";

import { useState, useRef } from "react";
import { textToSpeech, createAudioUrl, revokeAudioUrl } from "@/lib/api";

interface AudioPlayButtonProps {
  text: string;
  size?: "sm" | "md";
  className?: string;
}

export function AudioPlayButton({ text, size = "sm", className = "" }: AudioPlayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch audio if not cached
      if (!audioUrlRef.current) {
        const blob = await textToSpeech(text);
        audioUrlRef.current = createAudioUrl(blob);
      }

      // Create new audio element
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrlRef.current);
      audioRef.current = audio;

      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const buttonSize = size === "sm" ? "p-1.5" : "p-2";

  return (
    <button
      onClick={handlePlay}
      disabled={isLoading}
      className={`${buttonSize} rounded-full bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 transition-all disabled:opacity-50 ${className}`}
      title={isPlaying ? "Stop" : "Play audio"}
    >
      {isLoading ? (
        <svg className={`${iconSize} animate-spin`} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : isPlaying ? (
        <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}
