import type { ProgressCount } from "@/lib/learning/progress-contract";

export function ProgressMeter({ label, count }: { label: string; count: ProgressCount }) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-semibold text-text">{label}</span>
        <span className="text-subtle">{count.total ? `${count.completed}/${count.total} complete · ${count.percent}%` : "No published lessons yet"}</span>
      </div>
      {count.percent !== null ? (
        <div role="progressbar" aria-label={label} aria-valuenow={count.percent} className="h-1.5 overflow-hidden rounded-full bg-[#e1ebe8]">
          <div className="h-full rounded-full bg-[#12685f]" style={{ width: `${count.percent}%` }} />
        </div>
      ) : null}
    </div>
  );
}
