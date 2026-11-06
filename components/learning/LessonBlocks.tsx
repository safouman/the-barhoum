import Markdown from "react-markdown";
import type { LessonBlock } from "@/lib/learning/contracts";
import { LearningIcon } from "./LearningIcon";

export function LessonBlocks({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div className="space-y-7">
      {blocks.map((block) => {
        switch (block.type) {
          case "text":
            return (
              <div key={block.id} className="space-y-3 leading-relaxed text-subtle [&_a]:underline [&_h2]:text-2xl [&_h3]:text-xl [&_ol]:list-decimal [&_ol]:ps-5 [&_ul]:list-disc [&_ul]:ps-5">
                <Markdown>{block.markdown}</Markdown>
              </div>
            );
          case "video":
            return (
              <div key={block.id} className="space-y-5">
                {block.videos.map((video, index) => (
                  <figure key={index} className="space-y-2">
                    {video.vimeoEmbedUrl ? (
                      <iframe
                        className="block aspect-video w-full rounded-sm bg-[#14312e]"
                        src={video.vimeoEmbedUrl}
                        title={video.title}
                        allow="fullscreen; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        loading="lazy"
                      />
                    ) : video.playbackUrl ? (
                      <video
                        className="aspect-video w-full rounded-sm bg-[#14312e] object-contain"
                        src={video.playbackUrl}
                        poster={video.posterUrl}
                        controls
                        playsInline
                        preload="none"
                        aria-label={video.title}
                      >
                        Your browser does not support video playback.
                      </video>
                    ) : (
                      <div className="grid aspect-video place-items-center rounded-sm bg-surface p-4 text-center text-sm text-subtle">
                        Video playback is unavailable.
                      </div>
                    )}
                    <figcaption className="text-xs text-subtle">{video.title}</figcaption>
                  </figure>
                ))}
              </div>
            );
          case "resources":
            return (
              <section key={block.id} aria-label="Lesson resources" className="rounded-sm border border-border bg-surface p-4 sm:p-5">
                <h2 className="text-base font-semibold">Resources</h2>
                <ul className="mt-2 divide-y divide-border" role="list">
                  {block.items.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.url}
                        download={item.kind === "download" || undefined}
                        className="flex min-h-11 items-center gap-2 text-sm font-medium text-[#12685f] underline-offset-4 hover:underline"
                      >
                        <LearningIcon name={item.kind === "download" ? "download" : "external"} className="size-4 shrink-0" />
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            );
        }
      })}
    </div>
  );
}
