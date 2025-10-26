"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import type { AnalyticsEventName } from "@/lib/analytics/shared";
import { event, getAnalyticsContext, initAnalyticsContext, updateAnalyticsContext } from "@/lib/analytics";
import { CookieConsentBanner } from "@/components/cookies/CookieConsentBanner";
import { hasAnalyticsConsent } from "@/lib/consent";
import { useLocale } from "@/providers/locale-provider";

type SectionTracker = {
  element: HTMLElement;
  name: string;
  trackEngagement: boolean;
  engaged: boolean;
  timerId: number | null;
};

const SECTION_SELECTOR = "[data-analytics-section]";
const UTM_STORAGE_KEY = "whispered:utm";
const PAGE_SCROLL_THRESHOLDS: Array<{ threshold: number; event: AnalyticsEventName }> = [
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
  const disableConsent = process.env.NEXT_PUBLIC_DISABLE_CONSENT === "true";
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const [shouldLoadAnalytics, setShouldLoadAnalytics] = useState<boolean>(() =>
    disableConsent ? Boolean(measurementId) : hasAnalyticsConsent()
  );
  const gaReadyRef = useRef(false);
  const pendingConsentEventRef = useRef<"accepted" | null>(null);
  const sectionsRef = useRef<SectionTracker[]>([]);
  const tickingRef = useRef(false);
  const engagementObserverRef = useRef<IntersectionObserver | null>(null);
  const previousPathRef = useRef<string | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const lastPageViewRef = useRef<string | null>(null);
  const pageScrollStateRef = useRef<{
    thresholds: Array<{ threshold: number; event: AnalyticsEventName }>;
    nextIndex: number;
    hasUserScrolled: boolean;
  }>({
    thresholds: PAGE_SCROLL_THRESHOLDS,
    nextIndex: 0,
    hasUserScrolled: false,
  });

  const search = useMemo(() => searchParams?.toString?.() ?? "", [searchParams]);

  useEffect(() => {
    if (disableConsent) {
      setShouldLoadAnalytics(Boolean(measurementId));
      return;
    }
    if (hasAnalyticsConsent()) {
      setShouldLoadAnalytics(true);
    }
  }, [disableConsent, measurementId]);

  useEffect(() => {
    if (typeof window === "undefined" || !measurementId) {
      return;
    }
    (window as typeof window & Record<string, unknown>)[
      `ga-disable-${measurementId}`
    ] = !shouldLoadAnalytics;
  }, [measurementId, shouldLoadAnalytics]);

  const handleGaScriptLoaded = useCallback(() => {
    gaReadyRef.current = true;
    if (typeof window !== "undefined" && measurementId) {
      (window as typeof window & Record<string, unknown>)[
        `ga-disable-${measurementId}`
      ] = false;
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", { analytics_storage: "granted" });
      }
    }
    if (pendingConsentEventRef.current === "accepted") {
      pendingConsentEventRef.current = null;
      event("cookie_consent_given", { source: "banner" });
    }
  }, [measurementId]);

  const handleConsentGranted = useCallback(() => {
    setShouldLoadAnalytics(true);
    if (gaReadyRef.current) {
      event("cookie_consent_given", { source: "banner" });
    } else {
      pendingConsentEventRef.current = "accepted";
    }
  }, []);

  const handleConsentRejected = useCallback(() => {
    pendingConsentEventRef.current = null;
    setShouldLoadAnalytics((previous) => (previous ? previous : false));
    if (gaReadyRef.current) {
      event("cookie_consent_rejected", { source: "banner" });
    }
    if (typeof window !== "undefined" && measurementId) {
      (window as typeof window & Record<string, unknown>)[
        `ga-disable-${measurementId}`
      ] = true;
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", { analytics_storage: "denied" });
      }
    }
  }, [measurementId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const utm = resolveUtm(window.location.search);
    initAnalyticsContext({
      locale,
      device_type: detectDeviceType(),
      referrer: resolveReferrer(),
      page_path: window.location.pathname + window.location.search,
      page_location: window.location.href,
      page_title: document.title,
      debug_mode: process.env.NODE_ENV !== "production",
      category: "none",
      program_name: "none",
      ...utm,
    });

    sectionsRef.current = collectSections(sectionsRef.current);
    setupEngagementObserver();

    const handleScroll = () => {
      const state = pageScrollStateRef.current;
      if (!state.hasUserScrolled && window.scrollY <= 0) {
        return;
      }
      state.hasUserScrolled = true;
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        tickingRef.current = false;
        updatePageScroll();
      });
    };

    const handleResize = () => {
      if (!pageScrollStateRef.current.hasUserScrolled) return;
      updatePageScroll();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    const observer = new MutationObserver(() => {
      sectionsRef.current = collectSections(sectionsRef.current);
      setupEngagementObserver();
      if (pageScrollStateRef.current.hasUserScrolled) {
        updatePageScroll();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    mutationObserverRef.current = observer;

    previousPathRef.current = window.location.pathname + window.location.search;

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
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

    const pageKey = `${currentPath}|${currentLocation}`;
    if (lastPageViewRef.current !== pageKey) {
      lastPageViewRef.current = pageKey;
      event("page_view", {
        page_path: currentPath,
        page_location: currentLocation,
        page_title: currentTitle,
        referrer: previousReferrer,
      });
    }

    previousPathRef.current = currentPath;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  useEffect(() => {
    pageScrollStateRef.current = {
      thresholds: PAGE_SCROLL_THRESHOLDS,
      nextIndex: 0,
      hasUserScrolled: false,
    };
  }, [pathname]);

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

  function updatePageScroll() {
    if (typeof window === "undefined") return;
    const state = pageScrollStateRef.current;
    if (!state.hasUserScrolled) return;

    const maxScrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScrollable <= 0) {
      return;
    }

    const progress = Math.min(window.scrollY / maxScrollable, 1);

    while (
      state.nextIndex < state.thresholds.length &&
      progress >= state.thresholds[state.nextIndex].threshold
    ) {
      const { event: eventName } = state.thresholds[state.nextIndex];
      state.nextIndex += 1;
      event(eventName);
    }
  }

  return (
    <>
      {shouldLoadAnalytics && measurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
            onLoad={handleGaScriptLoaded}
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${measurementId}', { send_page_view: false });
              `}
          </Script>
        </>
      ) : null}
      {shouldLoadAnalytics ? <VercelAnalytics /> : null}
      {children}
      <CookieConsentBanner
        onConsentGranted={handleConsentGranted}
        onConsentRejected={handleConsentRejected}
      />
    </>
  );
}
