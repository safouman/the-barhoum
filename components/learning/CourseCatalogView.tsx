import { Container } from "@/components/Container";
import type { Locale } from "@/lib/content";
import type { CourseCommerce } from "@/components/commerce/checkout";
import type { CourseSummary } from "@/lib/learning/contracts";
import { CourseCard } from "./CourseCard";
import { catalogCopy } from "./catalog-copy";
import styles from "./Catalog.module.css";

export function CourseCatalogView({ entries, locale = "ar" }: {
  entries: Array<{ course: CourseSummary; commerce?: CourseCommerce }>;
  locale?: Locale;
}) {
  const copy = catalogCopy[locale];

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} lang={locale} className={`brand-experience ${styles.catalog}`}>
      <section className={styles.introduction}>
        <Container>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.description}>{copy.description}</p>
        </Container>
      </section>
      <Container className={styles.content}>
        {entries.length ? (
          <ul aria-label={copy.available} className={styles.grid}>
            {entries.map(({ course, commerce }) => (
              <li key={course.slug}>
                <CourseCard course={course} commerce={commerce} locale={locale} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>{copy.empty}</p>
        )}
      </Container>
    </div>
  );
}
