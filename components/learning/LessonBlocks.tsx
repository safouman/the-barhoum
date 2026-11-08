import Markdown from "react-markdown";
import type { LessonBlock } from "@/lib/learning/contracts";
import type { VideoResume } from "@/lib/learning/progress-contract";
import { LearningIcon } from "./LearningIcon";
import { VimeoEmbed } from "./VimeoEmbed";
import { VimeoResumePlayer } from "./VimeoPlayer";

function firstVimeoOccurrence(blocks: LessonBlock[], videoId: string) {
  return blocks.flatMap((block) => block.type === "video" ? block.videos : [])
    .find((video) => vimeoId(video.vimeoEmbedUrl) === videoId);
}

function vimeoId(url?: string) {
  return url?.match(/^https:\/\/player\.vimeo\.com\/video\/(\d+)(?:[?#]|$)/)?.[1];
}

export function LessonBlocks({ blocks, endpoint, resumePositions }: {
  blocks: LessonBlock[];
  endpoint?: string | null;
  resumePositions?: VideoResume[];
}) {
  return (
    <div className="space-y-7">
      {blocks.map((block) => {
        switch (block.type) {
          case "text":
            return (
              <div key={block.id} className="max-w-[68ch] space-y-4 leading-relaxed text-subtle [&_a]:underline [&_h2]:text-2xl [&_h3]:text-xl [&_ol]:list-decimal [&_ol]:ps-5 [&_ul]:list-disc [&_ul]:ps-5">
                <Markdown components={{
                  p: ({ children }) => <p dir="auto" className="break-words">{children}</p>,
                  li: ({ children }) => <li dir="auto" className="break-words">{children}</li>,
                  h2: ({ children }) => <h2 dir="auto">{children}</h2>,
                  h3: ({ children }) => <h3 dir="auto">{children}</h3>,
                  a: ({ href, children }) => <a href={href} className="[overflow-wrap:anywhere]"><bdi>{children}</bdi></a>,
                }}>{block.markdown}</Markdown>
              </div>
            );
          case "video":
            return (
              <div key={block.id} className="space-y-5">
                {block.videos.map((video, index) => {
                  const id = vimeoId(video.vimeoEmbedUrl);
                  const resumable = endpoint && id && firstVimeoOccurrence(blocks, id) === video;
                  return (
                    <figure key={index} className="space-y-2">
                      {video.vimeoEmbedUrl ? (
                        resumable ? (
                          <VimeoResumePlayer key={`${endpoint}:${id}`} title={video.title} url={video.vimeoEmbedUrl} endpoint={endpoint} videoId={id} initial={resumePositions?.find((position) => position.videoId === id)} />
                        ) : <VimeoEmbed title={video.title} url={video.vimeoEmbedUrl} />
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
                          متصفّحك لا يدعم تشغيل الفيديو.
                        </video>
                      ) : (
                        <div className="grid aspect-video place-items-center rounded-sm bg-surface p-4 text-center text-sm text-subtle">
                          تشغيل الفيديو غير متاح الآن.
                        </div>
                      )}
                      <figcaption className="text-xs text-subtle"><bdi>{video.title}</bdi></figcaption>
                    </figure>
                  );
                })}
              </div>
            );
          case "resources":
            if (!block.items.length) return null;
            return (
              <section key={block.id} aria-label="مواد الدرس" className="rounded-sm border border-border bg-surface p-4 sm:p-5">
                <h2 className="text-base font-semibold">مواد الدرس</h2>
                <ul className="mt-2 divide-y divide-border" role="list">
                  {block.items.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.url}
                        download={item.kind === "download" || undefined}
                        className="flex min-h-11 items-center gap-2 text-sm font-medium text-[#12685f] underline-offset-4 hover:underline"
                      >
                        <LearningIcon name={item.kind === "download" ? "download" : "external"} className="size-4 shrink-0" />
                        <bdi className="min-w-0 [overflow-wrap:anywhere]">{item.label}</bdi>
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
