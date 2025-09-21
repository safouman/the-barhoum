import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { VideoEmbed } from "@/components/VideoEmbed";
import type { HomeThemeDefinition } from "../types";

export const About: HomeThemeDefinition["About"] = ({ locale, media }) => {
  const isRTL = locale === "ar";
  const title = isRTL ? "شكونو ابراهيم بن عبد الله" : "Who is Barhoum?";
  const intro = isRTL
    ? "لوريم إيبسوم نص تجريبي يصف إبراهيم كقائد ومدرب وفنان يمزج الدقة الاستراتيجية باللمسة الإنسانية. يقدم مساحة هادئة لالتقاط الأنفاس وإعادة ترتيب الإيقاع، ويقود مسارات عملية تظل وفية للذات."
    : "Barhoum is a grounded coach, strategist, and artist who blends decisive frameworks with empathic listening. He choreographs calm confidence, builds rituals that hold in high-stakes environments, and keeps the human story at the center of every transformation.";

  const pdfs = media.pdfs.length
    ? media.pdfs
    : Array.from({ length: 4 }, (_, index) => ({
        url: "#",
        label: { en: `Guided dossier ${index + 1}`, ar: `ملف موجه ${index + 1}` },
      }));

  const video = media.videos[0];

  return (
    <Section title={title} className="bg-background">
      <Container
        className={clsx(
          "grid gap-12",
          "lg:grid-cols-[minmax(0,60ch)_minmax(0,1fr)]",
          isRTL && "text-right"
        )}
      >
        <div className="space-y-8">
          <p
            className={clsx(
              "text-[clamp(1.15rem,2.1vw,1.35rem)] leading-[1.82] text-[#3b3b39]",
              isRTL ? "font-[var(--font-cairo)]" : "font-[var(--font-inter)]"
            )}
          >
            {intro}
          </p>
          <ul className={clsx("space-y-3 text-sm", isRTL ? "pr-4" : "pl-4")}>
            {pdfs.slice(0, 5).map((pdf, index) => (
              <li key={pdf.url ?? index} className="flex items-center gap-3 text-[#1d1c1a]">
                <span aria-hidden className="text-[#8d8d88]">•</span>
                <a
                  href={pdf.url}
                  className="border-b border-[rgba(29,28,26,0.2)] pb-1 transition hover:border-[#000] hover:text-[#000]"
                  rel="noopener noreferrer"
                >
                  {pdf.label[locale] ?? pdf.label.en}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {video ? (
          <div className="relative isolate flex items-center justify-center">
            <div
              className="absolute inset-6 rounded-full bg-[radial-gradient(circle,_rgba(16,16,16,0.05),_transparent_70%)]"
              aria-hidden
            />
            <div className="relative w-full max-w-[560px]">
              <VideoEmbed videoId={video.id} title={video.title[locale]} />
            </div>
          </div>
        ) : null}
      </Container>
    </Section>
  );
};
