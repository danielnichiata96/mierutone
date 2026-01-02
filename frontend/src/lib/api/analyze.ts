import type { AnalyzeResponse } from "@/types/pitch";
import { apiFetch } from "./client";

export async function analyzeText(text: string): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>("/analyze", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
