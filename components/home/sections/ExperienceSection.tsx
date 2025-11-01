"use client";
import clsx from "classnames";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Section } from "@/components/Section";
import { Container } from "@/components/Container";
import { useLocale } from "@/providers/locale-provider";
import { event } from "@/lib/analytics";

const ExperienceWave = dynamic(
    () => import("./ExperienceWave").then((mod) => mod.ExperienceWave),
    {
        ssr: false,
        loading: () => null,
    }
);

export function HomeExperienceSection() {
    const { locale, direction } = useLocale();
    const isRtl = direction === "rtl";
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const listenersAttachedRef = useRef(false);
    const audioPlayedRef = useRef(false);
    const audioCompletedRef = useRef(false);

    const [hasInteracted, setHasInteracted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showButton, setShowButton] = useState(true);
    const [showWave, setShowWave] = useState(false);

    const buttonRestoreTimeoutRef = useRef<number | null>(null);

    const handleAudioPlay = useCallback(() => {
        setIsLoading(false);
        setIsPlaying(true);
        if (!audioPlayedRef.current) {
            audioPlayedRef.current = true;
            event("audio_played", { section: "Experience" });
        }
        if (buttonRestoreTimeoutRef.current) {
            window.clearTimeout(buttonRestoreTimeoutRef.current);
            buttonRestoreTimeoutRef.current = null;
        }
        setShowButton(false);
        setShowWave(true);
    }, []);

    const handleAudioPause = useCallback(() => {
        setIsPlaying(false);
        setIsLoading(false);
        setShowWave(false);
        if (buttonRestoreTimeoutRef.current) {
            window.clearTimeout(buttonRestoreTimeoutRef.current);
        }
        buttonRestoreTimeoutRef.current = window.setTimeout(() => {
            setShowButton(true);
        }, 400);
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
        setShowWave(false);
        if (buttonRestoreTimeoutRef.current) {
            window.clearTimeout(buttonRestoreTimeoutRef.current);
            buttonRestoreTimeoutRef.current = null;
        }
        setShowButton(true);
    }, []);

    const handleAudioTimeUpdate = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || audioCompletedRef.current) return;
        const duration = audio.duration;
        if (!duration || Number.isNaN(duration)) return;
        const progress = audio.currentTime / duration;
        if (progress >= 0.95) {
            audioCompletedRef.current = true;
            event("audio_completed", {
                section: "Experience",
                duration: Math.round(duration),
            });
        }
    }, []);

    const ensureAudio = useCallback(() => {
        let audio = audioRef.current;
        if (!audio) {
            const element = new Audio();
            element.preload = "none";
            const sources: Array<{ src: string; type: string }> = [
                { src: "/audio/experience.wav", type: "audio/wav" },
            ];
            const preferred =
                sources.find(({ type }) => element.canPlayType(type)) ??
                sources[0];
            element.src = preferred.src;
            audioRef.current = element;
            audio = element;
        }

        if (audio && !listenersAttachedRef.current) {
            audio.addEventListener("playing", handleAudioPlay);
            audio.addEventListener("pause", handleAudioPause);
            audio.addEventListener("ended", handleAudioPause);
            audio.addEventListener("waiting", handleAudioWaiting);
            audio.addEventListener("canplay", handleAudioCanPlay);
            audio.addEventListener("error", handleAudioError);
            audio.addEventListener("timeupdate", handleAudioTimeUpdate);
            listenersAttachedRef.current = true;
        }

        return audio;
    }, [
        handleAudioCanPlay,
        handleAudioError,
        handleAudioPause,
        handleAudioPlay,
        handleAudioTimeUpdate,
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
                audio.removeEventListener("timeupdate", handleAudioTimeUpdate);
                listenersAttachedRef.current = false;
            }
            if (buttonRestoreTimeoutRef.current) {
                window.clearTimeout(buttonRestoreTimeoutRef.current);
                buttonRestoreTimeoutRef.current = null;
            }
            audioRef.current = null;
        };
    }, [
        handleAudioCanPlay,
        handleAudioError,
        handleAudioPause,
        handleAudioPlay,
        handleAudioTimeUpdate,
        handleAudioWaiting,
    ]);

    const handleButtonClick = useCallback(async () => {
        setHasInteracted(true);
        setShowButton(false);
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
            setShowWave(false);
            setShowButton(true);
        }
    }, [ensureAudio]);

    return (
        <Section
            id="experience"
            className="bg-primary/10"
            data-analytics-section="Experience"
        >
            <Container className="flex min-h-[28rem] flex-col items-center justify-center py-10">
                <div
                    dir={direction}
                    lang={locale}
                    className="flex w-full max-w-3xl flex-col items-center gap-10 text-center"
                >
                    <p className="text-body-lg leading-relaxed text-text md:text-[1.4rem] md:leading-[1.9]">
                        بما أنك وصلت إلى هنا، حان الوقت أن نتحدث. ضع سماعتك
                        واضغط استمع.
                    </p>

                    <div className="flex w-full flex-col items-center gap-8">
                        <button
                            type="button"
                            onClick={handleButtonClick}
                            aria-pressed={isPlaying}
                            aria-label="بدء التجربة الصوتية"
                            aria-busy={isLoading}
                            className={clsx(
                                "min-w-[9rem] items-center justify-center rounded-full bg-primary px-10 py-3 text-base font-semibold text-white shadow-[0_4px_20px_rgba(51,196,182,0.25)] transition duration-300 ease-in-out",
                                isRtl ? "flex" : "inline-flex tracking-[0.2em]",
                                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60",
                                showButton
                                    ? "opacity-100 translate-y-0"
                                    : "pointer-events-none opacity-0 -translate-y-2",
                                isLoading && "cursor-wait opacity-80"
                            )}
                            disabled={isLoading || !showButton}
                        >
                            استمع
                        </button>

                        {(hasInteracted || showWave) && (
                            <div className="flex w-full items-center justify-center">
                                <ExperienceWave
                                    active={showWave}
                                    audioElement={audioRef.current}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </Section>
    );
}
