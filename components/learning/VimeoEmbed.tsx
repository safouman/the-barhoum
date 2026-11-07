export function VimeoEmbed({ title, url, frameRef, autoplay }: { title: string; url: string; frameRef?: React.Ref<HTMLIFrameElement>; autoplay?: boolean }) {
  return (
    <iframe
      ref={frameRef}
      className="block aspect-video w-full rounded-md bg-[#14312e]"
      src={url}
      title={title}
      allow={autoplay ? "autoplay; fullscreen; picture-in-picture" : "fullscreen; picture-in-picture"}
      referrerPolicy="strict-origin-when-cross-origin"
      loading="lazy"
    />
  );
}
