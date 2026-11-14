import type { Locale } from "@/lib/content";
import type { ProgressCount } from "@/lib/learning/progress-contract";
import { learningCopy } from "./learning-copy";
import styles from "./Learning.module.css";

export function ProgressMeter({ label, count, locale = "ar" }: { label: string; count: ProgressCount; locale?: Locale }) {
  const copy = learningCopy[locale];
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-semibold text-text"><bdi>{label}</bdi></span>
        <span className="text-subtle">{count.total ? <>{copy.completeCount} <bdi dir="ltr" className="tabular-nums">{count.completed}/{count.total} · {count.percent}%</bdi></> : copy.noLessons}</span>
      </div>
      {count.percent !== null ? (
        <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={count.percent} className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${count.percent}%` }} />
        </div>
      ) : null}
    </div>
  );
}
