"use client";

import clsx from "classnames";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { VideoEmbed } from "@/components/VideoEmbed";
import type { HomeData, Locale } from "@/lib/content";

interface HomeIntroVideoProps {
    locale: Locale;
    media: HomeData["media"];
}

export const HomeIntroVideo = ({ locale, media }: HomeIntroVideoProps) => {
    const primaryVideo = media.videos[0];

    if (!primaryVideo) {
        return null;
    }

    const isRTL = locale === "ar";

    return (
        <Section
            id="intro-video"
            className="bg-background"
            data-analytics-section="IntroVideo"
            data-analytics-engage="true"
        >
            <Container className="py-16 sm:py-20 md:py-24">
                <div
                    className={clsx(
                        "mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-10 xl:px-12 text-center",
                        isRTL ? "space-y-6" : "space-y-8"
                    )}
                    dir={isRTL ? "rtl" : "ltr"}
                >
                    <div className="flex justify-center">
                        <div className="w-full max-w-2xl">
                            <VideoEmbed
                                videoId={primaryVideo.id}
                                src={primaryVideo.src}
                                fallbackSrc={primaryVideo.fallback}
                                title={primaryVideo.title[locale]}
                                poster={primaryVideo.poster}
                            />
                        </div>
                    </div>
                </div>
            </Container>
        </Section>
    );
};
