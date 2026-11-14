import type { Locale } from "@/lib/content";
import { studentCopy } from "@/lib/student-copy";
import { safeReturnTo } from "@/lib/student-auth/return-to";
export { safeReturnTo };

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

export function authError(code: string, locale: Locale = "en") {
  const messages = studentCopy[locale].errors;
  return Object.hasOwn(messages, code) ? messages[code] : messages.UNAVAILABLE;
}

export function loginHref(returnTo: string) {
  return "/login?" + new URLSearchParams({ returnTo: safeReturnTo(returnTo) });
}

export function googleHref(intent: "login" | "link" | "reauth", returnTo: string) {
  return "/api/student-auth/google/start?" + new URLSearchParams({ intent, returnTo: safeReturnTo(returnTo) });
}
