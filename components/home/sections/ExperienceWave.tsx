"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "classnames";
import styles from "./ExperienceWave.module.css";

interface ExperienceWaveProps {
  active: boolean;
  audioElement: HTMLAudioElement | null;
}

interface AudioData {
  version: string;
  duration: number;
  fps: number;
  barCount: number;
  frames: number[][];
}

export function ExperienceWave({ active, audioElement }: ExperienceWaveProps) {
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>(Array(30).fill(0.35));
  const animationFrameRef = useRef<number | null>(null);
  const barsRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    fetch('/audio/experience-data.json')
      .then(res => res.json())
      .then(data => setAudioData(data))
      .catch(err => console.error('Failed to load audio data:', err));
  }, []);

  useEffect(() => {
    if (!active || !audioElement || !audioData) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setBarHeights(Array(30).fill(0.35));
      return;
    }

    const updateVisualization = () => {
      if (!audioElement || audioElement.paused || audioElement.ended) {
        return;
      }

      const currentTime = audioElement.currentTime;
      const frameIndex = Math.floor(currentTime * audioData.fps);

      if (frameIndex >= 0 && frameIndex < audioData.frames.length) {
        const frameData = audioData.frames[frameIndex];
        setBarHeights(frameData);
      }

      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };

    updateVisualization();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [active, audioElement, audioData]);

  return (
    <div
      className={clsx(styles.wave, active ? styles.waveActive : styles.waveInactive)}
      aria-hidden="true"
    >
      {barHeights.map((height, i) => (
        <span
          key={i}
          ref={el => {
            if (el) barsRef.current[i] = el;
          }}
          className={styles.bar}
          style={{
            transform: `scaleY(${height})`,
          }}
        />
      ))}
    </div>
  );
}
