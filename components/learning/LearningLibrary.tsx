import type { Locale } from "@/lib/content";
import { learningCopy } from "./learning-copy";
import styles from "./Learning.module.css";
import Image from "next/image";
import Link from "next/link";
import type { CourseSummary } from "@/lib/learning/contracts";
import type { CourseProgressView } from "@/lib/learning/progress-contract";
import { LearningIcon } from "./LearningIcon";
import { ProgressMeter } from "./ProgressMeter";

export type LibraryEntry = { course: CourseSummary; progress: CourseProgressView | null };

export function LearningLibrary({ entries, locale = "ar" }: { entries: LibraryEntry[]; locale?: Locale }) {
  const copy = learningCopy[locale];
  const latest = entries
    .filter(({ progress }) => progress?.continueState === "continue" && progress.lastVisitedAt)
    .sort((a, b) => (b.progress?.lastVisitedAt ?? "").localeCompare(a.progress?.lastVisitedAt ?? ""))[0];
  const ordered = latest ? [latest, ...entries.filter((entry) => entry !== latest)] : entries;

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} lang={locale} className={styles.learning}>
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
      <header className="mb-8 max-w-2xl space-y-3 sm:mb-10">
        <p className="text-sm font-semibold text-[var(--brand-primary)]">{copy.learnWith}</p>
        <h1 className="text-4xl leading-tight sm:text-6xl">{copy.library}</h1>
        <p className="text-base leading-relaxed text-subtle">{copy.libraryIntro}</p>
      </header>

      {ordered.length ? (
        <ul aria-label={copy.yourCourses} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {ordered.map(({ course, progress }, index) => {
            const href = `/courses/${encodeURIComponent(course.slug)}`;
            const featured = !!latest && index === 0;
            return (
              <li key={course.slug} className={`min-w-0 ${featured ? "md:col-span-2 xl:col-span-3" : ""}`}>
                <article className={`h-full overflow-hidden rounded-md border border-border bg-[var(--brand-background)] ${featured ? "md:grid md:grid-cols-[1.05fr_1fr]" : "flex flex-col"}`}>
                  <div className={`relative aspect-video bg-surface ${featured ? "md:aspect-auto md:min-h-64" : ""}`}>
                    <Image src={course.cover.url} alt={course.cover.alt} fill unoptimized={course.cover.url.startsWith("https://")} sizes={featured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"} className={course.cover.url === "/images/logo.png" ? "object-contain p-8" : "object-cover"} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-7">
                    {featured ? <p className="text-sm font-semibold text-[var(--brand-primary)]">{copy.pickUp}</p> : null}
                    <div className="space-y-2">
                      <h2 className="text-2xl leading-tight"><Link href={href} className="hover:underline"><bdi>{course.title}</bdi></Link></h2>
                      {progress?.courseProgress.firstCompletedAt ? <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-primary)]"><LearningIcon name="check" /> {copy.achieved}</span> : null}
                      <p className="line-clamp-2 text-sm leading-relaxed text-subtle" dir="auto">{course.description}</p>
                    </div>
                    {progress ? (
                      <div className="space-y-4">
                        <ProgressMeter label={copy.courseProgress} locale={locale} count={progress.courseProgress.base} />
                        {progress.courseProgress.premiumModules.length ? (
                          <div className="space-y-3 border-t border-border pt-3">
                            <p className="text-sm font-semibold text-[var(--brand-primary)]">{copy.premium}</p>
                            {progress.courseProgress.premiumModules.map((module) => <ProgressMeter key={module.moduleId} label={module.title} locale={locale} count={module.progress} />)}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="mt-auto">
                      {progress?.continueTarget ? <p className="mb-2 text-sm text-subtle" dir="auto">{progress.continueTarget.title}</p> : null}
                      <Link href={progress?.continueTarget?.href ?? href} className={styles.primaryAction}>
                        {progress?.continueTarget ? copy[progress.continueState] : copy.viewCourse}
                        <LearningIcon name={locale === "ar" ? "left" : "right"} className="size-4 shrink-0" />
                      </Link>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <section className="rounded-md border border-border bg-[var(--brand-background)] px-6 py-10 sm:p-12">
          <span className="mb-5 grid size-12 place-items-center rounded-full bg-[var(--brand-surface)] text-[var(--brand-primary)]"><LearningIcon name="list" className="size-6" /></span>
          <h2 className="text-2xl">{copy.emptyTitle}</h2>
          <p className="mb-5 mt-2 max-w-lg text-sm leading-relaxed text-subtle">{copy.emptyDescription}</p>
          <Link href="/courses" className={styles.primaryAction}>{copy.browse} <LearningIcon name={locale === "ar" ? "left" : "right"} /></Link>
        </section>
      )}
    </div>
    </div>
  );
}
