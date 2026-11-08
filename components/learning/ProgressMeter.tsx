import type { ProgressCount } from "@/lib/learning/progress-contract";

export function ProgressMeter({ label, count }: { label: string; count: ProgressCount }) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-semibold text-text"><bdi>{label}</bdi></span>
        <span className="text-subtle">{count.total ? <>مكتمل <bdi dir="ltr" className="tabular-nums">{count.completed}/{count.total} · {count.percent}%</bdi></> : "لا توجد دروس منشورة بعد"}</span>
      </div>
      {count.percent !== null ? (
        <div role="progressbar" aria-label={label} aria-valuenow={count.percent} className="h-1.5 overflow-hidden rounded-full bg-[#e1ebe8]">
          <div className="h-full rounded-full bg-[#12685f]" style={{ width: `${count.percent}%` }} />
        </div>
      ) : null}
    </div>
  );
}
