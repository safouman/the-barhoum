import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { VideoEmbed } from "@/components/VideoEmbed";
import type { HomeThemeDefinition } from "../types";

export const HomeAbout: HomeThemeDefinition["About"] = ({ locale, media }) => {
  const isRTL = locale === "ar";
  
  // Poetic headline
  const headline = isRTL 
    ? "في كل لحظةِ صمت، تولدُ حكمةٌ جديدة"
    : "In every moment of stillness, wisdom is born";
  
  // Flowing narrative paragraph with inline link
  const narrativeStart = isRTL
    ? "يؤمن إبراهيم أنّ التحوّل الحقيقي يبدأ من الداخل. يرافق القادة والمبدعين في رحلةٍ هادئةٍ من الاكتشاف، حيث تلتقي البصيرة بالاستراتيجية، والوضوح بالشجاعة الناعمة. في كل جلسة نعيد ترتيب الإيقاع لنستمع إلى ما تهمس به الحكمة الداخلية"
    : "Ibrahim believes true transformation begins from within. He guides leaders and creatives through a quiet journey of discovery, where strategy meets intuition and clarity embraces soft courage. In each session, we reset the rhythm and listen to what inner wisdom whispers";

  const linkText = isRTL ? "ملف تعريفي" : "intro deck";
  const linkArrow = isRTL ? " ←" : " →";

  // Small bridge line above video
  const videoBridge = isRTL
    ? "ابدأ بلمحة"
    : "begin with a glimpse";

  const pdfs = media.pdfs.length
    ? media.pdfs
    : Array.from({ length: 1 }, () => ({
        url: "#",
        label: { en: "Guided approach", ar: "ملف تعريفي" },
      }));

  const video = media.videos[0];

  return (
    <Section id="about" className="bg-background">
      <Container>
        {/* Unified content block */}
        <div className={clsx(
          "mx-auto max-w-4xl space-y-8",
          isRTL ? "text-right" : "text-center"
        )}>
          {/* Quote headline */}
          <h2 className={clsx(
            "font-heading text-text",
            isRTL 
              ? "text-[clamp(1.6rem,3.8vw,2.8rem)] leading-[1.25] font-semibold" 
              : "text-[clamp(1.8rem,4.2vw,3.2rem)] leading-[1.3] font-medium"
          )}>
            {headline}
          </h2>
          
          {/* Narrative with inline link */}
          <div className="mx-auto max-w-3xl">
            <p className={clsx(
              "text-body-lg",
              isRTL ? "leading-[1.95]" : "leading-relaxed"
            )}>
              {narrativeStart}
              {" — "}
              <a
                href={pdfs[0]?.url ?? "#"}
                className="text-subtle hover:text-primary transition-colors duration-200 border-b border-transparent hover:border-primary"
                rel="noopener noreferrer"
                target="_blank"
              >
                {linkText}
                <span className="text-xs" aria-hidden="true">{linkArrow}</span>
              </a>
            </p>
          </div>
        </div>

        {/* Video block with tight connection */}
        {video && (
          <div className="mt-10 space-y-3">
            {/* Small bridge line */}
            <div className={clsx(
              "text-center",
              isRTL ? "text-right" : ""
            )}>
              <p className="text-sm text-subtle font-light tracking-wide">
                {videoBridge}
              </p>
            </div>
            
            {/* Video embed */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <div className="relative overflow-hidden rounded-2xl shadow-md bg-black">
                  <VideoEmbed 
                    videoId={video.id} 
                    title={isRTL ? "قصة إبراهيم – من الاكتئاب إلى النجاح" : video.title[locale]} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
};