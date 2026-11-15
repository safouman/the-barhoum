import Image from "next/image";
import { brandIconAssets, type BrandIconName } from "@/lib/brand-icons";
import styles from "./BrandIcon.module.css";

/** Decorative artwork: the adjacent heading provides its accessible meaning. */
export function BrandIcon({ name, size = 56 }: { name: BrandIconName; size?: number | string }) {
  const asset = brandIconAssets[name];
  return <Image {...asset} alt="" aria-hidden="true" unoptimized className={styles.artwork} style={{ width: size, height: size }} />;
}
