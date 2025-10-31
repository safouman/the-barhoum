"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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
    const [hasLogged, setHasLogged] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

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

    const handlePlay = () => {
        setIsPlaying(true);
        if (!hasLogged) {
            event("video_play", { id: analyticsId });
            setHasLogged(true);
        }
    };

    useEffect(() => {
        if (!isPlaying) return;
        const videoEl = videoRef.current;
        if (!videoEl) return;

        if (!src) {
            if (fallbackSrc) {
                videoEl.src = fallbackSrc;
            }
            return;
        }

        if (!isHlsSource) {
            if (videoEl.src !== src) {
                videoEl.src = src;
            }
            return;
        }

        let isCancelled = false;
        let hlsInstance: import("hls.js").default | null = null;

        const setupHls = async () => {
            if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
                videoEl.src = src;
                return;
            }

            try {
                const { default: Hls } = await import("hls.js");
                if (isCancelled || !Hls.isSupported()) {
                    if (fallbackSrc) {
                        videoEl.src = fallbackSrc;
                    }
                    return;
                }
                hlsInstance = new Hls();
                hlsInstance.loadSource(src);
                hlsInstance.attachMedia(videoEl);
            } catch (error) {
                console.error("Failed to initialize HLS playback", error);
                if (fallbackSrc) {
                    videoEl.src = fallbackSrc;
                }
            }
        };

        void setupHls();

        return () => {
            isCancelled = true;
            if (hlsInstance) {
                hlsInstance.destroy();
                hlsInstance = null;
            }
        };
    }, [fallbackSrc, isHlsSource, isPlaying, src]);

    return (
        <figure className="group grid gap-2 rounded-[8px] bg-black shadow-md">
            <div className="relative w-full overflow-hidden rounded-[8px] pt-[56.25%]">
                {isPlaying ? (
                    src || fallbackSrc ? (
                        <video
                            ref={videoRef}
                            className="absolute inset-0 h-full w-full rounded-[8px] object-cover"
                            src={
                                !isHlsSource ? src ?? fallbackSrc : undefined
                            }
                            autoPlay
                            controls
                            playsInline
                            preload="metadata"
                            poster={posterSource}
                            aria-label={title}
                        />
                    ) : (
                        <iframe
                            className="absolute inset-0 h-full w-full border-0"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                            title={title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                        />
                    )
                ) : (
                    <button
                        type="button"
                        className="absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden rounded-[8px] bg-black/40 transition hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
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
                )}
            </div>
        </figure>
    );
}
