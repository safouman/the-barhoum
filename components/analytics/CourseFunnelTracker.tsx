"use client";

import type { Locale } from "@/lib/content";
import { useEffect, useRef } from "react";
import { event } from "@/lib/analytics";
import { onConsentChange } from "@/lib/consent";

type CourseViewEvent =
  | "course_detail_viewed"
  | "course_free_preview_opened"
  | "course_first_lesson_opened";

export function CourseFunnelTracker({
  name,
  courseKey,
  locale = "ar",
}: {
  name: CourseViewEvent;
  courseKey: string;
  locale?: Locale;
}) {
  const lastView = useRef<string | null>(null);

  useEffect(() => {
    const key = `barhoum:funnel:${name}:${courseKey}`;
    const firstLesson = name === "course_first_lesson_opened";
    function trackView() {
      if (lastView.current === key) return;
      if (firstLesson) {
        try {
          if (sessionStorage.getItem(key)) return;
        } catch {
          // Privacy settings may make session storage unavailable.
        }
      }
      if (!event(name, { course_key: courseKey, locale })) return;

      lastView.current = key;
      if (firstLesson) {
        try {
          sessionStorage.setItem(key, "1");
        } catch {
          // The in-memory guard still covers duplicate effects for this view.
        }
      }
    }

    trackView();
    const unsubscribe = onConsentChange((value) => {
      if (value === "accepted") queueMicrotask(trackView);
    });
    window.addEventListener("barhoum-analytics-ready", trackView);
    return () => {
      unsubscribe();
      window.removeEventListener("barhoum-analytics-ready", trackView);
    };
  }, [courseKey, name, locale]);

  return null;
}
