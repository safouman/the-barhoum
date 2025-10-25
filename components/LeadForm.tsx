"use client";

import type {
    ChangeEvent,
    FormEvent,
    InputHTMLAttributes,
    JSX,
    MouseEvent,
    TextareaHTMLAttributes,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "classnames";
import { Button } from "@/components/Button";
import { event, updateAnalyticsContext } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";
import type { LeadFormCopy, Locale } from "@/lib/content";
import {
    AGE_RANGE_OPTIONS,
    COUNTRY_OPTIONS,
    type CountryOption,
} from "@/lib/constants/lead-form";

interface LeadFormLabels {
    title: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    submit: string;
    category: string;
    package: string;
}

type LeadFormVariant = "luxury" | "modern" | "warm";

export interface LeadFormProps {
    labels: LeadFormLabels;
    copy: Record<Locale, LeadFormCopy>;
    selectedCategory?: string;
    selectedPackage?: string;
    packSummary?: {
        categoryLabel: string;
        categoryValue: string;
        packageLabel: string;
        packageValue: string;
        sessionsLabel: string;
        priceLabel: string;
    };
    variant: LeadFormVariant;
    onStepChange?: (payload: { index: number; step: StepConfig }) => void;
    onSubmitted?: () => void;
    showInternalHeader?: boolean;
}

interface LeadFormFormState {
    fullName: string;
    email: string;
    country: string;
    phone: string;
    age: string;
    bestContactTime: string;
    psychologistBefore: string;
    medicationNow: string;
    whyCoaching: string;
    followingDuration: string;
    maritalStatus: string;
    occupation: string;
    passphrase: string;
}

type FieldErrors = Partial<Record<keyof LeadFormFormState, string>>;

type FieldConfig = {
    id: keyof LeadFormFormState;
    label: string;
    helper?: string;
    type?: "text" | "email" | "tel" | "textarea" | "number";
    required?: boolean;
    options?: string[];
    placeholder?: string;
};

type StepConfig = {
    id: string;
    title: string;
    helper: string;
    fields: FieldConfig[];
};

const DEFAULT_COUNTRY: CountryOption = "Tunisia";
const COUNTRY_OPTIONS_SET = new Set<string>(COUNTRY_OPTIONS);
const AGE_RANGE_OPTIONS_SET = new Set<string>(AGE_RANGE_OPTIONS);

const INITIAL_STATE: LeadFormFormState = {
    fullName: "",
    email: "",
    country: DEFAULT_COUNTRY,
    phone: "",
    age: "",
    bestContactTime: "",
    psychologistBefore: "",
    medicationNow: "",
    whyCoaching: "",
    followingDuration: "",
    maritalStatus: "",
    occupation: "",
    passphrase: "",
};

export function LeadForm({
    labels,
    copy,
    selectedCategory,
    selectedPackage,
    packSummary,
    variant: _variant,
    onStepChange,
    onSubmitted,
    showInternalHeader = true,
}: LeadFormProps) {
    const { locale } = useLocale();
    const isRtl = locale === "ar";
    const formCopy = copy[locale];
    const steps = useMemo(() => {
        const baseSteps = formCopy.steps as StepConfig[];
        return baseSteps.map((stepConfig) => ({
            ...stepConfig,
            fields: stepConfig.fields.map((field) => {
                if (field.id === "country") {
                    return {
                        ...field,
                        options: [...COUNTRY_OPTIONS],
                    };
                }
                if (field.id === "age") {
                    return {
                        ...field,
                        options: [...AGE_RANGE_OPTIONS],
                    };
                }
                return { ...field };
            }),
        }));
    }, [formCopy.steps]);
    const totalSteps = steps.length;
    const submitLabel = labels.submit;
    const validation = formCopy.validation;
    const actionLabels = formCopy.actionLabels;
    const thankYouCopy = formCopy.thankYou;
    const summaryTitle = formCopy.summaryTitle;
    const privacyCopy = formCopy.privacy;
    const progressLabelTemplate = formCopy.progressLabelTemplate;

    const formatTemplate = useCallback(
        (template: string, current: number, total: number) =>
            template
                .replace("{current}", `${current}`)
                .replace("{total}", `${total}`),
        []
    );
    const [hasFormStarted, setHasFormStarted] = useState(false);
    const [step, setStep] = useState(0);
    const [values, setValues] = useState<LeadFormFormState>(INITIAL_STATE);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [showThankYouAnimation, setShowThankYouAnimation] = useState(false);
    const scrollContainerRef = useRef<HTMLElement | null>(null);
    const hasScrolledOnMountRef = useRef(false);
    const stepAnnouncerRef = useRef<HTMLDivElement | null>(null);
    const fieldRefs = useRef<
        Record<keyof LeadFormFormState, HTMLElement | null>
    >({
        fullName: null,
        email: null,
        country: null,
        phone: null,
        age: null,
        bestContactTime: null,
        psychologistBefore: null,
        medicationNow: null,
        whyCoaching: null,
        followingDuration: null,
        maritalStatus: null,
        occupation: null,
        passphrase: null,
    });
    const submitAttemptRef = useRef(0);
    const lastSubmissionFailedRef = useRef(false);
    const reportedErrorFieldsRef = useRef(new Set<keyof LeadFormFormState>());

    const hiddenValues = useMemo(
        () => ({
            category: selectedCategory ?? "",
            pack: selectedPackage ?? "",
        }),
        [selectedCategory, selectedPackage]
    );

    const summary = useMemo(
        () => ({
            categoryLabel: packSummary?.categoryLabel ?? labels.category,
            categoryValue:
                packSummary?.categoryValue ?? selectedCategory ?? "-",
            packageLabel: packSummary?.packageLabel ?? labels.package,
            packageValue: packSummary?.packageValue ?? selectedPackage ?? "-",
            sessionsLabel: packSummary?.sessionsLabel ?? "",
            priceLabel: packSummary?.priceLabel ?? "",
        }),
        [
            labels.category,
            labels.package,
            packSummary,
            selectedCategory,
            selectedPackage,
        ]
    );
    const currentStep = steps[step];
    const isAvailabilityStep = currentStep.id === "availability";

    useEffect(() => {
        onStepChange?.({ index: step, step: currentStep });
    }, [currentStep, onStepChange, step]);

    const validateField = useCallback(
        (field: FieldConfig, rawValue: string) => {
            const value = rawValue.trim();
            if (!field.required && value.length === 0) return "";
            if (field.required && value.length === 0) {
                return validation.required;
            }
            if (
                field.id === "email" &&
                value &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ) {
                return validation.email;
            }
            if (field.id === "country" && value) {
                if (!COUNTRY_OPTIONS_SET.has(value)) {
                    return validation.required;
                }
            }
            if (field.id === "age" && value) {
                if (!AGE_RANGE_OPTIONS_SET.has(value)) {
                    return validation.age;
                }
            }
            return "";
        },
        [validation.age, validation.email, validation.required]
    );

    const runStepValidation = useCallback(
        (stepIndex: number) => {
            const stepConfig = steps[stepIndex];
            const stepErrors: FieldErrors = {};
            const invalidFieldIds: Array<keyof LeadFormFormState> = [];

            stepConfig.fields.forEach((field) => {
                const error = validateField(field, values[field.id]);
                if (error) {
                    stepErrors[field.id] = error;
                    invalidFieldIds.push(field.id);
                    if (!reportedErrorFieldsRef.current.has(field.id)) {
                        reportedErrorFieldsRef.current.add(field.id);
                        event("form_error", {
                            field: field.id,
                            step: stepIndex + 1,
                        });
                    }
                }
            });

            setErrors((prev) => {
                const next = { ...prev };
                stepConfig.fields.forEach((field) => {
                    if (stepErrors[field.id]) {
                        next[field.id] = stepErrors[field.id];
                    } else {
                        delete next[field.id];
                    }
                });
                return next;
            });

            return { isValid: invalidFieldIds.length === 0, invalidFieldIds };
        },
        [steps, validateField, values]
    );

    const emitFormStarted = useCallback(() => {
        if (hasFormStarted) {
            return;
        }
        setHasFormStarted(true);
        event("form_started", {
            category: selectedCategory ?? "none",
            program_name: selectedPackage ?? "none",
        });
    }, [hasFormStarted, selectedCategory, selectedPackage]);

    const focusField = (fieldId: keyof LeadFormFormState) => {
        const node = fieldRefs.current[fieldId];
        if (node && typeof (node as HTMLElement).focus === "function") {
            const shouldPreventScroll =
                typeof window === "undefined"
                    ? true
                    : !window.matchMedia("(max-width: 767px)").matches;
            try {
                if (shouldPreventScroll) {
                    (node as HTMLElement).focus({ preventScroll: true });
                } else {
                    (node as HTMLElement).focus();
                }
            } catch (error) {
                (node as HTMLElement).focus();
            }
        }
    };

    const logValidationBlock = (
        stepIndex: number,
        fieldId: keyof LeadFormFormState
    ) => {
        console.warn(
            `[LeadForm] Step ${stepIndex + 1} blocked by field "${fieldId}"`
        );
    };

    const handleSubmit = async (eventRef: FormEvent<HTMLFormElement>) => {
        eventRef.preventDefault();
        emitFormStarted();

        const validation = runStepValidation(step);
        if (!validation.isValid) {
            validation.invalidFieldIds.forEach((fieldId) =>
                logValidationBlock(step, fieldId)
            );
            const firstInvalidField = validation.invalidFieldIds[0];
            if (firstInvalidField) {
                focusField(firstInvalidField);
            }
            return;
        }

        const previousFailed = lastSubmissionFailedRef.current;
        const attemptNumber = submitAttemptRef.current + 1;
        submitAttemptRef.current = attemptNumber;

        const categoryName =
            packSummary?.categoryValue ?? selectedCategory ?? "none";
        const programName =
            packSummary?.packageValue ?? selectedPackage ?? "none";
        const sanitizedCountry = values.country?.trim() ?? "";
        const countryValue = sanitizedCountry || "unknown";

        if (previousFailed) {
            event("form_retry", {
                attempt: attemptNumber,
                category: categoryName,
                program_name: programName,
                country: countryValue,
            });
        }

        setSubmissionError(null);
        setIsSubmitting(true);
        lastSubmissionFailedRef.current = false;

        try {
            const payload = {
                ...values,
                country: sanitizedCountry,
                category: selectedCategory ?? "",
                package: selectedPackage ?? "",
            };

            const response = await fetch("/api/submit-lead", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setIsSubmitting(false);
                setSubmitted(true);
                setSubmissionError(null);
                lastSubmissionFailedRef.current = false;

                event("form_submitted", {
                    category: categoryName,
                    program_name: programName,
                    country: countryValue,
                    attempt: attemptNumber,
                });

                if (result.paymentLinkStatus === "success") {
                    event("form_submitted_with_payment", {
                        category: categoryName,
                        program_name: programName,
                        country: countryValue,
                        attempt: attemptNumber,
                    });
                }

                onSubmitted?.();
            } else {
                lastSubmissionFailedRef.current = true;
                setIsSubmitting(false);
                const errorMessage =
                    result.error || "Failed to submit form. Please try again.";
                setSubmissionError(errorMessage);
            }
        } catch (error) {
            lastSubmissionFailedRef.current = true;
            setIsSubmitting(false);
            console.error("Form submission error:", error);
            setSubmissionError(
                "Network error. Please check your connection and try again."
            );
        }
    };

    const goToNextStep = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const validation = runStepValidation(step);
        if (!validation.isValid) {
            validation.invalidFieldIds.forEach((fieldId) =>
                logValidationBlock(step, fieldId)
            );
            const firstInvalidField = validation.invalidFieldIds[0];
            if (firstInvalidField) {
                focusField(firstInvalidField);
            }
            return;
        }
        setStep((prev) => Math.min(prev + 1, totalSteps - 1));
    };

    const goToPreviousStep = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setStep((prev) => Math.max(prev - 1, 0));
    };

    const stepIsValid = useMemo(() => {
        const stepConfig = steps[step];
        return stepConfig.fields.every(
            (field) => !validateField(field, values[field.id])
        );
    }, [step, steps, validateField, values]);

    const progressLine = formatTemplate(
        progressLabelTemplate,
        step + 1,
        totalSteps
    );

    const helperDescriptionId = `step-${currentStep.id}-helper`;

    const baseFieldClasses =
        "h-[52px] w-full rounded-[18px] border border-border/50 bg-white px-5 text-base text-text transition-shadow transition-colors duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-border/50 placeholder:text-subtle/50";
    const baseTextareaClasses =
        "min-h-[150px] w-full rounded-[18px] border border-border/50 bg-white px-5 py-4 text-base text-text transition-shadow transition-colors duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-border/50 placeholder:text-subtle/50";
    const errorFieldClasses =
        "border-[#E76C6C] focus:border-[#E76C6C] focus:ring-[#E76C6C33]";

    const scrollToLeadFormAnchor = useCallback(() => {
        if (typeof window === "undefined") return;
        const node = scrollContainerRef.current;
        if (!node) return;
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";
        const sectionRoot = node.closest("[data-section=\"true\"]") as HTMLElement | null;
        const sectionTitle = sectionRoot?.querySelector("[data-lead-form-title]") as HTMLElement | null;
        const scrollTarget = sectionTitle ?? node;
        scrollTarget.scrollIntoView({ behavior, block: "start" });
    }, []);

    useEffect(() => {
        if (!scrollContainerRef.current) return;
        if (!hasScrolledOnMountRef.current) {
            hasScrolledOnMountRef.current = true;
            return;
        }
        scrollToLeadFormAnchor();
    }, [scrollToLeadFormAnchor, step]);

    useEffect(() => {
        if (!submitted) return;
        scrollToLeadFormAnchor();
    }, [scrollToLeadFormAnchor, submitted]);

    useEffect(() => {
        if (!submitted) {
            setShowThankYouAnimation(false);
            return;
        }
        if (typeof window === "undefined") {
            setShowThankYouAnimation(true);
            return;
        }
        const frame = window.requestAnimationFrame(() => {
            setShowThankYouAnimation(true);
        });
        return () => window.cancelAnimationFrame(frame);
    }, [submitted]);

    useEffect(() => {
        if (!stepAnnouncerRef.current) return;
        const baseLine = formatTemplate(
            formCopy.chipLabelTemplate,
            step + 1,
            totalSteps
        );
        const announcement =
            locale === "ar" ? `تم الانتقال إلى ${baseLine}` : baseLine;
        stepAnnouncerRef.current.textContent = announcement;
    }, [formatTemplate, locale, formCopy.chipLabelTemplate, step, totalSteps]);

    useEffect(() => {
        const firstFieldId = steps[step]?.fields[0]?.id;
        if (!firstFieldId) return;
        const frameId = window.requestAnimationFrame(() => {
            if (!fieldRefs.current[firstFieldId]) {
                window.setTimeout(() => focusField(firstFieldId), 0);
            } else {
                focusField(firstFieldId);
            }
        });
        return () => window.cancelAnimationFrame(frameId);
    }, [step, steps]);

    const handleFieldChange = (
        fieldId: keyof LeadFormFormState,
        value: string
    ) => {
        emitFormStarted();
        setValues((prev) => ({ ...prev, [fieldId]: value }));
        const fieldConfig = steps
            .flatMap((stepConfig) => stepConfig.fields)
            .find((field) => field.id === fieldId);
        if (!fieldConfig) return;
        const validationMessage = validateField(fieldConfig, value);
        setErrors((prev) => {
            const next = { ...prev };
            if (validationMessage) {
                next[fieldId] = validationMessage;
            } else {
                delete next[fieldId];
            }
            return next;
        });
        if (fieldId === "country") {
            updateAnalyticsContext({ country: value.trim() || "unknown" });
        }
    };

    const handleFieldBlur = (fieldId: keyof LeadFormFormState) => {
        const fieldConfig = steps
            .flatMap((stepConfig) => stepConfig.fields)
            .find((field) => field.id === fieldId);
        if (!fieldConfig) return;
        const validationMessage = validateField(fieldConfig, values[fieldId]);
        setErrors((prev) => {
            const next = { ...prev };
            if (validationMessage) {
                next[fieldId] = validationMessage;
            } else {
                delete next[fieldId];
            }
            return next;
        });
    };

    const submittedFullName = values.fullName.trim();

    const summaryDetails = useMemo(() => {
        const details: Array<{
            key: string;
            label: string;
            value: string;
        }> = [
            {
                key: "fullName",
                label: labels.name,
                value: submittedFullName || "-",
            },
            {
                key: "category",
                label: summary.categoryLabel,
                value: summary.categoryValue || "-",
            },
            {
                key: "package",
                label: summary.packageLabel,
                value: summary.packageValue || "-",
            },
        ];

        if (summary.priceLabel) {
            details.push({
                key: "price",
                label: locale === "ar" ? "السعر" : "Price",
                value: summary.priceLabel,
            });
        }

        return details;
    }, [
        labels.name,
        locale,
        submittedFullName,
        summary.categoryLabel,
        summary.categoryValue,
        summary.packageLabel,
        summary.packageValue,
        summary.priceLabel,
    ]);

    if (submitted) {
        return (
            <div
                ref={(node) => {
                    scrollContainerRef.current = node ?? null;
                }}
                className="w-full px-4 py-10 md:flex md:min-h-[70vh] md:items-center md:justify-center md:px-6 md:py-16 lg:px-8 lg:py-20"
            >
                <div
                    className="relative mx-auto w-full max-w-[660px]"
                    dir={isRtl ? "rtl" : "ltr"}
                >
                    <div
                        className={clsx(
                            "relative flex flex-col gap-7 overflow-hidden rounded-[14px] border border-border/35 bg-white px-7 pt-8 pb-7 shadow-[0_26px_48px_-22px_rgba(15,23,42,0.18)] transition-all duration-500 ease-out motion-reduce:transition-none",
                            showThankYouAnimation
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-3"
                        )}
                    >
                        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[14px] bg-primary" />
                        <header
                            className={clsx(
                                "space-y-3.5",
                                isRtl ? "text-right" : "text-left"
                            )}
                        >
                            <div className={clsx(
                                "flex items-baseline gap-3",
                                isRtl ? "flex-row-reverse" : "flex-row"
                            )}>
                                <h3 className="text-[clamp(1.6rem,4.2vw,2rem)] font-medium tracking-tight text-text leading-tight">
                                    {thankYouCopy.title}
                                </h3>
                                <svg
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                    className="h-7 w-7 shrink-0 text-primary"
                                >
                                    <path
                                        d="m9.75 15.75 7.5-7.5"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="m9.75 15.75-3-3"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <p className="text-[0.92rem] text-subtle/75 pt-0.5">
                                {locale === "ar"
                                    ? "تم استلام بياناتك بنجاح"
                                    : "We received your information successfully"}
                            </p>
                            <p className="text-base leading-relaxed text-text/85 pt-2">
                                {thankYouCopy.body}
                            </p>
                        </header>
                        <div
                            className={clsx(
                                "space-y-5",
                                isRtl ? "text-right" : "text-left"
                            )}
                        >
                            <p
                                className={clsx(
                                    "text-[0.85rem] font-semibold text-subtle/65",
                                    !isRtl && "uppercase tracking-[0.15em]"
                                )}
                            >
                                {summaryTitle}
                            </p>
                            <div className="flex flex-col divide-y divide-border/20">
                                {summaryDetails.map((detail) => (
                                    <div
                                        key={detail.key}
                                        className={clsx(
                                            "flex items-baseline gap-3 py-3.5 first:pt-0 last:pb-0",
                                            isRtl ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        <span className={clsx(
                                            "text-xs font-medium text-subtle/60 min-w-[80px]",
                                            isRtl ? "text-right" : "text-left"
                                        )}>
                                            {detail.label}
                                        </span>
                                        <span className="flex-1 text-[0.95rem] font-medium text-text/90">
                                            {detail.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {summary.sessionsLabel && (
                                <p className="pt-4 text-sm text-subtle/70 border-t border-border/20">
                                    {summary.sessionsLabel}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form
            ref={(node) => {
                scrollContainerRef.current = node ?? null;
            }}
            className="relative mx-auto flex w-full max-w-[660px] flex-col gap-8 rounded-[14px] border border-border/35 bg-white px-7 pt-6 pb-6 shadow-[0_26px_48px_-22px_rgba(15,23,42,0.18)]"
            onSubmit={handleSubmit}
            onFocus={emitFormStarted}
            dir={isRtl ? "rtl" : "ltr"}
            data-step={currentStep.id}
        >
            <div className="absolute inset-x-0 top-0 flex h-[3px] overflow-hidden rounded-t-[14px] bg-primary/12">
                <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                />
            </div>
            <input
                type="hidden"
                name="selectedCategory"
                value={hiddenValues.category}
            />
            <input
                type="hidden"
                name="selectedPackage"
                value={hiddenValues.pack}
            />
            <div
                ref={stepAnnouncerRef}
                aria-live="polite"
                className="sr-only"
            />

            <fieldset
                className={clsx(
                    "mx-auto flex w-full max-w-[640px] flex-col gap-6",
                    isAvailabilityStep && "gap-7 sm:gap-6"
                )}
                aria-describedby={helperDescriptionId}
                disabled={isSubmitting}
            >
                {currentStep.fields.map((field, index) => {
                    const error = errors[field.id];
                    const errorId = `${field.id}-error`;
                    const commonProps = {
                        id: field.id,
                        name: field.id,
                        value: values[field.id],
                        onChange: (
                            event: ChangeEvent<
                                | HTMLInputElement
                                | HTMLTextAreaElement
                                | HTMLSelectElement
                            >
                        ) => handleFieldChange(field.id, event.target.value),
                        required: field.required,
                        placeholder: field.placeholder ?? undefined,
                        dir: isRtl ? "rtl" : "ltr",
                        "aria-invalid": Boolean(error) || undefined,
                        disabled: isSubmitting || undefined,
                    } as const;

                    const describedBy = error ? errorId : undefined;
                    const fieldBlur = () => handleFieldBlur(field.id);
                    const errorMessage = (
                        <p
                            id={errorId}
                            role="alert"
                            aria-live="polite"
                            aria-hidden={!error}
                            className={clsx(
                                "mt-[4px] text-[0.82rem] leading-snug text-[#E76C6C] transition-opacity duration-200 ease-out",
                                isRtl ? "text-right" : "text-left",
                                error ? "opacity-100" : "opacity-0"
                            )}
                            dir={isRtl ? "rtl" : "ltr"}
                        >
                            {error || "\u00A0"}
                        </p>
                    );

                    if (field.options) {
                        const placeholderLabel =
                            field.placeholder ??
                            (isRtl ? "إختر خيارًا" : "Select an option");

                        return (
                            <div key={field.id} className="scroll-mt-28">
                                <label
                                    htmlFor={field.id}
                                    className={clsx(
                                        "mb-[6px] block text-[0.92rem] font-semibold text-subtle/90",
                                        isRtl ? "text-right" : "text-left",
                                        isAvailabilityStep && "mb-[8px]"
                                    )}
                                >
                                    {field.label}
                                    {field.required ? " *" : ""}
                                </label>
                                <select
                                    {...commonProps}
                                    aria-describedby={describedBy}
                                    ref={(node) => {
                                        fieldRefs.current[field.id] =
                                            node ?? null;
                                    }}
                                    className={clsx(
                                        baseFieldClasses,
                                        "appearance-none",
                                        isRtl ? "pl-10 pr-5" : "pr-10",
                                        isAvailabilityStep &&
                                            "h-[56px] text-[1.02rem] sm:h-[52px] sm:text-base",
                                        error && errorFieldClasses
                                    )}
                                    onBlur={fieldBlur}
                                >
                                    <option value="" disabled>
                                        {placeholderLabel}
                                    </option>
                                    {field.options.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                {errorMessage}
                            </div>
                        );
                    }

                    if (field.type === "textarea") {
                        return (
                            <div key={field.id} className="scroll-mt-28">
                                <label
                                    htmlFor={field.id}
                                    className={clsx(
                                        "mb-[6px] block text-[0.92rem] font-semibold text-subtle/90",
                                        isRtl ? "text-right" : "text-left",
                                        isAvailabilityStep && "mb-[8px]"
                                    )}
                                >
                                    {field.label}
                                    {field.required ? " *" : ""}
                                </label>
                                <textarea
                                    {...(commonProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
                                    aria-describedby={describedBy}
                                    ref={(node) => {
                                        fieldRefs.current[field.id] =
                                            (node as HTMLElement | null) ??
                                            null;
                                    }}
                                    className={clsx(
                                        baseTextareaClasses,
                                        isAvailabilityStep &&
                                            "min-h-[170px] text-[1.02rem] sm:min-h-[150px] sm:text-base",
                                        error && errorFieldClasses
                                    )}
                                    onBlur={fieldBlur}
                                />
                                {errorMessage}
                            </div>
                        );
                    }

                    return (
                        <div key={field.id} className="scroll-mt-28">
                            <label
                                htmlFor={field.id}
                                className={clsx(
                                    "mb-[6px] block text-[0.92rem] font-semibold text-subtle/90",
                                    isRtl ? "text-right" : "text-left",
                                    isAvailabilityStep && "mb-[8px]"
                                )}
                            >
                                {field.label}
                                {field.required ? " *" : ""}
                            </label>
                            <input
                                {...(commonProps as InputHTMLAttributes<HTMLInputElement>)}
                                aria-describedby={describedBy}
                                ref={(node) => {
                                    fieldRefs.current[field.id] =
                                        (node as HTMLElement | null) ?? null;
                                }}
                                type={field.type ?? "text"}
                                className={clsx(
                                    baseFieldClasses,
                                    "py-0",
                                    isAvailabilityStep &&
                                        "h-[56px] text-[1.02rem] sm:h-[52px] sm:text-base",
                                    error && errorFieldClasses
                                )}
                                inputMode={
                                    field.id === "phone" ? "tel" : undefined
                                }
                                dir={
                                    field.id === "email" || field.id === "phone"
                                        ? "ltr"
                                        : commonProps.dir
                                }
                                onBlur={fieldBlur}
                            />
                            {errorMessage}
                        </div>
                    );
                })}
            </fieldset>

            <div className="mt-6 border-t border-[#eeeeee] pt-6">
                <div className="flex flex-col items-center gap-6">
                    <div
                        className={clsx(
                            "flex w-full flex-wrap items-center gap-y-2 gap-x-3 text-sm sm:pr-6 justify-start",
                            isRtl ? "text-right" : "text-left"
                        )}
                        dir={isRtl ? "rtl" : "ltr"}
                    >
                        <span
                            className={clsx(
                                "items-baseline gap-2",
                                isRtl ? "flex" : "inline-flex"
                            )}
                        >
                            <span className="text-[0.78rem] text-subtle/60">
                                {summary.categoryLabel}:
                            </span>
                            <span className="text-sm font-medium text-text/90">
                                {summary.categoryValue}
                            </span>
                        </span>
                        {summary.packageValue && (
                            <>
                                <span className="text-subtle/40">·</span>
                                <span
                                    className={clsx(
                                        "items-baseline gap-2",
                                        isRtl ? "flex" : "inline-flex"
                                    )}
                                >
                                    <span className="text-[0.78rem] text-subtle/60">
                                        {summary.packageLabel}:
                                    </span>
                                    <span className="text-sm font-medium text-text/90">
                                        {summary.packageValue}
                                    </span>
                                </span>
                            </>
                        )}
                        {summary.sessionsLabel && (
                            <>
                                <span className="text-subtle/40">·</span>
                                <span className="text-sm font-medium text-text/85">
                                    {summary.sessionsLabel}
                                </span>
                            </>
                        )}
                        {summary.priceLabel && (
                            <>
                                <span className="text-subtle/40">·</span>
                                <span className="text-sm font-semibold text-primary">
                                    {summary.priceLabel}
                                </span>
                            </>
                        )}
                    </div>
                    {submissionError && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            className={clsx(
                                "w-full rounded-[16px] border px-5 py-4 text-sm leading-relaxed shadow-[0_18px_36px_-24px_rgba(231,108,108,0.6)] transition-opacity duration-200 ease-out",
                                isRtl ? "text-right" : "text-left",
                                "border-[#E76C6C33] bg-[#FEF6F6] text-[#B44C4C]"
                            )}
                            dir={isRtl ? "rtl" : "ltr"}
                        >
                            {submissionError}
                        </div>
                    )}
                    <div className="form-navigation" dir="ltr">
                        {step > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="form-nav-button form-nav-button--secondary"
                                onClick={goToPreviousStep}
                                disabled={isSubmitting}
                            >
                                {actionLabels.back}
                            </Button>
                        )}

                        {step < totalSteps - 1 && (
                            <Button
                                type="button"
                                className="form-nav-button form-nav-button--primary"
                                onClick={goToNextStep}
                                disabled={!stepIsValid || isSubmitting}
                            >
                                {actionLabels.next}
                            </Button>
                        )}

                        {step === totalSteps - 1 && (
                            <Button
                                type="submit"
                                className="form-nav-button form-nav-button--primary"
                                disabled={!stepIsValid || isSubmitting}
                            >
                                {isSubmitting ? `${submitLabel}…` : submitLabel}
                            </Button>
                        )}
                    </div>
                </div>
                <p className="mt-5 text-start text-xs text-subtle/70">
                    {privacyCopy}
                </p>
            </div>
            <style jsx>{`
                .form-navigation {
                    display: flex;
                    width: 100%;
                    max-width: 480px;
                    justify-content: center;
                    gap: 0.75rem;
                    padding: 0 1.25rem;
                    margin: 0 auto;
                }
                .form-navigation :global(.form-nav-button) {
                    border-radius: 12px;
                    min-height: 52px;
                    padding: 12px 20px;
                    font-weight: 500;
                    text-transform: none;
                    transition: background 0.3s ease, color 0.3s ease,
                        box-shadow 0.3s ease, transform 0.3s ease,
                        border-color 0.3s ease;
                    letter-spacing: 0.5px;
                }
                :global(html[dir="rtl"] .form-navigation .form-nav-button) {
                    letter-spacing: 0 !important;
                }
                .form-navigation :global(.form-nav-button--secondary) {
                    flex: 0.4 1 0;
                    border-width: 1.5px;
                    border-color: rgba(47, 110, 104, 0.25);
                    color: #2f3e3d;
                    background: rgba(246, 250, 249, 0.6);
                    box-shadow: inset 0 1px 0 rgba(47, 110, 104, 0.08);
                }
                .form-navigation :global(.form-nav-button--secondary:hover),
                .form-navigation
                    :global(.form-nav-button--secondary:focus-visible) {
                    background: rgba(58, 207, 192, 0.08);
                    border-color: rgba(58, 207, 192, 0.6);
                    color: #28534f;
                }
                .form-navigation
                    :global(.form-nav-button--secondary:focus-visible) {
                    box-shadow: 0 0 0 3px rgba(58, 207, 192, 0.15);
                }
                .form-navigation :global(.form-nav-button--primary) {
                    flex: 0.6 1 0;
                    background: linear-gradient(
                        135deg,
                        rgba(58, 207, 192, 1) 0%,
                        rgba(42, 180, 167, 1) 100%
                    );
                    border-color: rgba(58, 207, 192, 1);
                    color: #ffffff;
                    box-shadow: 0 14px 24px -18px rgba(58, 207, 192, 0.95);
                }
                .form-navigation :global(.form-nav-button--primary:hover) {
                    background: linear-gradient(
                        135deg,
                        rgba(52, 195, 180, 1) 0%,
                        rgba(33, 168, 154, 1) 100%
                    );
                    transform: translateY(-1px);
                    box-shadow: 0 18px 28px -18px rgba(58, 207, 192, 0.95);
                }
                .form-navigation :global(.form-nav-button--primary:active) {
                    transform: translateY(0);
                    box-shadow: 0 8px 16px -12px rgba(58, 207, 192, 0.85);
                }
                .form-navigation
                    :global(.form-nav-button--primary:focus-visible) {
                    box-shadow: 0 0 0 3px rgba(58, 207, 192, 0.2);
                }
                .form-navigation :global(.form-nav-button[disabled]) {
                    opacity: 0.65;
                    cursor: not-allowed;
                    box-shadow: none;
                    transform: none;
                }
                .form-navigation :global(.form-nav-button--primary[disabled]) {
                    background: linear-gradient(
                        135deg,
                        rgba(167, 230, 224, 1) 0%,
                        rgba(142, 214, 208, 1) 100%
                    );
                    border-color: rgba(142, 214, 208, 1);
                }
                @media (max-width: 359px) {
                    .form-navigation {
                        flex-direction: column;
                        max-width: none;
                        padding: 0 1rem;
                    }
                    .form-navigation :global(.form-nav-button) {
                        width: 100%;
                    }
                    .form-navigation :global(.form-nav-button--primary),
                    .form-navigation :global(.form-nav-button--secondary) {
                        flex: 1 1 auto;
                    }
                }
            `}</style>
        </form>
    );
}
