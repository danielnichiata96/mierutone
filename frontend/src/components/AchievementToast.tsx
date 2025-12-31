"use client";

import { toast } from "sonner";

// Achievement metadata for display (keys must match backend achievement_type values)
const ACHIEVEMENT_META: Record<string, { title: string; description: string; icon: string }> = {
  first_analysis: {
    title: "First Steps",
    description: "Completed your first pitch analysis",
    icon: "🎯",
  },
  first_comparison: {
    title: "Voice Trainer",
    description: "Completed your first pronunciation comparison",
    icon: "🎤",
  },
  "10_analyses": {
    title: "Getting Serious",
    description: "Analyzed 10 texts",
    icon: "📚",
  },
  "100_analyses": {
    title: "Pitch Master",
    description: "Analyzed 100 texts",
    icon: "🏆",
  },
  score_90: {
    title: "Sharp Ear",
    description: "Scored 90%+ on a pronunciation comparison",
    icon: "👂",
  },
};

/**
 * Shows a celebration toast for a newly unlocked achievement.
 */
export function showAchievementToast(achievementType: string) {
  const meta = ACHIEVEMENT_META[achievementType];

  if (!meta) {
    // Unknown achievement type, show generic toast
    toast.success("Achievement Unlocked!", {
      description: achievementType.replace(/_/g, " "),
    });
    return;
  }

  toast.success(
    <div className="flex items-center gap-3">
      <span className="text-2xl">{meta.icon}</span>
      <div>
        <p className="font-bold">{meta.title}</p>
        <p className="text-sm opacity-80">{meta.description}</p>
      </div>
    </div>,
    {
      duration: 5000,
    }
  );
}

/**
 * Shows multiple achievement toasts with a delay between each.
 */
export function showAchievementToasts(achievements: string[]) {
  achievements.forEach((achievement, index) => {
    setTimeout(() => {
      showAchievementToast(achievement);
    }, index * 1500); // Stagger toasts by 1.5 seconds
  });
}
