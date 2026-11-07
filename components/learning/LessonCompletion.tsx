"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Completion, LessonTarget } from "@/lib/learning/progress-contract";
import { LearningIcon } from "./LearningIcon";

export function LessonCompletion({ endpoint, initial, hasNext }: { endpoint: string; initial: Completion; hasNext: boolean }) {
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
        setMessage("This lesson changed on another device. Your latest progress is shown.");
        router.refresh();
        return;
      }
      if (!response.ok || !result.completion) {
        setMessage(response.status === 401 || response.status === 404 ? "Access changed. Refresh this page before saving progress." : "Progress could not be saved. Please try again.");
        return;
      }
      setCompletion(result.completion);
      setMessage(completed ? "Lesson marked complete." : "Lesson marked incomplete.");
      if (completed && result.nextUnfinishedLesson) router.push(result.nextUnfinishedLesson.href);
      else router.refresh();
    } catch {
      setMessage("Progress could not be saved. Please try again.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <section aria-label="Lesson completion" className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-[#d2e6e0] bg-[#f2f8f6] p-4 sm:p-5">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-[#14312e]">
          {completion.completed ? <LearningIcon name="check" /> : null}
          {completion.completed ? "Lesson complete" : "Ready to finish this lesson?"}
        </p>
        <p className="mt-1 text-sm text-subtle">{completion.completed ? "You can return to this lesson anytime." : "Mark it complete when you’re ready."}</p>
        <p role="status" className={message ? "mt-2 text-sm text-[#0b625b]" : "sr-only"}>{message}</p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => void update(!completion.completed)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60 ${completion.completed ? "border border-[#12685f] text-[#12685f] hover:bg-white" : "bg-[#12685f] text-white hover:bg-[#0b504a]"}`}
      >
        {pending ? "Saving…" : completion.completed ? "Mark incomplete" : hasNext ? "Complete & Continue" : "Mark complete"}
        {!completion.completed && !pending ? <LearningIcon name={hasNext ? "right" : "check"} /> : null}
      </button>
    </section>
  );
}
