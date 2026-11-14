"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./CookieConsentBanner.module.css";
import { analyticsLocation } from "@/lib/analytics/shared";
import type { Locale } from "@/lib/content";
import { useLocale } from "@/providers/locale-provider";
import {
    CONSENT_EVENTS,
    getAnalyticsConsent,
    onConsentChange,
    onConsentPreferencesRequested,
    setAnalyticsConsent,
    type ConsentValue,
} from "@/lib/consent";

type Copy = {
    title: string;
    body: string;
    accept: string;
    reject: string;
    manageTitle: string;
    manageBody: string;
};

const COPY: Record<Locale, Copy> = {
    en: {
        title: "Cookies for analytics",
        body: "We use analytics cookies to understand how people use Ibrahim Ben Abdallah. Accept analytics to help us improve, or reject to continue with essential cookies only.",
        accept: "Accept Analytics",
        reject: "Reject",
        manageTitle: "Update cookie preferences",
        manageBody:
            "You can update your analytics cookie preference at any time.",
    },
    ar: {
        title: "ملفات تعريف الارتباط التحليلية",
        body: "بموافقتك تعاونا نطورو خدماتنا خاطرنا نستعملو ملفات تعريف الارتباط التحليلية باش نفهمو كيفاش الناس يستعملو موقع إبراهيم بن عبد الله.  أما من حقك زادة ترفض وتكمّل تستعمل الملفات الأساسية برك و في الحالتين مرحبا بيك عندنا .",
        accept: "موافق",
        reject: "مش موافق",
        manageTitle: "تحديث تفضيلات ملفات الارتباط",
        manageBody:
            "يمكنك تحديث تفضيلك لملفات تعريف الارتباط التحليلية في أي وقت.",
    },
    fr: {
        title: "Cookies de mesure d’audience",
        body: "Nous utilisons des cookies de mesure d’audience pour comprendre l’utilisation du site Ibrahim Ben Abdallah. Acceptez-les pour nous aider à améliorer le site, ou refusez-les pour continuer avec les seuls cookies essentiels.",
        accept: "Accepter la mesure d’audience",
        reject: "Refuser",
        manageTitle: "Modifier les préférences des cookies",
        manageBody: "Vous pouvez modifier vos préférences de mesure d’audience à tout moment.",
    },
};

interface CookieConsentBannerProps {
    onConsentGranted?: () => void;
    onConsentRejected?: () => void;
}

function hidePreviewBanner() {
    return process.env.NEXT_PUBLIC_DISABLE_CONSENT === "true" &&
        typeof window !== "undefined" && !analyticsLocation(window.location.origin);
}

export function CookieConsentBanner({
    onConsentGranted,
    onConsentRejected,
}: CookieConsentBannerProps) {
    const { locale } = useLocale();
    const language = locale;
    const copy = COPY[language];
    const panelRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<"initial" | "manage">("initial");

    useEffect(() => {
        if (hidePreviewBanner()) {
            return;
        }

        const consent = getAnalyticsConsent();
        if (!consent) {
            setIsOpen(true);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onConsentPreferencesRequested(() => {
            if (hidePreviewBanner()) {
                return;
            }
            setMode("manage");
            setIsOpen(true);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (isOpen && mode === "manage") {
            panelRef.current?.scrollIntoView({ block: "start" });
            panelRef.current?.querySelector("button")?.focus({ preventScroll: true });
        }
    }, [isOpen, mode]);

    useEffect(() => {
        const unsubscribe = onConsentChange((value) => {
            if (value === CONSENT_EVENTS.accepted) {
                setIsOpen(false);
            }
            if (value === CONSENT_EVENTS.rejected) {
                setIsOpen(false);
            }
        });
        return unsubscribe;
    }, []);

    const handleConsent = useCallback(
        (value: ConsentValue) => {
            setAnalyticsConsent(value);
            if (value === CONSENT_EVENTS.accepted) {
                onConsentGranted?.();
            } else {
                onConsentRejected?.();
            }
            setMode("initial");
            setIsOpen(false);
        },
        [onConsentGranted, onConsentRejected]
    );

    const manageTitle = useMemo(() => {
        if (mode === "manage") {
            return copy.manageTitle;
        }
        return copy.title;
    }, [copy.manageTitle, copy.title, mode]);

    const manageBody = useMemo(() => {
        if (mode === "manage") {
            return copy.manageBody;
        }
        return copy.body;
    }, [copy.body, copy.manageBody, mode]);

    if (!isOpen) {
        return null;
    }

    const isRtl = language === "ar";

    return (
        <div
            ref={panelRef}
            role="region"
            aria-live="polite"
            aria-label={manageTitle}
            className={styles.panel}
            dir={isRtl ? "rtl" : "ltr"}
        >
            <div className={styles.content}>
                <div className={styles.layout}>
                    <div className="space-y-2">
                        <h2 className="text-base font-semibold text-[var(--brand-text)] sm:text-lg">
                            {manageTitle}
                        </h2>
                        <p className="text-sm leading-relaxed text-[var(--brand-text)] sm:text-base">
                            {manageBody}
                        </p>
                    </div>
                    <div
                        className={`flex flex-col gap-3 sm:flex-row sm:items-center ${
                            isRtl ? "sm:flex-row-reverse" : ""
                        }`}
                    >
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-full bg-[var(--brand-primary)] px-5 py-2 text-sm font-medium text-[var(--brand-background)] shadow-sm transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            onClick={() =>
                                handleConsent(CONSENT_EVENTS.accepted)
                            }
                        >
                            {copy.accept}
                        </button>
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-full border border-[var(--brand-primary)] px-5 py-2 text-sm font-medium text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            onClick={() =>
                                handleConsent(CONSENT_EVENTS.rejected)
                            }
                        >
                            {copy.reject}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
