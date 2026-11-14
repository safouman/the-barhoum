"use client";

import type { Locale } from "@/lib/content";
import { learningCopy } from "./learning-copy";
import styles from "./Learning.module.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Completion, LessonTarget } from "@/lib/learning/progress-contract";
import { LearningIcon } from "./LearningIcon";

export function LessonCompletion({ endpoint, initial, hasNext, locale = "ar" }: { endpoint: string; initial: Completion; hasNext: boolean; locale?: Locale }) {
  const copy = learningCopy[locale];
  const router = useRouter();
  const [completion, setCompletion] = useState(initial);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const visited = useRef<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (visited.current === endpoint) return;
    visited.current = endpoint;
    void fetch(`${endpoint}/visit`, { method: "POST", keepalive: true }).catch(() => {});
  }, [endpoint]);

  async function update(completed: boolean) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`${endpoint}/completion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed, expectedRevision: completion.revision }),
      });
      const result = await response.json() as { completion?: Completion; current?: Completion; nextUnfinishedLesson?: LessonTarget | null };
      if (response.status === 409 && result.current) {
        setCompletion(result.current);
        setMessage(copy.syncConflict);
        router.refresh();
        return;
      }
      if (!response.ok || !result.completion) {
        setMessage(response.status === 401 || response.status === 404 ? copy.accessChanged : copy.saveError);
        return;
      }
      setCompletion(result.completion);
      setMessage(completed ? copy.marked : copy.unmarked);
      if (completed && result.nextUnfinishedLesson) router.push(result.nextUnfinishedLesson.href);
      else router.refresh();
    } catch {
      setMessage(copy.saveError);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <section aria-label={copy.completion} className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-[var(--brand-surface)] bg-[var(--brand-surface)] p-4 sm:p-5">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-text)]">
          {completion.completed ? <LearningIcon name="check" /> : null}
          {completion.completed ? copy.lessonComplete : copy.finishedQuestion}
        </p>
        <p className="mt-1 text-sm text-subtle">{completion.completed ? copy.reviewAnytime : copy.completeHint}</p>
        <p role="status" className={message ? "mt-2 text-sm text-[var(--brand-primary)]" : "sr-only"}>{message}</p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => void update(!completion.completed)}
        className={completion.completed ? styles.secondaryAction : styles.primaryAction}
      >
        {pending ? copy.saving : completion.completed ? copy.markIncomplete : hasNext ? copy.completeContinue : copy.markComplete}
        {!completion.completed && !pending ? <LearningIcon name={hasNext ? locale === "ar" ? "left" : "right" : "check"} /> : null}
      </button>
    </section>
  );
}
