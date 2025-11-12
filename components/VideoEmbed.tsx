"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { event } from "@/lib/analytics";

interface VideoEmbedProps {
    videoId?: string;
    src?: string;
    fallbackSrc?: string;
    title: string;
    poster?: string;
}

export function VideoEmbed({
    videoId,
    src,
    fallbackSrc,
    title,
    poster,
}: VideoEmbedProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hasPreloadedRef = useRef(false);
    const hasTrackedStartRef = useRef(false);
    const hasTrackedPlayRef = useRef(false);
    const hasTrackedCompletionRef = useRef(false);

    const thumbnail = useMemo(
        () =>
            videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null,
        [videoId]
    );

    const posterSource = poster ?? thumbnail ?? undefined;
    const analyticsId = videoId ?? src ?? title;
    const isHlsSource = useMemo(
        () => Boolean(src?.toLowerCase().endsWith(".m3u8")),
        [src]
    );
    const hasDirectSource = useMemo(
        () => Boolean(src || fallbackSrc),
        [fallbackSrc, src]
    );
    const analyticsSource = useMemo(() => {
        if (hasDirectSource) {
            return isHlsSource ? "hls" : "file";
        }
        return videoId ? "youtube" : "unknown";
    }, [hasDirectSource, isHlsSource, videoId]);

    const resetTrackingRefs = useCallback(() => {
        hasTrackedStartRef.current = false;
        hasTrackedPlayRef.current = false;
        hasTrackedCompletionRef.current = false;
    }, []);

    useEffect(() => {
        resetTrackingRefs();
    }, [analyticsId, fallbackSrc, resetTrackingRefs, src]);

    const preloadVideo = useCallback(async () => {
        const videoEl = videoRef.current;
        if (!videoEl || hasPreloadedRef.current || !hasDirectSource) {
            return;
        }

        let hlsInstance: import("hls.js").default | null = null;

        const setFallbackSource = () => {
            if (!fallbackSrc) return;
            videoEl.src = fallbackSrc;
            videoEl.preload = "auto";
            videoEl.load();
            hasPreloadedRef.current = true;
        };

        if (!src) {
            setFallbackSource();
            return;
        }

        if (!isHlsSource) {
            videoEl.src = src;
            videoEl.preload = "auto";
            videoEl.load();
            hasPreloadedRef.current = true;
            return;
        }

        if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
            videoEl.src = src;
            videoEl.preload = "auto";
            videoEl.load();
            hasPreloadedRef.current = true;
            return;
        }

        try {
            const { default: Hls } = await import("hls.js");
            if (!Hls.isSupported()) {
                setFallbackSource();
                return;
            }
            hlsInstance = new Hls();
            hlsInstance.loadSource(src);
            hlsInstance.attachMedia(videoEl);
            // Hls will start loading segments immediately once attached.
            hasPreloadedRef.current = true;
        } catch (error) {
            console.error("Failed to initialize HLS playback", error);
            setFallbackSource();
        }

        return () => {
            hlsInstance?.destroy();
        };
    }, [fallbackSrc, hasDirectSource, isHlsSource, src]);

    useEffect(() => {
        hasPreloadedRef.current = false;
    }, [fallbackSrc, src]);

    const trackVideoStarted = useCallback(() => {
        if (hasTrackedStartRef.current) return;
        event("video_started", { id: analyticsId, source: analyticsSource });
        hasTrackedStartRef.current = true;
    }, [analyticsId, analyticsSource]);

    const trackVideoPlayed = useCallback(() => {
        if (hasTrackedPlayRef.current) return;
        const playbackPosition = videoRef.current?.currentTime;
        const hasPosition =
            typeof playbackPosition === "number" && Number.isFinite(playbackPosition);
        event("video_played", {
            id: analyticsId,
            source: analyticsSource,
            position_seconds: hasPosition ? Math.round(playbackPosition) : undefined,
        });
        hasTrackedPlayRef.current = true;
    }, [analyticsId, analyticsSource]);

    const trackVideoCompleted = useCallback(() => {
        if (hasTrackedCompletionRef.current) return;
        const duration = videoRef.current?.duration;
        const hasDuration = typeof duration === "number" && Number.isFinite(duration);
        event("video_completed", {
            id: analyticsId,
            source: analyticsSource,
            duration_seconds: hasDuration ? Math.round(duration) : undefined,
        });
        hasTrackedCompletionRef.current = true;
    }, [analyticsId, analyticsSource]);

    useEffect(() => {
        let cleanup: (() => void) | undefined;
        void preloadVideo().then((result) => {
            if (typeof result === "function") {
                cleanup = result;
            }
        });
        return () => {
            cleanup?.();
        };
    }, [preloadVideo]);

    const handlePlay = () => {
        trackVideoStarted();
        setIsPlaying(true);
        if (!hasDirectSource) {
            trackVideoPlayed();
        }
        const element = videoRef.current;
        if (element && element.paused) {
            void element.play().catch(() => {
                setIsPlaying(false);
            });
        }
    };

    const handleVideoPlay = () => {
        trackVideoPlayed();
    };

    const handleVideoEnded = () => {
        trackVideoCompleted();
    };

    const renderPlayOverlay = () => (
        <button
            type="button"
            className="absolute inset-0 z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-[8px] bg-black/40 transition hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            onClick={handlePlay}
            aria-label={title}
        >
            {posterSource ? (
                <Image
                    src={posterSource}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, 90vw"
                    className="object-cover"
                    loading="lazy"
                />
            ) : (
                <span
                    className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-black/95"
                    aria-hidden="true"
                />
            )}
            <span
                className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg transition-transform group-hover:scale-105"
                aria-hidden="true"
            >
                ▶
            </span>
            <span className="sr-only">Play video</span>
        </button>
    );

    return (
        <figure className="group grid gap-2 rounded-[8px] bg-black shadow-md">
            <div className="relative w-full overflow-hidden rounded-[8px] pt-[56.25%]">
                {hasDirectSource ? (
                    <>
                        <video
                            ref={videoRef}
                            className="absolute inset-0 z-0 h-full w-full rounded-[8px] object-cover"
                            controls={isPlaying}
                            playsInline
                            preload="auto"
                            poster={posterSource}
                            aria-label={title}
                            onPlay={handleVideoPlay}
                            onEnded={handleVideoEnded}
                        />
                        {!isPlaying && renderPlayOverlay()}
                    </>
                ) : isPlaying ? (
                    <iframe
                        className="absolute inset-0 h-full w-full border-0"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                    />
                ) : (
                    renderPlayOverlay()
                )}
            </div>
        </figure>
    );
}
