"use client";

import { useState } from "react";
import { event } from "@/lib/analytics";

interface VideoEmbedProps {
    videoId: string;
    title: string;
}

export function VideoEmbed({ videoId, title }: VideoEmbedProps) {
    const [logged, setLogged] = useState(false);

    const handleInteraction = () => {
        if (!logged) {
            event("video_play", { id: videoId });
            setLogged(true);
        }
    };

    return (
        <figure
            className="group grid gap-2 rounded-lg bg-black shadow-md"
            onClick={handleInteraction}
            onFocusCapture={handleInteraction}
        >
            <div className="relative w-full overflow-hidden rounded-lg pt-[56.25%]">
                <iframe
                    className="absolute inset-0 h-full w-full border-0"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={title}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
            <figcaption className="text-sm text-subtle">{title}</figcaption>
        </figure>
    );
}
