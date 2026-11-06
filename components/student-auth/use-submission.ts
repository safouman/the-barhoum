"use client";

import { useRef, useState, type FormEvent } from "react";
import { authRequest } from "./api";

export function useSubmission() {
  const active = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function handler<T>(
    path: string,
    buildBody: (fields: FormData) => Record<string, string | null>,
    onSuccess: (data: T) => void,
    method: "POST" | "PATCH" = "POST",
  ) {
    return async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (active.current) return;

      const body = buildBody(new FormData(event.currentTarget));
      active.current = true;
      setError("");
      setBusy(true);
      const result = await authRequest<T>(path, { method, body });
      active.current = false;
      setBusy(false);
      if (result.ok) onSuccess(result.data);
      else setError(result.code);
    };
  }

  return { busy, error, handler };
}

export function fieldText(fields: FormData, name: string): string {
  return String(fields.get(name) ?? "");
}
