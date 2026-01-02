import { getSupabase } from "../supabase";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = getSupabase();
  if (!supabase) return {};

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

// Error messages for common status codes
const STATUS_MESSAGES: Record<number, string> = {
  401: "Authentication required",
  403: "Access denied",
  404: "Not found",
  429: "Too many requests",
  500: "Server error",
  503: "Service unavailable",
};

export interface AuthFetchOptions extends Omit<RequestInit, "headers"> {
  /** Custom error messages by status code */
  errorMessages?: Record<number, string>;
  /** Return raw response instead of parsing JSON */
  raw?: boolean;
}

/**
 * Fetch with authentication headers and standardized error handling.
 * Automatically adds auth headers and handles response errors.
 */
export async function authFetch<T = unknown>(
  endpoint: string,
  options: AuthFetchOptions = {}
): Promise<T> {
  const { errorMessages = {}, raw = false, ...fetchOptions } = options;
  const authHeaders = await getAuthHeaders();

  const headers: HeadersInit = { ...authHeaders };
  if (fetchOptions.body && typeof fetchOptions.body === "string") {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
  const response = await fetch(url, { ...fetchOptions, headers });

  if (!response.ok) {
    const message =
      errorMessages[response.status] ||
      STATUS_MESSAGES[response.status] ||
      `Request failed: ${response.status}`;
    throw new Error(message);
  }

  if (raw) {
    return response as unknown as T;
  }

  // Handle empty responses (204 No Content, etc.)
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export function decodeBase64ToBlob(base64: string, mimeType: string): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}
