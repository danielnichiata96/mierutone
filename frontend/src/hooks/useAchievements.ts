"use client";

import { useCallback } from "react";
import { checkAchievements } from "@/lib/api";
import { showAchievementToasts } from "@/components/AchievementToast";
import { useAuth } from "./useAuth";

/**
 * Hook to check for new achievements after an action.
 * Call `checkForAchievements()` after analyses or comparisons.
 */
export function useAchievements() {
  const { user } = useAuth();

  const checkForAchievements = useCallback(async () => {
    // Only check for authenticated users
    if (!user) return;

    try {
      const result = await checkAchievements();
      if (result.new_achievements && result.new_achievements.length > 0) {
        showAchievementToasts(result.new_achievements);
      }
    } catch (err) {
      // Silently fail - achievements are nice-to-have
      console.error("Failed to check achievements:", err);
    }
  }, [user]);

  return { checkForAchievements };
}
