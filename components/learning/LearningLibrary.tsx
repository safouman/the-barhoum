import Image from "next/image";
import Link from "next/link";
import type { CourseSummary } from "@/lib/learning/contracts";
import type { CourseProgressView } from "@/lib/learning/progress-contract";
import { SignOut } from "@/components/student-auth/SignOut";
import { LearningIcon } from "./LearningIcon";
import { ProgressMeter } from "./ProgressMeter";

export type LibraryEntry = { course: CourseSummary; progress: CourseProgressView | null };

const actionLabels = { start: "Start course", continue: "Continue learning", review: "Review course" };

export function LearningLibrary({ entries }: { entries: LibraryEntry[] }) {
  const latest = entries
    .filter(({ progress }) => progress?.continueState === "continue" && progress.lastVisitedAt)
    .sort((a, b) => (b.progress?.lastVisitedAt ?? "").localeCompare(a.progress?.lastVisitedAt ?? ""))[0];
  const ordered = latest ? [latest, ...entries.filter((entry) => entry !== latest)] : entries;

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
      <header className="mb-8 max-w-2xl space-y-3 sm:mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#12685f]">Barhoum Learning</p>
        <h1 className="text-4xl leading-tight sm:text-6xl">My Learning</h1>
        <p className="text-base leading-relaxed text-subtle">Your courses, ready whenever you are.</p>
      </header>

      {ordered.length ? (
        <ul aria-label="Owned courses" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {ordered.map(({ course, progress }, index) => {
            const href = `/courses/${encodeURIComponent(course.slug)}`;
            const featured = !!latest && index === 0;
            return (
              <li key={course.slug} className={`min-w-0 ${featured ? "md:col-span-2 xl:col-span-3" : ""}`}>
                <article className={`h-full overflow-hidden rounded-md border border-border bg-white ${featured ? "md:grid md:grid-cols-[1.05fr_1fr]" : "flex flex-col"}`}>
                  <div className={`relative aspect-video bg-surface ${featured ? "md:aspect-auto md:min-h-64" : ""}`}>
                    <Image src={course.cover.url} alt={course.cover.alt} fill unoptimized={course.cover.url.startsWith("https://")} sizes={featured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"} className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-7">
                    {featured ? <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#12685f]">Pick up where you left off</p> : null}
                    <div className="space-y-2">
                      <h2 className="text-2xl leading-tight"><Link href={href} className="hover:underline">{course.title}</Link></h2>
                      {progress?.courseProgress.firstCompletedAt ? <span className="inline-flex items-center gap-1 rounded-full bg-[#e4f8f5] px-2.5 py-1 text-xs font-semibold text-[#0b625b]"><LearningIcon name="check" /> Course completed</span> : null}
                      <p className="line-clamp-2 text-sm leading-relaxed text-subtle">{course.description}</p>
                    </div>
                    {progress ? (
                      <div className="space-y-4">
                        <ProgressMeter label="Course progress" count={progress.courseProgress.base} />
                        {progress.courseProgress.premiumModules.length ? (
                          <div className="space-y-3 border-t border-border pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#12685f]">Premium modules</p>
                            {progress.courseProgress.premiumModules.map((module) => <ProgressMeter key={module.moduleId} label={module.title} count={module.progress} />)}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="mt-auto">
                      {progress?.continueTarget ? <p className="mb-2 text-sm text-subtle">{progress.continueTarget.title}</p> : null}
                      <Link href={progress?.continueTarget?.href ?? href} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full bg-[#12685f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b504a]">
                        {progress?.continueTarget ? actionLabels[progress.continueState] : "View course"}
                        <LearningIcon name="right" className="size-4 shrink-0" />
                      </Link>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <section className="rounded-md border border-border bg-white px-6 py-10 sm:p-12">
          <span className="mb-5 grid size-12 place-items-center rounded-full bg-[#e4f8f5] text-[#12685f]"><LearningIcon name="list" className="size-6" /></span>
          <h2 className="text-2xl">Your courses will appear here</h2>
          <p className="mb-5 mt-2 max-w-lg text-sm leading-relaxed text-subtle">Courses you purchase will appear here. Explore the catalog and try a free lesson to get started.</p>
          <Link href="/courses" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#12685f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b504a]">Browse Courses <LearningIcon name="right" /></Link>
        </section>
      )}
      <div className="mt-6"><SignOut /></div>
    </div>
  );
}
