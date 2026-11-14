import "server-only";
import Link from "next/link";
import { headers } from "next/headers";
import type { Locale } from "@/lib/content";
import { safeReturnTo } from "@/lib/student-auth/return-to";
import { getPublishedCourse } from "@/lib/learning/payload-reader";
import { readCourseCommerce } from "@/lib/commerce/course-payments/offers";
import { purchaseAvailability } from "@/lib/commerce/course-payments/eligibility";
import { formatOfferPrice } from "@/components/commerce/checkout";
import { catalogCopy } from "@/components/learning/catalog-copy";
import styles from "./StudentUI.module.css";

// Interface translations remain subject to owner review; authored course text is not translated.
const copy = {
  en: { label: "Your course", note: "After signing in, you’ll return to this course.", back: "Return to course" },
  ar: { label: "دورتك", note: "بعد تسجيل الدخول، ستعود إلى هذه الدورة.", back: "العودة إلى الدورة" },
  fr: { label: "Votre cours", note: "Après la connexion, vous retrouverez ce cours.", back: "Retour au cours" },
};

async function readContext(slug: string, locale: Locale) {
  try {
    const [course, requestHeaders] = await Promise.all([getPublishedCourse(slug), headers()]);
    if (!course) return null;
    const commerce = await readCourseCommerce(course.id, undefined, purchaseAvailability(requestHeaders), "catalog");
    const offer = commerce.offers.find(({ moduleId }) => moduleId === null);
    return { title: course.title, price: offer ? formatOfferPrice(offer) : null, unavailable: commerce.comingSoonOffers?.includes(null) ? catalogCopy[locale].comingSoon : catalogCopy[locale].priceUnavailable };
  } catch {
    // This read-only summary must never prevent account access during provider outages.
    return null;
  }
}

export async function AuthCourseContext({ returnTo, locale }: { returnTo: string; locale: Locale }) {
  const destination = safeReturnTo(returnTo);
  const slug = /^\/courses\/([a-z0-9-]+)(?:\/lessons\/[a-zA-Z0-9_-]+)?$/.exec(destination)?.[1];
  if (!slug) return null;
  const text = copy[locale];
  const context = await readContext(slug, locale);
  return (
    <aside aria-label={text.label} className={styles.courseContext}>
      <p>{text.label}</p>
      {context ? <>
        <h2 className={styles.courseTitle}><bdi>{context.title}</bdi></h2>
        <p className={styles.contextPrice}>{context.price ? <bdi dir="ltr">{context.price}</bdi> : context.unavailable}</p>
      </> : null}
      <p className={styles.contextNote}>{text.note}</p>
      <Link href={destination} className={styles.contextLink}>{text.back}</Link>
    </aside>
  );
}
