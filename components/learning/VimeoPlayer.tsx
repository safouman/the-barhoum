"use client";

import type Player from "@vimeo/player";
import { useEffect, useRef, useState } from "react";
import type { VideoResume } from "@/lib/learning/progress-contract";
import { VimeoEmbed } from "./VimeoEmbed";

type Timing = { seconds: number; duration: number };

const nearEnd = ({ seconds, duration }: Timing) => duration > 0 && duration - seconds <= Math.min(10, duration * 0.1);

function timeLabel(seconds: number) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function VimeoResumePlayer({ title, url, endpoint, videoId, initial }: {
  title: string;
  url: string;
  endpoint: string;
  videoId: string;
  initial?: VideoResume;
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const sdk = useRef<Player | null>(null);
  const initialResume = useRef(initial);
  const [resumeAt, setResumeAt] = useState<number | null>(null);

  useEffect(() => {
    const frame = iframe.current;
    if (!frame) return;

    const listeners: Array<() => void> = [];
    let active = true;
    let revision = initialResume.current?.revision ?? 0;
    let saved = initialResume.current?.seconds ?? 0;
    let observed: number | null = null;
    let conflictedPosition: number | null = null;
    let played = false;
    let saving = false;
    let queued = false;
    let writable = true;
    let lastAttemptAt = Date.now();

    async function save(force: boolean) {
      if (!writable || observed === null || observed === conflictedPosition || Math.abs(observed - saved) < (force ? 1 : 4)) return;
      if (!force && Date.now() - lastAttemptAt < 15_000) return;
      if (saving) {
        queued ||= force;
        return;
      }
      saving = true;
      lastAttemptAt = Date.now();
      const seconds = observed;
      try {
        const response = await fetch(`${endpoint}/resume`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, seconds, expectedRevision: revision }),
          keepalive: force,
        });
        if (response.status === 401 || response.status === 404) {
          writable = false;
          return;
        }
        const result = await response.json() as VideoResume & { current?: VideoResume };
        const next = response.status === 409 ? result.current : response.ok ? result : undefined;
        if (next && Number.isFinite(next.seconds) && Number.isInteger(next.revision)) {
          revision = next.revision;
          saved = next.seconds;
          if (response.status === 409) {
            conflictedPosition = observed;
            queued = false;
          }
        }
      } catch {
        // Keep the player usable during network or SDK failures.
      } finally {
        saving = false;
        if (queued) {
          queued = false;
          void save(true);
        }
      }
    }

    function observe(timing: Timing, force = false) {
      if (!Number.isFinite(timing.seconds) || timing.seconds < 0 || !Number.isFinite(timing.duration) || timing.duration <= 0) return;
      observed = nearEnd(timing) ? 0 : Math.min(Math.floor(timing.seconds), 86_400);
      void save(force);
    }

    void import("@vimeo/player").then(async ({ default: Player }) => {
      if (!active) return;
      const player = new Player(frame);
      const events = {
        timeupdate: (timing: Timing) => observe(timing),
        pause: (timing: Timing) => observe(timing, true),
        ended: (timing: Timing) => observe(timing, true),
        play: () => {
          played = true;
          setResumeAt(null);
        },
      };
      player.on("timeupdate", events.timeupdate);
      player.on("pause", events.pause);
      player.on("ended", events.ended);
      player.on("play", events.play);
      listeners.push(() => {
        player.off("timeupdate", events.timeupdate);
        player.off("pause", events.pause);
        player.off("ended", events.ended);
        player.off("play", events.play);
      });
      const duration = await player.getDuration();
      if (!active) return;
      sdk.current = player;
      if (!played && observed === null && Number.isFinite(duration) && saved >= 2 && saved < duration && !nearEnd({ seconds: saved, duration })) {
        setResumeAt(saved);
      }
    }).catch(() => {});

    const flush = () => void save(true);
    const visibility = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", flush);
    return () => {
      active = false;
      flush();
      sdk.current = null;
      listeners.forEach((remove) => remove());
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [endpoint, videoId]);

  function resume() {
    if (resumeAt === null || !sdk.current) return;
    setResumeAt(null);
    void sdk.current.setCurrentTime(resumeAt).catch(() => {});
  }

  return (
    <div className="space-y-2">
      <VimeoEmbed title={title} url={url} frameRef={iframe} />
      {resumeAt !== null ? (
        <button type="button" onClick={resume} className="inline-flex min-h-11 items-center rounded-full border border-[#12685f] px-4 py-2 text-sm font-semibold text-[#12685f] hover:bg-[#e4f8f5]">
          Resume at {timeLabel(resumeAt)}
        </button>
      ) : null}
    </div>
  );
}
