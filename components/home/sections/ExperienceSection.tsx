"use client";
import clsx from "classnames";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Section } from "@/components/Section";
import { Container } from "@/components/Container";

const ExperienceWave = dynamic(
    () => import("./ExperienceWave").then((mod) => mod.ExperienceWave),
    {
        ssr: false,
        loading: () => null,
    }
);

export function HomeExperienceSection() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const listenersAttachedRef = useRef(false);

    const [hasInteracted, setHasInteracted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleAudioPlay = useCallback(() => {
        setIsLoading(false);
        setIsPlaying(true);
    }, []);

    const handleAudioPause = useCallback(() => {
        setIsPlaying(false);
        setIsLoading(false);
    }, []);

    const handleAudioWaiting = useCallback(() => {
        setIsLoading(true);
    }, []);

    const handleAudioCanPlay = useCallback(() => {
        setIsLoading(false);
    }, []);

    const handleAudioError = useCallback(() => {
        setIsLoading(false);
        setIsPlaying(false);
    }, []);

    const ensureAudio = useCallback(() => {
        let audio = audioRef.current;
        if (!audio) {
            audio = new Audio("/audio/experience.wav");
            audio.preload = "none";
            audioRef.current = audio;
        }

        if (audio && !listenersAttachedRef.current) {
            audio.addEventListener("playing", handleAudioPlay);
            audio.addEventListener("pause", handleAudioPause);
            audio.addEventListener("ended", handleAudioPause);
            audio.addEventListener("waiting", handleAudioWaiting);
            audio.addEventListener("canplay", handleAudioCanPlay);
            audio.addEventListener("error", handleAudioError);
            listenersAttachedRef.current = true;
        }

        return audio;
    }, [
        handleAudioCanPlay,
        handleAudioError,
        handleAudioPause,
        handleAudioPlay,
        handleAudioWaiting,
    ]);

    useEffect(() => {
        return () => {
            const audio = audioRef.current;
            if (audio && listenersAttachedRef.current) {
                audio.pause();
                audio.removeEventListener("playing", handleAudioPlay);
                audio.removeEventListener("pause", handleAudioPause);
                audio.removeEventListener("ended", handleAudioPause);
                audio.removeEventListener("waiting", handleAudioWaiting);
                audio.removeEventListener("canplay", handleAudioCanPlay);
                audio.removeEventListener("error", handleAudioError);
                listenersAttachedRef.current = false;
            }
            audioRef.current = null;
        };
    }, [
        handleAudioCanPlay,
        handleAudioError,
        handleAudioPause,
        handleAudioPlay,
        handleAudioWaiting,
    ]);

    const handleButtonClick = useCallback(async () => {
        setHasInteracted(true);
        const audio = ensureAudio();
        if (!audio) return;

        if (!audio.paused && !audio.ended) {
            audio.pause();
            audio.currentTime = 0;
            return;
        }

        try {
            setIsLoading(true);
            audio.preload = "auto";
            await audio.play();
        } catch {
            setIsLoading(false);
        }
    }, [ensureAudio]);

    const buttonLabel = isPlaying ? "إيقاف" : "استمع";

    return (
        <Section id="experience" className="bg-primary/10">
            <Container className="flex min-h-[22rem] flex-col items-center justify-center py-16">
                <div
                    dir="rtl"
                    lang="ar"
                    className="flex w-full max-w-xl flex-col items-center gap-8 text-center"
                >
                    <p className="text-body-lg leading-relaxed text-text md:text-[1.4rem] md:leading-[1.9]">
                        بما أنك وصلت إلى هنا، حان الوقت أن نتحدث. ضع سماعتك
                        واضغط استمع.
                    </p>

                    <div className="flex flex-col items-center gap-5">
                        <button
                            type="button"
                            onClick={handleButtonClick}
                            aria-pressed={isPlaying}
                            aria-label="التبديل بين تشغيل وإيقاف التجربة الصوتية"
                            aria-busy={isLoading}
                            className={clsx(
                                "inline-flex min-w-[9rem] items-center justify-center rounded-full bg-primary px-10 py-3 text-base font-semibold tracking-[0.2em] text-white transition-all duration-200 ease-out",
                                "hover:scale-[1.02] hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60",
                                isPlaying &&
                                    "shadow-[0_16px_30px_-18px_rgba(24,159,151,0.7)]",
                                isLoading && "cursor-wait opacity-80"
                            )}
                            disabled={isLoading}
                        >
                            {buttonLabel}
                        </button>

                        {(hasInteracted || isPlaying) && (
                            <ExperienceWave active={isPlaying} />
                        )}
                    </div>
                </div>
            </Container>
        </Section>
    );
}
