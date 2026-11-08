import Image from "next/image";
import Link from "next/link";
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

export function CourseDetailView({ course, commerce, progress }: { course: CourseDetail; commerce?: CourseCommerce; progress?: CourseProgressView | null }) {
  const lessons = orderedLessons(course.curriculum);
  const preview = lessons.find(({ access }) => access === "free");
  const firstOwned = commerce?.ownership.base ? lessons.find(({ access }) => access === "unlocked") ?? preview : undefined;
  const baseOffer = commerce?.offers.find(({ moduleId }) => moduleId === null);
  const baseComingSoon = commerce?.comingSoonOffers?.includes(null);
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
    return owned || offer || comingSoon ? [{ module, owned, offer, comingSoon }] : [];
  }) : [];
  const info = [
    course.estimatedDuration,
    course.difficulty,
  ].filter(Boolean).join(" · ");

  return (
    <div dir="rtl" lang="ar" className="text-text">
      <section className="border-b border-border bg-[#f2f8f6] py-8 sm:py-9">
        <Container className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-[#12685f]">تعلّم مع برهوم</p>
            <h1 className="text-display leading-tight"><bdi>{course.title}</bdi></h1>
            <p className="text-lead max-w-[55ch]" dir="auto">{course.description}</p>
            <p className="text-sm text-subtle">عدد الدروس: <bdi dir="ltr">{lessons.length}</bdi>{info ? <> · <bdi>{info}</bdi></> : null}</p>
            {commerce?.ownership.base ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#12685f]">هذه الدورة ضمن دوراتك</p>
                {progress ? <ProgressMeter label="تقدّمك في الدورة" count={progress.courseProgress.base} /> : null}
                {progress?.continueTarget ? (
                  <Button href={progress.continueTarget.href} className="!text-[#14312e] max-sm:w-full">
                    {progress.continueState === "review" ? "راجع الدورة" : progress.continueState === "start" ? "ابدأ الدورة" : "تابع التعلّم"}
                  </Button>
                ) : firstOwned ? (
                  <Button href={lessonHref(course.slug, firstOwned.id)} className="!text-[#14312e] max-sm:w-full">تابع التعلّم</Button>
                ) : null}
              </div>
            ) : (baseOffer || baseComingSoon) && commerce ? (
              <section aria-label="شراء الدورة" className="space-y-3 rounded-sm border border-border bg-white p-4">
                {baseOffer ? <p className="text-2xl font-semibold"><bdi dir="ltr" className="tabular-nums">{formatOfferPrice(baseOffer)}</bdi> <span className="text-sm font-normal text-subtle">دفعة واحدة</span></p> : null}
                <p className="text-sm text-subtle">تشمل الدورة <bdi dir="ltr">{regularLessons}</bdi> من الدروس الأساسية، بما فيها أي دروس أساسية تضاف لاحقًا. الوحدات الإضافية تُشترى بشكل منفصل.</p>
                {baseComingSoon ? <p className="text-sm font-semibold">قريبًا</p> : baseOffer ? (
                  <PurchaseButton offerId={baseOffer.id} signedIn={commerce.signedIn} signInHref={signInHref} courseHref={courseHref}>اشترِ الدورة</PurchaseButton>
                ) : null}
                {preview ? (
                  <Link href={lessonHref(course.slug, preview.id)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#12685f] underline underline-offset-4">
                    <LearningIcon name="play" /> شاهد الدرس المجاني
                  </Link>
                ) : null}
              </section>
            ) : preview ? (
              <Button href={lessonHref(course.slug, preview.id)} className="!text-[#14312e] max-sm:w-full">
                <LearningIcon name="play" />
                شاهد الدرس المجاني
              </Button>
            ) : null}
          </div>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-[#14312e] shadow-sm">
            <Image
              src={course.cover.url}
              alt={course.cover.alt}
              unoptimized={course.cover.url.startsWith("https://")}
              fill
              preload
              sizes="(min-width: 1024px) 44vw, 100vw"
              className="object-cover object-center"
            />
          </div>
        </Container>
      </section>

      <Container className="grid gap-9 py-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.52fr)] lg:gap-12">
        <section id="curriculum" aria-labelledby="curriculum-title" className="min-w-0 space-y-5">
          <div className="space-y-1">
            <h2 id="curriculum-title" className="text-3xl">محتوى الدورة</h2>
            <p className="text-sm text-subtle">تصفّح الدروس بالترتيب أو ابدأ بالدرس المجاني.</p>
          </div>
          <CurriculumList curriculum={course.curriculum} courseSlug={course.slug} />
          {upgrades.length > 0 && commerce ? (
            <section aria-labelledby="upgrades-title" className="space-y-3 pt-3">
              <h2 id="upgrades-title" className="text-2xl">الوحدات الإضافية</h2>
              <ul role="list" className="space-y-3">
                {upgrades.map(({ module, owned, offer, comingSoon }) => (
                  <li key={module.id} className="space-y-3 rounded-sm border border-border bg-surface p-4">
                    <h3 className="text-lg"><bdi>{module.title}</bdi></h3>
                    {owned ? <p className="text-sm font-semibold text-[#12685f]">لديك وصول إلى هذه الوحدة</p> : comingSoon ? <p className="text-sm font-semibold">قريبًا</p> : offer ? (
                      <>
                        <p className="text-sm text-subtle"><bdi dir="ltr" className="tabular-nums">{formatOfferPrice(offer)}</bdi> · دفعة واحدة</p>
                        <PurchaseButton offerId={offer.id} signedIn={commerce.signedIn} signInHref={signInHref} courseHref={courseHref}>اشترِ الوحدة</PurchaseButton>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
        {course.learningOutcomes?.length ? (
          <section aria-labelledby="outcomes-title" className="self-start rounded-md border border-border bg-surface p-5 sm:p-6">
            <h2 id="outcomes-title" className="text-xl">ماذا ستتعلّم؟</h2>
            <ul role="list" className="mt-4 space-y-3">
              {course.learningOutcomes.map((outcome) => (
                <li key={outcome} className="flex gap-2.5 text-sm leading-relaxed text-subtle">
                  <LearningIcon name="check" className="mt-1 size-4 shrink-0 text-[#12685f]" />
                  <span dir="auto">{outcome}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </div>
  );
}
