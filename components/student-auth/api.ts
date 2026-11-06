export type Student = {
  id: number;
  name: string;
  email: string;
  city: string | null;
  ageRange: string | null;
  hasPassword: boolean;
  hasGoogle: boolean;
};

export type AuthResult<T> = { ok: true; data: T } | { ok: false; code: string };

export async function authRequest<T>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH"; body?: Record<string, string | null>; signal?: AbortSignal } = {},
): Promise<AuthResult<T>> {
  const { method = "GET", body, signal } = options;
  try {
    const response = await fetch("/api/student-auth/" + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });
    if (response.ok) return { ok: true, data: await response.json() as T };
    if (response.status === 429) return { ok: false, code: "RATE_LIMITED" };
    const data = await response.json().catch(() => null);
    const code: unknown = data?.error?.code;
    return { ok: false, code: typeof code === "string" ? code : response.status === 401 ? "UNAUTHENTICATED" : "UNAVAILABLE" };
  } catch {
    return { ok: false, code: "UNAVAILABLE" };
  }
}

export function authError(code: string) {
  switch (code) {
    case "INVALID_INPUT": return "Check the fields and try again.";
    case "INVALID_CREDENTIALS": return "That email and password combination didn’t work. You can try again or reset your password.";
    case "INVALID_TOKEN": return "This link is invalid, expired, or already used. Request a new link to continue.";
    case "UNAUTHENTICATED": return "Your session has ended. Sign in to continue.";
    case "REAUTH_REQUIRED": return "Confirm your identity before making this change.";
    case "RATE_LIMITED": return "Too many attempts. Wait a few minutes and try again.";
    default: return "This service is temporarily unavailable. Please try again.";
  }
}

const studentDestinations = new Set(["/account", "/my-learning", "/courses"]);
const coursePath = /^\/courses\/[a-z0-9-]+(?:\/lessons\/[a-zA-Z0-9_-]+)?$/;

export function safeReturnTo(input: unknown): string {
  return typeof input === "string" && input === input.trim() && (studentDestinations.has(input) || coursePath.test(input)) ? input : "/my-learning";
}

export function loginHref(returnTo: string) {
  return "/login?" + new URLSearchParams({ returnTo: safeReturnTo(returnTo) });
}

export function googleHref(intent: "login" | "link" | "reauth", returnTo: string) {
  return "/api/student-auth/google/start?" + new URLSearchParams({ intent, returnTo: safeReturnTo(returnTo) });
}
