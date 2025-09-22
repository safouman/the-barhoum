import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { VideoEmbed } from "@/components/VideoEmbed";
import type { HomeThemeDefinition } from "../types";

export const HomeAbout: HomeThemeDefinition["About"] = ({ locale, media }) => {
  const isRTL = locale === "ar";
  
  // Poetic headline
  const headline = isRTL 
    ? "في كل لحظة صمت، تولد حكمة جديدة"
    : "In every moment of stillness, wisdom is born";
  
  // Flowing narrative paragraph
  const narrative = isRTL
    ? "إبراهيم يؤمن أن التحول الحقيقي يبدأ من الداخل. يرافق القادة والمبدعين في رحلة اكتشاف هادئة، حيث تلتقي الاستراتيجية بالحدس، والوضوح بالشجاعة الناعمة. في كل جلسة، نعيد ترتيب الإيقاع ونصغي لما تهمس به الحكمة الداخلية."
    : "Ibrahim believes true transformation begins from within. He guides leaders and creatives through a quiet journey of discovery, where strategy meets intuition and clarity embraces soft courage. In each session, we reset the rhythm and listen to what inner wisdom whispers.";

  // Video teasing headline
  const videoHeadline = isRTL
    ? "ابدأ بلمحة..."
    : "Begin with a glimpse...";

  const pdfs = media.pdfs.length
    ? media.pdfs
    : Array.from({ length: 3 }, (_, index) => ({
        url: "#",
        label: { en: `Guided approach ${index + 1}`, ar: `منهج موجه ${index + 1}` },
      }));

  const video = media.videos[0];

  return (
    <Section id="about" className="bg-background">
      <Container className="space-y-16">
        {/* Main content block */}
        <div className={clsx(
          "mx-auto max-w-4xl text-center space-y-8",
          isRTL ? "text-right" : "text-left"
        )}>
          {/* Poetic headline */}
          <h2 className="font-heading text-[clamp(1.8rem,4.2vw,3.2rem)] leading-[1.3] text-text font-medium">
            {headline}
          </h2>
          
          {/* Flowing narrative */}
          <div className="mx-auto max-w-3xl">
            <p className="text-body-lg leading-relaxed">
              {narrative}
            </p>
          </div>
          
          {/* Inline PDF links */}
          <div className={clsx(
            "flex flex-wrap items-center justify-center gap-6 text-sm",
            isRTL ? "flex-row-reverse" : ""
          )}>
            {pdfs.slice(0, 3).map((pdf, index) => (
              <a
                key={pdf.url ?? index}
                href={pdf.url}
                className="inline-flex items-center gap-2 text-subtle hover:text-primary transition-colors duration-200 border-b border-transparent hover:border-primary pb-1"
                rel="noopener noreferrer"
                target="_blank"
              >
                <span>{pdf.label[locale] ?? pdf.label.en}</span>
                <span className="text-xs" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </div>

        {/* Video highlight block */}
        {video && (
          <div className="space-y-6">
            {/* Video teasing headline */}
            <div className="text-center">
              <h3 className="font-heading text-[clamp(1.2rem,2.8vw,1.8rem)] text-subtle font-medium">
                {videoHeadline}
              </h3>
            </div>
            
            {/* Centered video with premium styling */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <div className="relative overflow-hidden rounded-2xl shadow-md bg-black">
                  <VideoEmbed videoId={video.id} title={video.title[locale]} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
};