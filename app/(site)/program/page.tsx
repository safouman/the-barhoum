import Link from "next/link";
import { brandCopy } from "@/lib/brand-copy";
import { resolveLocale } from "@/lib/i18n.server";
import styles from "@/components/brand/Program.module.css";

const modules = [
  ["Understand Yourself to Act Better", "What shapes my reactions, decisions, and professional presence?"],
  ["Decode Organizational Dynamics", "How do I read colleagues, managers, culture, and unwritten rules?"],
  ["Communicate with Intelligence", "How do I explain, set boundaries, and influence decisions?"],
  ["Master Your Presence in Meetings", "How can I contribute, ask questions, and be heard without chairing?"],
  ["Manage Pressure & Difficult Relationships", "How do I handle conflict, criticism, and unrealistic AI-related requests?"],
  ["Build Your Professional Growth Plan", "How do I turn expertise, judgment, and relationships into career growth?"],
] as const;

export const metadata = { title: "The Program | Ibrahim Ben Abdallah" };

export default async function ProgramPage() {
  const locale = await resolveLocale();
  const copy = brandCopy[locale];
  return (
    <article className={styles.program} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <h1>{copy.pages.program.title}</h1>
      <p className={styles.intro}>{copy.pages.program.intro}</p>
      <ol className={styles.modules}>
        {modules.map(([title, question], index) => (
          <li key={title}>
            <span className={styles.number}><bdi dir="ltr">{String(index + 1).padStart(2, "0")}</bdi></span>
            <div lang="en" dir="ltr"><h2>{title}</h2><p>{question}</p></div>
            <span lang="en" dir="ltr">60 min</span>
          </li>
        ))}
      </ol>
      <p className={styles.status} lang="en" dir="ltr">Development preview. Course lessons and videos will be clearly labeled placeholders until approved learning materials are available.</p>
      <Link href="/courses" className={styles.link}>{copy.nav.courses} <span aria-hidden="true">→</span></Link>
    </article>
  );
}
