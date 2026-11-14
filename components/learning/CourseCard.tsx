import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/content";
import type { CourseDetail, CourseSummary } from "@/lib/learning/contracts";
import { formatOfferPrice, type CourseCommerce } from "@/components/commerce/checkout";
import { catalogCopy } from "./catalog-copy";
import { LearningIcon } from "./LearningIcon";
import styles from "./Catalog.module.css";

type CardCourse = CourseSummary & Pick<CourseDetail, "estimatedDuration" | "difficulty" | "category">;

export function CourseCard({ course, commerce, owned = commerce?.ownership.base ?? false, locale = "ar" }: {
  course: CardCourse;
  commerce?: CourseCommerce;
  owned?: boolean;
  locale?: Locale;
}) {
  const copy = catalogCopy[locale];
  const metadata = [course.category, course.estimatedDuration, course.difficulty]
    .filter(Boolean)
    .join(" · ");
  const offer = commerce?.offers.find(({ moduleId }) => moduleId === null);
  const comingSoon = commerce?.comingSoonOffers?.includes(null);
  const priceUnavailable = commerce?.unavailableOffers?.includes(null);

  return (
    <Link
      href={`/courses/${encodeURIComponent(course.slug)}`}
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={styles.card}
    >
      <div className={styles.cover}>
        <Image
          src={course.cover.url}
          alt={course.cover.alt}
          unoptimized={course.cover.url.startsWith("https://")}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={styles.coverImage}
        />
      </div>
      <div className={styles.cardBody}>
        {metadata ? <p className={styles.metadata}><bdi>{metadata}</bdi></p> : null}
        <h2 className={styles.cardTitle}><bdi>{course.title}</bdi></h2>
        <p className={styles.cardDescription} dir="auto">{course.description}</p>
        {owned || comingSoon || offer || priceUnavailable ? (
          <p className={styles.price}>
            {owned ? copy.owned : comingSoon ? copy.comingSoon : offer ? <bdi dir="ltr" className="tabular-nums">{formatOfferPrice(offer)}</bdi> : copy.priceUnavailable}
          </p>
        ) : null}
        <span className={styles.action}>
          {owned ? copy.continueLearning : copy.viewCourse}
          <LearningIcon name={locale === "ar" ? "left" : "right"} />
        </span>
      </div>
    </Link>
  );
}
