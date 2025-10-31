"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

const COPY: Record<"en" | "ar", Copy> = {
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
        title: "ملفات تعريف الارتباط للتحليلات",
        body: "نستخدم ملفات تعريف الارتباط التحليلية لفهم كيفية استخدام موقع إبراهيم بن عبد الله. بالقبول تساعدنا على التطوير، أو يمكنك الرفض والاستمرار مع الملفات الأساسية فقط.",
        accept: "أوافق على التحليلات",
        reject: "رفض",
        manageTitle: "تحديث تفضيلات ملفات الارتباط",
        manageBody:
            "يمكنك تحديث تفضيلك لملفات تعريف الارتباط التحليلية في أي وقت.",
    },
};

interface CookieConsentBannerProps {
    onConsentGranted?: () => void;
    onConsentRejected?: () => void;
}

export function CookieConsentBanner({
    onConsentGranted,
    onConsentRejected,
}: CookieConsentBannerProps) {
    const { locale } = useLocale();
    const language = locale === "ar" ? "ar" : "en";
    const copy = COPY[language];
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<"initial" | "manage">("initial");

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_DISABLE_CONSENT === "true") {
            return;
        }

        const consent = getAnalyticsConsent();
        if (!consent) {
            setIsOpen(true);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onConsentPreferencesRequested(() => {
            if (process.env.NEXT_PUBLIC_DISABLE_CONSENT === "true") {
                return;
            }
            setMode("manage");
            setIsOpen(true);
        });
        return unsubscribe;
    }, []);

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

    if (process.env.NEXT_PUBLIC_DISABLE_CONSENT === "true") {
        return null;
    }

    if (!isOpen) {
        return null;
    }

    const isRtl = language === "ar";

    return (
        <div
            role="dialog"
            aria-live="polite"
            aria-label={manageTitle}
            className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
            dir={isRtl ? "rtl" : "ltr"}
        >
            <div className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white/95 shadow-xl backdrop-blur-md">
                <div className="space-y-4 px-6 py-6 sm:py-8">
                    <div className="space-y-2">
                        <h2 className="text-base font-semibold text-[#222] sm:text-lg">
                            {manageTitle}
                        </h2>
                        <p className="text-sm leading-relaxed text-[#222]/70 sm:text-base">
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
                            className="inline-flex justify-center rounded-full bg-[#2AD6CA] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#22BDB3] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            onClick={() =>
                                handleConsent(CONSENT_EVENTS.accepted)
                            }
                        >
                            {copy.accept}
                        </button>
                        <button
                            type="button"
                            className="inline-flex justify-center rounded-full border border-[#2AD6CA] px-5 py-2 text-sm font-medium text-[#2AD6CA] transition hover:bg-[#2AD6CA]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
