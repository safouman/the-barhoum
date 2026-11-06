type IconName = "left" | "right" | "down" | "play" | "lock" | "check" | "list" | "download" | "external";

const paths: Record<IconName, React.ReactNode> = {
  left: <path d="m12 5-7 7 7 7M5 12h14" />,
  right: <path d="m12 5 7 7-7 7M19 12H5" />,
  down: <path d="m6 9 6 6 6-6" />,
  play: <path d="m9 6 10 6-10 6Z" />,
  lock: <><rect x="6" y="10" width="12" height="10" rx="2" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  list: <path d="M8 6h11M8 12h11M8 18h11M5 6h.01M5 12h.01M5 18h.01" />,
  download: <path d="M12 4v11m-4-4 4 4 4-4M5 16v4h14v-4" />,
  external: <path d="M13 5h6v6m0-6-8 8M19 13v6H5V5h6" />,
};

export function LearningIcon({ name, className = "size-4" }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}
