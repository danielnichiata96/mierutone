import { getSupabase } from "../supabase";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function buildApiUrl(endpoint: string): string {
  return endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();
  for (const source of sources) {
    if (!source) continue;
    const next = new Headers(source);
    next.forEach((value, key) => headers.set(key, value));
  }
  return headers;
}

function ensureJsonContentType(headers: Headers, body: BodyInit | null | undefined): void {
  if (!body || typeof body !== "string") return;
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
}

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
  headers?: HeadersInit;
  /** Custom error messages by status code */
  errorMessages?: Record<number, string>;
  /** Return raw response instead of parsing JSON */
  raw?: boolean;
}

async function getErrorMessage(
  response: Response,
  errorMessages: Record<number, string>
): Promise<string> {
  const override = errorMessages[response.status];
  if (override) {
    return override;
  }

  const fallback =
    STATUS_MESSAGES[response.status] || `Request failed: ${response.status}`;

  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data?.detail === "string") {
      return data.detail;
    }
  } catch {
    // Ignore JSON parse errors and fall back to default message.
  }

  return fallback;
}

async function request<T = unknown>(
  endpoint: string,
  options: AuthFetchOptions,
  withAuth: boolean
): Promise<T> {
  const { errorMessages = {}, raw = false, headers: customHeaders, ...fetchOptions } = options;
  const authHeaders = withAuth ? await getAuthHeaders() : {};

  const headers = mergeHeaders(authHeaders, customHeaders);
  ensureJsonContentType(headers, fetchOptions.body ?? null);

  const response = await fetch(buildApiUrl(endpoint), { ...fetchOptions, headers });

  if (!response.ok) {
    const message = await getErrorMessage(response, errorMessages);
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

/**
 * Fetch with authentication headers and standardized error handling.
 * Automatically adds auth headers and handles response errors.
 */
export async function authFetch<T = unknown>(
  endpoint: string,
  options: AuthFetchOptions = {}
): Promise<T> {
  return request(endpoint, options, true);
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: AuthFetchOptions = {}
): Promise<T> {
  return request(endpoint, options, false);
}

export function decodeBase64ToBlob(base64: string, mimeType: string): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}
