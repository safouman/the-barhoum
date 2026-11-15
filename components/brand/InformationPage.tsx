import Link from "next/link";
import { BrandIcon } from "./BrandIcon";
import type { BrandIconName } from "@/lib/brand-icons";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/content";
import styles from "./InformationPage.module.css";

export type InformationSection = { title: string; paragraphs: string[]; icon?: BrandIconName };
export type InformationResource = { href: string; title: string; description: string; icon?: BrandIconName };

export function InformationPage({
  locale, eyebrow, title, intro, sections, children,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  intro: string;
  sections: InformationSection[];
  children?: ReactNode;
}) {
  return (
    <article className={styles.page} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p className={styles.intro}>{intro}</p>
      </header>
      <div className={styles.sections}>
        {sections.map((section) => (
          <section key={section.title} className={styles.section}>
            {section.icon ? <div className={styles.sectionHeading}><BrandIcon name={section.icon} /><h2>{section.title}</h2></div> : <h2>{section.title}</h2>}
            <div>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          </section>
        ))}
      </div>
      {children}
    </article>
  );
}

export function InformationAction({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className={styles.action}>{children}<span aria-hidden="true">→</span></Link>;
}

export function InformationResources({ resources, linkLabel }: { resources: InformationResource[]; linkLabel: string }) {
  return (
    <ul className={styles.resources}>
      {resources.map(({ href, title, description, icon }) => (
        <li key={href}>
          {icon ? <BrandIcon name={icon} /> : null}
          <h2>{title}</h2>
          <p>{description}</p>
          <Link href={href} className={styles.resourceLink}>
            {linkLabel}<span className={styles.srOnly}> — {title}</span><span aria-hidden="true">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
