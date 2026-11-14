"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { Analytics as VercelAnalytics, type BeforeSend } from "@vercel/analytics/next";
import { analyticsLocation, analyticsVercelLocation, type AnalyticsEventName } from "@/lib/analytics/shared";
import {
  event,
  initAnalyticsContext,
  updateAnalyticsContext,
  type GtagFunction,
} from "@/lib/analytics";
import { CookieConsentBanner } from "@/components/cookies/CookieConsentBanner";
import { hasAnalyticsConsent } from "@/lib/consent";
import { useLocale } from "@/providers/locale-provider";
import {
  isPosthogConfigured,
  setPosthogTrackingEnabled,
} from "@/lib/analytics/posthog";

type SectionTracker = {
  element: HTMLElement;
  name: string;
  trackEngagement: boolean;
  engaged: boolean;
  timerId: number | null;
};

const SECTION_SELECTOR = "[data-analytics-section]";
const PAGE_SCROLL_THRESHOLDS: Array<{ threshold: number; event: AnalyticsEventName }> = [
  { threshold: 0.25, event: "scroll_25" },
  { threshold: 0.5, event: "scroll_50" },
  { threshold: 0.75, event: "scroll_75" },
  { threshold: 1, event: "scroll_100" },
];

function detectDeviceType(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return "tablet";
  if (/mobile|iphone|android/.test(ua)) return "mobile";
  return "desktop";
}

const beforeVercelSend: BeforeSend = (event) => {
  if (!hasAnalyticsConsent() || event.type !== "pageview") return null;
  const url = analyticsVercelLocation(event.url, document.referrer);
  return url ? { ...event, url } : null;
};

function setGaEnabled(measurementId: string, enabled: boolean) {
  (window as typeof window & Record<string, unknown>)[`ga-disable-${measurementId}`] = !enabled;
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", { analytics_storage: enabled ? "granted" : "denied" });
  }
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
  const { locale } = useLocale();
  // GA4's stream-level enhanced measurement can send automatic events outside
  // our client allowlist. Enable it only after the stream settings are verified.
  const configuredId = process.env.NEXT_PUBLIC_GA4_PRIVACY_VERIFIED === "true"
    ? process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID : undefined;
  const measurementId = configuredId && /^G-[A-Z0-9]+$/.test(configuredId) ? configuredId : undefined;
  const posthogConfigured = isPosthogConfigured();
  const [shouldLoadAnalytics, setShouldLoadAnalytics] = useState(false);
  const [gaReady, setGaReady] = useState(false);
  const sectionsRef = useRef<SectionTracker[]>([]);
  const tickingRef = useRef(false);
  const engagementObserverRef = useRef<IntersectionObserver | null>(null);
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

  const applyConsent = useCallback(() => {
    const location = analyticsLocation(window.location.href);
    const enabled = Boolean(location) && hasAnalyticsConsent();
    setShouldLoadAnalytics(enabled);
    setPosthogTrackingEnabled(enabled);

    if (measurementId) {
      if (location && enabled && typeof window.gtag !== "function") {
        window.dataLayer ??= [];
        window.gtag = function () {
          window.dataLayer?.push(arguments as unknown as Record<string, unknown>);
        } as GtagFunction;
        window.gtag("consent", "default", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
        window.gtag("js", new Date());
        window.gtag("config", measurementId, {
          send_page_view: false,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
          page_location: location,
          page_referrer: "",
          page_title: new URL(location).pathname,
        });
      }
      setGaEnabled(measurementId, enabled);
    }
    if (enabled) window.dispatchEvent(new Event("barhoum-analytics-ready"));
  }, [measurementId]);

  useEffect(() => {
    applyConsent();
  }, [applyConsent, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    initAnalyticsContext({ locale, device_type: detectDeviceType() });

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
    const location = analyticsLocation(window.location.href);
    if (!location || !shouldLoadAnalytics || !hasAnalyticsConsent()) {
      lastPageViewRef.current = null;
      return;
    }
    if (posthogConfigured || gaReady) {
      // The actual pathname is local only and distinguishes navigations whose
      // transmitted URLs have the same route template.
      if (lastPageViewRef.current !== pathname) {
        lastPageViewRef.current = pathname;
        event("page_view");
      }
    }
  }, [pathname, shouldLoadAnalytics, gaReady, posthogConfigured]);

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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
          strategy="afterInteractive"
          referrerPolicy="no-referrer"
          onReady={() => setGaReady(true)}
        />
      ) : null}
      {shouldLoadAnalytics ? <VercelAnalytics beforeSend={beforeVercelSend} /> : null}
      <CookieConsentBanner
        onConsentGranted={applyConsent}
        onConsentRejected={applyConsent}
      />
      {children}
    </>
  );
}
