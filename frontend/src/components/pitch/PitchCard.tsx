"use client";

import { ReactNode } from "react";
import { PlayButton } from "../PlayButton";

interface PitchCardProps {
  children: ReactNode;
  surface: string;
  size?: "sm" | "md";
  voice?: string;
  rate?: number;
}

const SIZE_CLASSES = {
  sm: "min-w-[120px] p-4",
  md: "min-w-[140px] p-5",
} as const;

export function PitchCard({ children, surface, size = "sm", voice, rate }: PitchCardProps) {
  return (
    <div className={`riso-card-interactive flex flex-col items-center relative group ${SIZE_CLASSES[size]}`}>
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <PlayButton text={surface} size="sm" voice={voice} rate={rate} />
      </div>
      {children}
    </div>
  );
}
