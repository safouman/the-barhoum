"use client";
import clsx from "classnames";
import styles from "./ExperienceWave.module.css";

interface ExperienceWaveProps {
  active: boolean;
}

export function ExperienceWave({ active }: ExperienceWaveProps) {
  return (
    <div className={clsx(styles.wave, active ? styles.waveActive : styles.waveInactive)} aria-hidden="true">
      <span className={styles.bar} />
      <span className={styles.bar} />
      <span className={styles.bar} />
      <span className={styles.bar} />
    </div>
  );
}
