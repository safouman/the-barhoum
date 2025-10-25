"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { AnalyticsEventName } from "@/lib/analytics/shared";
import { event, getAnalyticsContext, initAnalyticsContext, updateAnalyticsContext } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";

type SectionTracker = {
  element: HTMLElement;
  name: string;
  trackEngagement: boolean;
  thresholdsHit: Set<number>;
  engaged: boolean;
  timerId: number | null;
};

const SECTION_SELECTOR = "[data-analytics-section]";
const UTM_STORAGE_KEY = "whispered:utm";
const SCROLL_THRESHOLDS: Array<{ threshold: number; event: AnalyticsEventName }> = [
  { threshold: 0.25, event: "scroll_25" },
  { threshold: 0.5, event: "scroll_50" },
  { threshold: 0.75, event: "scroll_75" },
  { threshold: 1, event: "scroll_100" },
];

const DEFAULT_UTM = {
  utm_source: "direct",
  utm_medium: "direct",
  utm_campaign: "none",
};

function detectDeviceType(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return "tablet";
  if (/mobile|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}

function detectCountry(): string {
  if (typeof window === "undefined") return "unknown";
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().locale;
    const [, region] = resolved.split("-");
    if (region) return region.toUpperCase();
  } catch {
    // ignore
  }
  if (typeof navigator !== "undefined") {
    const locale = navigator.language || (Array.isArray(navigator.languages) ? navigator.languages[0] : "");
    const [, region] = (locale || "").split("-");
    if (region) return region.toUpperCase();
  }
  return "unknown";
}

function resolveReferrer(): string {
  if (typeof document === "undefined" || typeof window === "undefined") return "direct";
  const ref = document.referrer;
  if (!ref) return "direct";
  try {
    const refUrl = new URL(ref);
    if (refUrl.origin === window.location.origin) {
      return refUrl.pathname + refUrl.search;
    }
    return refUrl.origin;
  } catch {
    return ref;
  }
}

type UtmKeys = "utm_source" | "utm_medium" | "utm_campaign";

function parseUtm(search: string): Partial<Record<UtmKeys, string>> {
  if (!search) return {};
  const params = new URLSearchParams(search);
  const result: Partial<Record<UtmKeys, string>> = {};
  ["utm_source", "utm_medium", "utm_campaign"].forEach((key) => {
    const value = params.get(key);
    if (value) {
      result[key as UtmKeys] = value.trim().toLowerCase();
    }
  });
  return result;
}

function loadStoredUtm(): Partial<Record<UtmKeys, string>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<UtmKeys, string>>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function persistUtm(data: Record<UtmKeys, string>) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function resolveUtm(search: string): Record<UtmKeys, string> {
  const fromQuery = parseUtm(search);
  const stored = loadStoredUtm();
  const merged = { ...DEFAULT_UTM, ...stored };
  const hasQuery = Object.keys(fromQuery).length > 0;
  if (hasQuery) {
    Object.assign(merged, fromQuery);
    persistUtm(merged);
  }
  return merged;
}

