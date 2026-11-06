"use client";

import dynamic from "next/dynamic";

export const LazyExperienceSection = dynamic(
    () => import("./ExperienceSection").then((mod) => mod.HomeExperienceSection),
    { ssr: false, loading: () => null }
);
