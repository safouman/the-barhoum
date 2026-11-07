export function VimeoEmbed({ title, url, frameRef }: { title: string; url: string; frameRef?: React.Ref<HTMLIFrameElement> }) {
  return (
    <iframe
      ref={frameRef}
      className="block aspect-video w-full rounded-md bg-[#14312e]"
      src={url}
      title={title}
      allow="fullscreen; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
      loading="lazy"
    />
  );
}
