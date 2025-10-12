"use client";

import Link from "next/link";
import type {
    ChangeEvent,
    FormEvent,
    InputHTMLAttributes,
    MouseEvent,
    TextareaHTMLAttributes,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "classnames";
import { Button } from "@/components/Button";
import { event } from "@/lib/analytics";
import { useLocale } from "@/providers/locale-provider";
import type { LeadFormCopy, Locale } from "@/lib/content";

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

interface LeadFormProps {
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
};

type StepConfig = {
    id: string;
    title: string;
    helper: string;
    fields: FieldConfig[];
};

const INITIAL_STATE: LeadFormFormState = {
    fullName: "",
    email: "",
    country: "",
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
    showInternalHeader = true,
}: LeadFormProps) {
    const { locale } = useLocale();
    const isRtl = locale === "ar";
    const formCopy = copy[locale];
    const steps = formCopy.steps as StepConfig[];
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
            template.replace("{current}", `${current}`).replace("{total}", `${total}`),
        []
    );
    const [opened, setOpened] = useState(false);
    const [step, setStep] = useState(0);
    const [values, setValues] = useState<LeadFormFormState>(INITIAL_STATE);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [shakeField, setShakeField] = useState<
        keyof LeadFormFormState | null
    >(null);
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
            if (field.id === "age" && value) {
                const ageNumber = Number(value);
                if (!Number.isFinite(ageNumber) || ageNumber < 12) {
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

    const handleFocus = () => {
        if (!opened) {
            event("form_open", {
                category: selectedCategory ?? "none",
                pack: selectedPackage ?? "none",
            });
            setOpened(true);
        }
    };

    const focusField = (fieldId: keyof LeadFormFormState) => {
        const node = fieldRefs.current[fieldId];
        if (node && typeof (node as HTMLElement).focus === "function") {
            try {
                (node as HTMLElement).focus({ preventScroll: true });
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

    const triggerShake = (fieldId: keyof LeadFormFormState) => {
        setShakeField(fieldId);
        window.setTimeout(() => {
            setShakeField((current) => (current === fieldId ? null : current));
        }, 260);
    };

    const handleSubmit = (eventRef: FormEvent<HTMLFormElement>) => {
        eventRef.preventDefault();
        const validation = runStepValidation(step);
        if (!validation.isValid) {
            validation.invalidFieldIds.forEach((fieldId) =>
                logValidationBlock(step, fieldId)
            );
            const firstInvalidField = validation.invalidFieldIds[0];
            if (firstInvalidField) {
                triggerShake(firstInvalidField);
                focusField(firstInvalidField);
            }
            return;
        }
        setIsSubmitting(true);
        event("form_submit", {
            category: selectedCategory ?? "none",
            pack: selectedPackage ?? "none",
        });
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
        }, 600);
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
                triggerShake(firstInvalidField);
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

    const progressLine = formatTemplate(progressLabelTemplate, step + 1, totalSteps);

    const helperDescriptionId = `step-${currentStep.id}-helper`;

    useEffect(() => {
        if (!stepAnnouncerRef.current) return;
        const baseLine = formatTemplate(formCopy.chipLabelTemplate, step + 1, totalSteps);
        const announcement =
            locale === "ar" ? `تم الانتقال إلى ${baseLine}` : baseLine;
        stepAnnouncerRef.current.textContent = announcement;
        setShakeField(null);
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
        if (shakeField === fieldId) {
            setShakeField(null);
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
                triggerShake(fieldId);
            } else {
                delete next[fieldId];
            }
            return next;
        });
    };

    if (submitted) {
        return (
            <div
                className="relative mx-auto flex w-full max-w-[800px] flex-col gap-8 rounded-[22px] border border-border/30 bg-surface p-[clamp(1.6rem,4vw,2.6rem)] shadow-[0_24px_64px_rgba(15,23,42,0.08)]"
                dir={isRtl ? "rtl" : "ltr"}
            >
                <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[22px] bg-primary" />
                <header className="space-y-2 text-text">
                    <h3 className="text-[clamp(1.9rem,2.6vw,2.2rem)] font-heading font-semibold">
                        {thankYouCopy.title}
                    </h3>
                    <p className="text-base text-subtle/90">
                        {thankYouCopy.body}
                    </p>
                </header>
                <div className="rounded-[18px] border border-border/40 bg-background/30 px-5 py-4 text-start text-sm text-subtle">
                    <p className="font-medium text-text/90">
                        {summaryTitle}
                    </p>
                    <p className="mt-1 text-subtle/80">
                        {labels.category}: {selectedCategory ?? "-"}
                    </p>
                    <p className="text-subtle/80">
                        {labels.package}: {selectedPackage ?? "-"}
                    </p>
                </div>
                <Button href="/" variant="ghost">
                    {thankYouCopy.returnHome}
                </Button>
            </div>
        );
    }

    return (
        <form
            className="relative mx-auto flex w-full max-w-[660px] flex-col gap-8 rounded-[24px] border border-border/35 bg-white px-6 py-8 shadow-[0_26px_48px_-26px_rgba(15,23,42,0.45)]"
            onSubmit={handleSubmit}
            onFocus={handleFocus}
            dir={isRtl ? "rtl" : "ltr"}
        >
            <div className="absolute inset-x-0 top-0 h-[3px] overflow-hidden rounded-t-[24px] bg-primary/15">
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

            {showInternalHeader ? (
                <header className="space-y-4 text-text">
                    <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.32em] text-primary">
                        <span>{progressLine}</span>
                    </div>
                    <p
                        id={helperDescriptionId}
                        className="text-base leading-relaxed text-subtle/80"
                    >
                        {currentStep.helper}
                    </p>
                </header>
            ) : (
                <div className="space-y-3 text-text">
                    <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.32em] text-primary">
                        <span>{progressLine}</span>
                    </div>
                    <p
                        id={helperDescriptionId}
                        className="text-sm leading-relaxed text-subtle/80"
                    >
                        {currentStep.helper}
                    </p>
                </div>
            )}

            <fieldset
                className="mx-auto flex w-full max-w-[640px] flex-col gap-6"
                aria-describedby={helperDescriptionId}
            >
                {currentStep.fields.map((field, index) => {
                    const error = errors[field.id];
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
                        dir: isRtl ? "rtl" : "ltr",
                    } as const;

                    if (field.options) {
                        return (
                            <div key={field.id} className="grid gap-2">
                                <label
                                    htmlFor={field.id}
                                    className="text-[0.92rem] font-semibold text-subtle/90"
                                >
                                    {field.label}
                                    {field.required ? " *" : ""}
                                </label>
                                <select
                                    {...commonProps}
                                    ref={(node) => {
                                        fieldRefs.current[field.id] =
                                            node ?? null;
                                    }}
                                    className={clsx(
                                        "w-full rounded-[16px] border border-border/60 bg-white px-5 py-4 text-base text-text transition-all duration-200 ease-out focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
                                        error && "border-primary/60",
                                        shakeField === field.id &&
                                            "animate-[leadform-shake_220ms_ease]"
                                    )}
                                    aria-invalid={Boolean(error)}
                                    onBlur={() => handleFieldBlur(field.id)}
                                >
                                    <option value="" disabled>
                                        --
                                    </option>
                                    {field.options.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                {error && (
                                    <span
                                        role="alert"
                                        className="text-xs text-primary/80"
                                    >
                                        {error}
                                    </span>
                                )}
                            </div>
                        );
                    }

                    if (field.type === "textarea") {
                        return (
                            <div key={field.id} className="grid gap-2">
                                <label
                                    htmlFor={field.id}
                                    className="text-[0.92rem] font-semibold text-subtle/90"
                                >
                                    {field.label}
                                    {field.required ? " *" : ""}
                                </label>
                                <textarea
                                    {...(commonProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
                                    ref={(node) => {
                                        fieldRefs.current[field.id] =
                                            (node as HTMLElement | null) ??
                                            null;
                                    }}
                                    className={clsx(
                                        "min-h-[140px] w-full rounded-[16px] border border-border/60 bg-white px-5 py-4 text-base text-text transition-all duration-200 ease-out focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
                                        error && "border-primary/60",
                                        shakeField === field.id &&
                                            "animate-[leadform-shake_220ms_ease]"
                                    )}
                                    aria-invalid={Boolean(error)}
                                    onBlur={() => handleFieldBlur(field.id)}
                                />
                                {error && (
                                    <span
                                        role="alert"
                                        className="text-xs text-primary/80"
                                    >
                                        {error}
                                    </span>
                                )}
                            </div>
                        );
                    }

                    return (
                        <div key={field.id} className="grid gap-2">
                            <label
                                htmlFor={field.id}
                                className="text-[0.92rem] font-semibold text-subtle/90"
                            >
                                {field.label}
                                {field.required ? " *" : ""}
                            </label>
                            <input
                                {...(commonProps as InputHTMLAttributes<HTMLInputElement>)}
                                ref={(node) => {
                                    fieldRefs.current[field.id] =
                                        (node as HTMLElement | null) ?? null;
                                }}
                                type={field.type ?? "text"}
                                className={clsx(
                                    "w-full rounded-[16px] border border-border/60 bg-white px-5 py-4 text-base text-text transition-all duration-200 ease-out focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
                                    error && "border-primary/60",
                                    shakeField === field.id &&
                                        "animate-[leadform-shake_220ms_ease]"
                                )}
                                aria-invalid={Boolean(error)}
                                inputMode={
                                    field.id === "phone" ? "tel" : undefined
                                }
                                dir={
                                    field.id === "email" || field.id === "phone"
                                        ? "ltr"
                                        : commonProps.dir
                                }
                                onBlur={() => handleFieldBlur(field.id)}
                            />
                            {error && (
                                <span
                                    role="alert"
                                    className="text-xs text-primary/80"
                                >
                                    {error}
                                </span>
                            )}
                        </div>
                    );
                })}
            </fieldset>

            <div className="mt-10 border-t border-[#eeeeee] pt-5">
                <div
                    className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
                    dir="ltr"
                >
                    <div
                        className={clsx(
                            "flex flex-wrap items-center gap-y-2 gap-x-3 text-sm sm:pr-6",
                            isRtl
                                ? "justify-end text-right"
                                : "justify-start text-left"
                        )}
                        dir={isRtl ? "rtl" : "ltr"}
                    >
                        <span className="inline-flex items-baseline gap-2">
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
                                <span className="inline-flex items-baseline gap-2">
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
                    <div className="flex w-full flex-col items-end gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                        {step > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="px-5 py-4 sm:min-w-[140px]"
                                onClick={goToPreviousStep}
                            >
                                {actionLabels.back}
                            </Button>
                        )}

                        {step < totalSteps - 1 && (
                            <Button
                                type="button"
                                className="px-5 py-4 sm:min-w-[160px]"
                                onClick={goToNextStep}
                                disabled={!stepIsValid}
                            >
                                {actionLabels.next}
                            </Button>
                        )}

                        {step === totalSteps - 1 && (
                            <Button
                                type="submit"
                                className="px-5 py-4 sm:min-w-[180px]"
                                disabled={!stepIsValid || isSubmitting}
                            >
                                {isSubmitting ? `${submitLabel}…` : submitLabel}
                            </Button>
                        )}
                    </div>
                </div>
                <p className="mt-3 text-start text-xs text-subtle/70">
                    {privacyCopy}
                </p>
            </div>
            <style jsx>{`
                @keyframes leadform-shake {
                    0%,
                    100% {
                        transform: translateX(0);
                    }
                    25% {
                        transform: translateX(${isRtl ? "-4px" : "4px"});
                    }
                    75% {
                        transform: translateX(${isRtl ? "4px" : "-4px"});
                    }
                }
            `}</style>
        </form>
    );
}
