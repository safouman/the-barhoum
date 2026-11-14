import { MAIN_PROGRAM_SLUG } from "@/lib/learning/main-program";
import featured from "./FeaturedCourse.module.css";
import type { Locale } from "@/lib/content";
import { learningCopy } from "./learning-copy";
import styles from "./Learning.module.css";
import Image from "next/image";
import Link from "next/link";
import { CourseFunnelTracker } from "@/components/analytics/CourseFunnelTracker";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { formatOfferPrice, type CourseCommerce } from "@/components/commerce/checkout";
import { PurchaseButton } from "@/components/commerce/PurchaseButton";
import { loginHref } from "@/components/student-auth/api";
import type { CourseDetail } from "@/lib/learning/contracts";
import type { CourseProgressView } from "@/lib/learning/progress-contract";
import { CurriculumList } from "./CurriculumList";
import { LearningIcon } from "./LearningIcon";
import { ProgressMeter } from "./ProgressMeter";
import { lessonHref, orderedLessons } from "./curriculum";

export function CourseDetailView({ course, commerce, progress, locale = "ar" }: { course: CourseDetail; commerce?: CourseCommerce; progress?: CourseProgressView | null; locale?: Locale }) {
  const copy = learningCopy[locale];
  const isFeatured = course.slug === MAIN_PROGRAM_SLUG;
  const lessons = orderedLessons(course.curriculum);
  const preview = lessons.find(({ access }) => access === "free");
  const firstOwned = commerce?.ownership.base ? lessons.find(({ access }) => access === "unlocked") ?? preview : undefined;
  const baseOffer = commerce?.offers.find(({ moduleId }) => moduleId === null);
  const baseComingSoon = commerce?.comingSoonOffers?.includes(null);
  const basePriceUnavailable = commerce?.unavailableOffers?.includes(null);
  const courseHref = "/courses/" + encodeURIComponent(course.slug);
  const signInHref = commerce?.signInHref ?? loginHref(courseHref);
  const modules = course.curriculum.type === "simple" ? [] : course.curriculum.type === "modular"
    ? course.curriculum.modules : course.curriculum.parts.flatMap((part) => part.modules);
  const regularLessons = course.curriculum.type === "simple" ? lessons.length
    : modules.filter(({ classification }) => classification === "regular").reduce((count, module) => count + module.lessons.length, 0);
  const upgrades = commerce?.ownership.base ? modules.flatMap((module) => {
    if (module.classification !== "premium") return [];
    const owned = commerce.ownership.moduleIds.includes(Number(module.id));
    const offer = commerce.offers.find(({ moduleId }) => moduleId === Number(module.id));
    const comingSoon = commerce.comingSoonOffers?.includes(Number(module.id));
    const priceUnavailable = commerce.unavailableOffers?.includes(Number(module.id));
    return owned || offer || comingSoon || priceUnavailable ? [{ module, owned, offer, comingSoon }] : [];
  }) : [];
  const info = [
    course.estimatedDuration,
    course.difficulty,
  ].filter(Boolean).join(" · ");

  const enrollment = commerce?.ownership.base ? (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[var(--brand-primary)]">{copy.courseOwned}</p>
      {progress ? <ProgressMeter label={copy.courseProgress} locale={locale} count={progress.courseProgress.base} /> : null}
      {progress?.continueTarget ? (
        <Button href={progress.continueTarget.href} className="max-sm:w-full">
          {copy[progress.continueState]}
        </Button>
      ) : firstOwned ? (
        <Button href={lessonHref(course.slug, firstOwned.id)} className="max-sm:w-full">{copy.continue}</Button>
      ) : null}
    </div>
  ) : (baseOffer || baseComingSoon || basePriceUnavailable) && commerce ? (
    <section aria-label={copy.purchase} className="space-y-3 rounded-sm border border-border bg-[var(--brand-background)] p-4">
      {baseOffer ? <p className={isFeatured ? featured.price : "text-2xl font-semibold"}><bdi dir="ltr" className="tabular-nums">{formatOfferPrice(baseOffer)}</bdi> <span className="text-sm font-normal text-subtle">{copy.once}</span></p> : null}
      <p className="text-sm text-subtle">{copy.includes} <bdi dir="ltr">{regularLessons}</bdi> {copy.baseLessons}</p>
      {baseComingSoon ? <p className="text-sm font-semibold">{copy.comingSoon}</p> : baseOffer ? (
        <PurchaseButton locale={locale} offerId={baseOffer.id} courseKey={course.slug} signedIn={commerce.signedIn} signInHref={signInHref} courseHref={courseHref}>{copy.buy}</PurchaseButton>
      ) : <p className="text-sm font-semibold">{copy.priceUnavailable}</p>}
      {preview ? (
        <Link href={lessonHref(course.slug, preview.id)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] underline underline-offset-4">
          <LearningIcon name="play" /> {copy.freeLesson}
        </Link>
      ) : null}
    </section>
  ) : preview ? (
    <Button href={lessonHref(course.slug, preview.id)} className="max-sm:w-full">
      <LearningIcon name="play" />
      {copy.freeLesson}
    </Button>
  ) : null;

  const outcomes = course.learningOutcomes?.length ? (
    <section aria-labelledby="outcomes-title" className={isFeatured ? featured.outcomes : "self-start rounded-md border border-border bg-surface p-5 sm:p-6"}>
      <h2 id="outcomes-title" className="text-xl">{copy.outcomes}</h2>
      <ul role="list" className="mt-4 space-y-3">
        {course.learningOutcomes.map((outcome) => (
          <li key={outcome} className="flex gap-2.5 text-sm leading-relaxed text-subtle">
            <LearningIcon name="check" className="mt-1 size-4 shrink-0 text-[var(--brand-primary)]" />
            <span dir="auto">{outcome}</span>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  const curriculum = (
    <section id="curriculum" aria-labelledby="curriculum-title" className={isFeatured ? featured.curriculum : "min-w-0 space-y-5"}>
      <div className={isFeatured ? featured.sectionHeading : "space-y-1"}>
        <h2 id="curriculum-title" className="text-3xl">{copy.curriculum}</h2>
        <p className="text-sm text-subtle">{copy.curriculumIntro}</p>
      </div>
      <CurriculumList variant={isFeatured ? "featured" : "default"} locale={locale} curriculum={course.curriculum} courseSlug={course.slug} />
      {upgrades.length > 0 && commerce ? (
        <section aria-labelledby="upgrades-title" className="space-y-3 pt-3">
          <h2 id="upgrades-title" className="text-2xl">{copy.premium}</h2>
          <ul role="list" className="space-y-3">
            {upgrades.map(({ module, owned, offer, comingSoon }) => (
              <li key={module.id} className="space-y-3 rounded-sm border border-border bg-surface p-4">
                <h3 className="text-lg"><bdi>{module.title}</bdi></h3>
                {owned ? <p className="text-sm font-semibold text-[var(--brand-primary)]">{copy.moduleOwned}</p> : comingSoon ? <p className="text-sm font-semibold">{copy.comingSoon}</p> : offer ? (
                  <>
                    <p className="text-sm text-subtle"><bdi dir="ltr" className="tabular-nums">{formatOfferPrice(offer)}</bdi> · {copy.once}</p>
                    <PurchaseButton locale={locale} offerId={offer.id} courseKey={course.slug} offerCategory="premium_module" signedIn={commerce.signedIn} signInHref={signInHref} courseHref={courseHref}>{copy.buyModule}</PurchaseButton>
                  </>
                ) : <p className="text-sm font-semibold">{copy.priceUnavailable}</p>}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} lang={locale} className={styles.learning}>
      {commerce ? <CourseFunnelTracker name="course_detail_viewed" locale={locale} courseKey={course.slug} /> : null}
      {isFeatured ? (
        <Container className={featured.featured}>
          <section className={featured.introduction}>
            <div className={featured.editorial}>
              <p className={featured.eyebrow}>{copy.learnWith}</p>
              <h1 className={featured.title}><bdi className={featured.authoredTitle}>{course.title}</bdi></h1>
              <p className={featured.description} dir="auto">{course.description}</p>
              <p className={featured.metadata}>
                <span>{copy.lessonCount}: <bdi dir="ltr">{lessons.length}</bdi></span>
                {info ? <bdi>{info}</bdi> : null}
              </p>
            </div>
            {enrollment ? <aside className={featured.enrollment}>{enrollment}</aside> : null}
            {course.cover.url !== "/images/logo.png" ? (
              <div className={featured.cover}>
                <Image src={course.cover.url} alt={course.cover.alt} fill unoptimized={course.cover.url.startsWith("https://")} sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover object-center" />
              </div>
            ) : null}
          </section>
          {curriculum}
          {outcomes}
        </Container>
      ) : (
        <>
          <section className="border-b border-border bg-[var(--brand-surface)] py-8 sm:py-9">
            <Container className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[var(--brand-primary)]">{copy.learnWith}</p>
                <h1 className="text-display leading-tight"><bdi>{course.title}</bdi></h1>
                <p className="text-lead max-w-[55ch]" dir="auto">{course.description}</p>
                <p className="text-sm text-subtle">{copy.lessonCount}: <bdi dir="ltr">{lessons.length}</bdi>{info ? <> · <bdi>{info}</bdi></> : null}</p>
                {enrollment}
              </div>
              <div className={`relative aspect-[16/10] w-full overflow-hidden rounded-md shadow-sm ${course.cover.url === "/images/logo.png" ? "bg-[var(--brand-background)]" : "bg-[var(--brand-text)]"}`}>
                <Image
                  src={course.cover.url}
                  alt={course.cover.alt}
                  unoptimized={course.cover.url.startsWith("https://")}
                  fill
                  preload
                  sizes="(min-width: 1024px) 44vw, 100vw"
                  className={course.cover.url === "/images/logo.png" ? "object-contain p-8" : "object-cover object-center"}
                />
              </div>
            </Container>
          </section>

          <Container className="grid gap-9 py-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.52fr)] lg:gap-12">
            {curriculum}
            {outcomes}
          </Container>
        </>
      )}
    </div>
  );
}
