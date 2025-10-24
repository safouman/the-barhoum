"use client";
import clsx from "classnames";
import styles from "./ExperienceWave.module.css";

interface ExperienceWaveProps {
  active: boolean;
}

export function ExperienceWave({ active }: ExperienceWaveProps) {
  const bars = Array.from({ length: 30 }, (_, i) => (
    <span key={i} className={styles.bar} />
  ));

  return (
    <div className={clsx(styles.wave, active ? styles.waveActive : styles.waveInactive)} aria-hidden="true">
      {bars}
    </div>
  );
}
