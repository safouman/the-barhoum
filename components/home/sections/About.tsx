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
  
  // Flowing narrative paragraph
  const narrative = isRTL
    ? "يؤمن إبراهيم أنّ التحوّل الحقيقي يبدأ من الداخل. يرافق القادة والمبدعين في رحلةٍ هادئةٍ من الاكتشاف، حيث تلتقي البصيرة بالاستراتيجية، والوضوح بالشجاعة الناعمة. في كل جلسة نعيد ترتيب الإيقاع لنستمع إلى ما تهمس به الحكمة الداخلية."
    : "Ibrahim believes true transformation begins from within. He guides leaders and creatives through a quiet journey of discovery, where strategy meets intuition and clarity embraces soft courage. In each session, we reset the rhythm and listen to what inner wisdom whispers.";

  // Video teasing headline
  const videoHeadline = isRTL
    ? "ابدأ بلمحة…"
    : "Begin with a glimpse...";

  const pdfs = media.pdfs.length
    ? media.pdfs
    : Array.from({ length: 3 }, (_, index) => ({
        url: "#",
        label: { en: `Guided approach ${index + 1}`, ar: `ملف تعريفي` },
      }));

  const video = media.videos[0];

  return (
    <Section id="about" className="bg-background">
      <Container className="space-y-12">
        {/* Main content block */}
        <div className={clsx(
          "mx-auto max-w-4xl space-y-6",
          isRTL ? "text-right" : "text-left"
        )}>
          {/* Poetic headline */}
          <h2 className={clsx(
            "font-heading text-text",
            isRTL 
              ? "text-[clamp(1.6rem,3.8vw,2.8rem)] leading-[1.25] font-semibold" 
              : "text-[clamp(1.8rem,4.2vw,3.2rem)] leading-[1.3] font-medium"
          )}>
            {headline}
          </h2>
          
          {/* Flowing narrative */}
          <div className="mx-auto max-w-3xl">
            <p className={clsx(
              "text-body-lg",
              isRTL ? "leading-[1.95]" : "leading-relaxed"
            )}>
              {narrative}
            </p>
          </div>
          
          {/* Single inline PDF link */}
          <div className={clsx(
            "text-sm",
            isRTL ? "text-right" : "text-center"
          )}>
            <a
              href={pdfs[0]?.url ?? "#"}
              className="inline-flex items-center gap-2 text-subtle hover:text-primary transition-colors duration-200 border-b border-transparent hover:border-primary pb-1"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>{isRTL ? "ملف تعريفي" : pdfs[0]?.label.en ?? "Intro deck"}</span>
              <span className="text-xs" aria-hidden="true">{isRTL ? "←" : "→"}</span>
            </a>
          </div>
        </div>

        {/* Video highlight block */}
        {video && (
          <div className="space-y-4 pt-4">
            {/* Video teasing headline */}
            <div className={clsx(
              isRTL ? "text-right" : "text-center"
            )}>
              <h3 className="font-heading text-[clamp(1.1rem,2.4vw,1.5rem)] text-subtle font-medium">
                {videoHeadline}
              </h3>
            </div>
            
            {/* Centered video with premium styling */}
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