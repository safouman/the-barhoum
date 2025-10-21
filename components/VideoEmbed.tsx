"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { event } from "@/lib/analytics";

interface VideoEmbedProps {
    videoId: string;
    title: string;
}

export function VideoEmbed({ videoId, title }: VideoEmbedProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasLogged, setHasLogged] = useState(false);

    const thumbnail = useMemo(
        () => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        [videoId]
    );

    const handlePlay = () => {
        setIsPlaying(true);
        if (!hasLogged) {
            event("video_play", { id: videoId });
            setHasLogged(true);
        }
    };

    return (
        <figure className="group grid gap-2 rounded-[8px] bg-black shadow-md">
            <div className="relative w-full overflow-hidden rounded-[8px] pt-[56.25%]">
                {isPlaying ? (
                    <iframe
                        className="absolute inset-0 h-full w-full border-0"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                    />
                ) : (
                    <button
                        type="button"
                        className="absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden rounded-[8px] bg-black/40 transition hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                        onClick={handlePlay}
                        aria-label={title}
                    >
                        <Image
                            src={thumbnail}
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 480px, (min-width: 768px) 50vw, 90vw"
                            className="object-cover"
                            loading="lazy"
                        />
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