function collectSections(previous: SectionTracker[] = []): SectionTracker[] {
  if (typeof document === "undefined") return [];
  const previousMap = new Map<HTMLElement, SectionTracker>();
  previous.forEach((section) => {
    previousMap.set(section.element, section);
  });
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(SECTION_SELECTOR));
  return nodes.map((element) => ({
    ...(previousMap.get(element) ?? {
      thresholdsHit: new Set<number>(),
      engaged: false,
      timerId: null,
    }),
    element,
    name: element.getAttribute("data-analytics-section") ?? element.id ?? "Unknown Section",
    trackEngagement: element.hasAttribute("data-analytics-engage"),
  }));
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const sectionsRef = useRef<SectionTracker[]>([]);
  const tickingRef = useRef(false);
  const engagementObserverRef = useRef<IntersectionObserver | null>(null);
  const previousPathRef = useRef<string | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  const search = useMemo(() => searchParams?.toString?.() ?? "", [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const utm = resolveUtm(window.location.search);
    initAnalyticsContext({
      locale,
      country: detectCountry(),
      device_type: detectDeviceType(),
      referrer: resolveReferrer(),
      page_path: window.location.pathname + window.location.search,
      page_location: window.location.href,
      page_title: document.title,
      debug_mode: process.env.NODE_ENV !== "production",
      ...utm,
    });

    sectionsRef.current = collectSections(sectionsRef.current);
    setupEngagementObserver();

    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        tickingRef.current = false;
        updateScrollDepth();
      });
    };

    const updateScrollDepth = () => {
      if (typeof window === "undefined") return;
      const viewportTop = window.scrollY;
      const viewportBottom = viewportTop + window.innerHeight;

      sectionsRef.current.forEach((section) => {
        const rect = section.element.getBoundingClientRect();
        const sectionHeight = rect.height;
        if (sectionHeight <= 0) return;

        const sectionTop = rect.top + viewportTop;
        const sectionBottom = sectionTop + sectionHeight;

        if (viewportBottom < sectionTop || viewportTop > sectionBottom) {
          return;
        }

        const progress = Math.max(
          0,
          Math.min((viewportBottom - sectionTop) / sectionHeight, 1)
        );

        SCROLL_THRESHOLDS.forEach(({ threshold, event: eventName }) => {
          if (section.thresholdsHit.has(threshold)) return;
          if (progress >= threshold) {
            section.thresholdsHit.add(threshold);
            event(eventName, { section: section.name });
          }
        });
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    updateScrollDepth();

    const observer = new MutationObserver(() => {
      sectionsRef.current = collectSections(sectionsRef.current);
      setupEngagementObserver();
      updateScrollDepth();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    mutationObserverRef.current = observer;

    previousPathRef.current = window.location.pathname + window.location.search;

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      teardownEngagementObserver();
      mutationObserverRef.current?.disconnect();
      mutationObserverRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateAnalyticsContext({ locale });
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const utm = resolveUtm(window.location.search);
    updateAnalyticsContext(utm);

    const currentPath = window.location.pathname + window.location.search;
    const currentLocation = window.location.href;
    const currentTitle = document.title;

    const context = getAnalyticsContext();
    const previousReferrer =
      previousPathRef.current && previousPathRef.current !== currentPath
        ? `${window.location.origin}${previousPathRef.current}`
        : context.referrer ?? resolveReferrer();

    updateAnalyticsContext({
      page_path: currentPath,
      page_location: currentLocation,
      page_title: currentTitle,
      referrer: previousReferrer,
    });

    event("page_view", {
      page_path: currentPath,
      page_location: currentLocation,
      page_title: currentTitle,
      referrer: previousReferrer,
    });

    previousPathRef.current = currentPath;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  function setupEngagementObserver() {
    if (typeof window === "undefined") return;
    if (engagementObserverRef.current) {
      engagementObserverRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = sectionsRef.current.find(
            (candidate) => candidate.element === entry.target
          );
          if (!section || !section.trackEngagement || section.engaged) {
            return;
          }

          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            if (section.timerId === null) {
              section.timerId = window.setTimeout(() => {
                section.engaged = true;
                section.timerId = null;
                event("section_engaged", { section: section.name, duration: 8 });
              }, 8000);
            }
          } else if (section.timerId !== null) {
            window.clearTimeout(section.timerId);
            section.timerId = null;
          }
        });
      },
      {
        threshold: [0, 0.6],
      }
    );

    sectionsRef.current.forEach((section) => {
      if (section.trackEngagement) {
        observer.observe(section.element);
      }
    });

    engagementObserverRef.current = observer;
  }

  function teardownEngagementObserver() {
    if (engagementObserverRef.current) {
      engagementObserverRef.current.disconnect();
      engagementObserverRef.current = null;
    }
  }

  return <>{children}</>;
}
