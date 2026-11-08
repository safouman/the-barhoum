import Image from "next/image";
import Link from "next/link";
import type { CourseDetail, CourseSummary } from "@/lib/learning/contracts";
import { formatOfferPrice, type CourseCommerce } from "@/components/commerce/checkout";
import { LearningIcon } from "./LearningIcon";

type CardCourse = CourseSummary & Pick<CourseDetail, "estimatedDuration" | "difficulty" | "category">;

export function CourseCard({ course, commerce, owned = commerce?.ownership.base ?? false }: { course: CardCourse; commerce?: CourseCommerce; owned?: boolean }) {
  const metadata = [course.category, course.estimatedDuration, course.difficulty]
    .filter(Boolean)
    .join(" · ");

  const offer = commerce?.offers.find(({ moduleId }) => moduleId === null);
  const comingSoon = commerce?.comingSoonOffers?.includes(null);
  const priceUnavailable = commerce?.unavailableOffers?.includes(null);

  return (
    <Link
      href={`/courses/${encodeURIComponent(course.slug)}`}
      className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-background transition-colors hover:border-[#12685f] focus-visible:!outline-[#12685f]"
    >
      <div className="relative aspect-video bg-surface">
        <Image
          src={course.cover.url}
          alt={course.cover.alt}
          unoptimized={course.cover.url.startsWith("https://")}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        {metadata ? <p className="text-xs font-medium text-[#12685f]"><bdi>{metadata}</bdi></p> : null}
        <h2 className="text-xl leading-tight"><bdi>{course.title}</bdi></h2>
        <p className="line-clamp-3 text-sm leading-relaxed text-subtle" dir="auto">{course.description}</p>
        {owned || comingSoon || offer || priceUnavailable ? (
          <p className="text-sm font-semibold text-[#12685f]">
            {owned ? "ضمن دوراتك" : comingSoon ? "قريبًا" : offer ? <bdi dir="ltr" className="tabular-nums">{formatOfferPrice(offer)}</bdi> : "السعر غير متاح حاليًا"}
          </p>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-2 pt-3 text-sm font-semibold text-[#12685f] underline-offset-4 group-hover:underline">
          {owned ? "تابع التعلّم" : "عرض الدورة"}
          <LearningIcon name="left" />
        </span>
      </div>
    </Link>
  );
}
