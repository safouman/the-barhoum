import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { VideoEmbed } from "@/components/VideoEmbed";
import type { HomeThemeDefinition } from "../types";

export const HomeAbout: HomeThemeDefinition["About"] = ({ locale, media }) => {
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
          isRTL ? "text-right" : "text-left"
        )}
      >
        <div className="space-y-8">
          <p className="text-body-lg">
            {intro}
          </p>
          <ul className={clsx("space-y-3", isRTL ? "pr-4" : "pl-4", "text-label")}>
            {pdfs.slice(0, 5).map((pdf, index) => (
              <li key={pdf.url ?? index} className="flex items-center gap-3 text-text">
                <span aria-hidden className="text-subtle">•</span>
                <a
                  href={pdf.url}
                  className="border-b border-border pb-1 text-subtle transition hover:border-text hover:text-text"
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
