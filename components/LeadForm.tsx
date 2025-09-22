"use client";

import type { FormEvent, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useMemo, useState } from "react";
import clsx from "classnames";
import { Button } from "./Button";
import { event } from "@/lib/analytics";

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
  selectedCategory?: string;
  selectedPackage?: string;
  variant: LeadFormVariant;
}

export function LeadForm({ labels, selectedCategory, selectedPackage, variant }: LeadFormProps) {
  const [opened, setOpened] = useState(false);
  const hiddenValues = useMemo(
    () => ({
      category: selectedCategory ?? "",
      package: selectedPackage ?? "",
    }),
    [selectedCategory, selectedPackage]
  );

  const handleFocus = () => {
    if (!opened) {
      event("form_open", {
        category: selectedCategory ?? "none",
        package: selectedPackage ?? "none",
      });
      setOpened(true);
    }
  };

  const handleSubmit = (eventRef: FormEvent<HTMLFormElement>) => {
    eventRef.preventDefault();
    event("form_submit", {
      category: selectedCategory ?? "none",
      package: selectedPackage ?? "none",
    });
  };

  const commonHidden = (
    <>
      <input type="hidden" name="selectedCategory" value={hiddenValues.category} />
      <input type="hidden" name="selectedPackage" value={hiddenValues.package} />
    </>
  );

  if (variant === "luxury") {
    return (
      <form
        className="grid gap-sm rounded-[32px] border border-accent/40 bg-surface/50 p-lg shadow-md shadow-black/20 backdrop-blur"
        onSubmit={handleSubmit}
        onFocus={handleFocus}
      >
        {commonHidden}
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-subtle">{labels.title}</p>
          <h3 className="text-2xl font-heading">{selectedCategory ?? labels.category}</h3>
          <p className="text-sm text-subtle">
            {labels.package}: {selectedPackage ?? "-"}
          </p>
        </header>
        <div className="grid gap-3 text-sm">
          <LuxuryField name="name" label={labels.name} required />
          <LuxuryField type="email" name="email" label={labels.email} required />
          <LuxuryField type="tel" name="phone" label={labels.phone} />
          <LuxuryField name="notes" label={labels.notes} multiline />
        </div>
        <div className="flex justify-end">
          <Button type="submit">{labels.submit}</Button>
        </div>
      </form>
    );
  }

  if (variant === "modern") {
    return (
      <form
        className="grid gap-5 rounded-none border border-border bg-surface p-lg shadow-sm shadow-black/5 lg:grid-cols-[1fr_1fr]"
        onSubmit={handleSubmit}
        onFocus={handleFocus}
      >
        {commonHidden}
        <header className="lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.4em] text-subtle">{labels.title}</p>
          <h3 className="mt-2 text-3xl font-heading">{selectedCategory ?? labels.category}</h3>
          <p className="mt-1 text-sm text-subtle">
            {labels.package}: {selectedPackage ?? "-"}
          </p>
        </header>
        <ModernField
          name="name"
          label={labels.name}
          placeholder={labels.name}
          required
          helper={labels.name}
        />
        <ModernField
          type="email"
          name="email"
          label={labels.email}
          placeholder={labels.email}
          required
          helper={labels.email}
        />
        <ModernField
          type="tel"
          name="phone"
          label={labels.phone}
          placeholder={labels.phone}
          helper={labels.phone}
        />
        <ModernField
          name="notes"
          label={labels.notes}
          multiline
          placeholder={labels.notes}
          helper={labels.notes}
          className="min-h-[160px]"
        />
        <div className="lg:col-span-2 flex justify-between items-center gap-4">
          <span className="text-xs uppercase tracking-[0.3em] text-subtle">{labels.submit}</span>
          <Button type="submit">{labels.submit}</Button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="grid gap-4 rounded-[28px] border border-border/60 bg-surface p-lg shadow-md shadow-accent/30"
      onSubmit={handleSubmit}
      onFocus={handleFocus}
    >
      {commonHidden}
      <header className="space-y-2 text-center">
        <h3 className="text-2xl font-heading">{labels.title}</h3>
        <p className="text-sm text-subtle">
          {labels.category}: {selectedCategory ?? "-"} · {labels.package}: {selectedPackage ?? "-"}
        </p>
      </header>
      <WarmField name="name" label={labels.name} required />
      <WarmField type="email" name="email" label={labels.email} required />
      <WarmField type="tel" name="phone" label={labels.phone} />
      <WarmField name="notes" label={labels.notes} multiline />
      <Button fullWidth type="submit">
        {labels.submit}
      </Button>
    </form>
  );
}

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  multiline?: false;
};

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  multiline: true;
};

type FieldUnion = InputFieldProps | TextareaFieldProps;

function LuxuryField(props: FieldUnion) {
  if (props.multiline) {
    const { label, name, className, multiline: _multiline, ...textareaProps } = props as TextareaFieldProps;
    const id = textareaProps.id ?? name;
    const baseClass = "w-full rounded-[8px] border border-border/50 bg-background/20 px-4 py-3 text-base transition focus:border-accent";

    return (
      <label className="grid gap-2 text-sm text-subtle" htmlFor={id}>
        <span>{label}</span>
        <textarea id={id} name={name} className={clsx(baseClass, "min-h-[160px]", className)} {...textareaProps} />
      </label>
    );
  }

  const { label, name, className, multiline: _multiline, ...inputProps } = props as InputFieldProps;
  const id = inputProps.id ?? name;
  const baseClass = "w-full rounded-[8px] border border-border/50 bg-background/20 px-4 py-3 text-base transition focus:border-accent";
  return (
    <label className="grid gap-2 text-sm text-subtle" htmlFor={id}>
      <span>{label}</span>
      <input id={id} name={name} className={clsx(baseClass, className)} {...inputProps} />
    </label>
  );
}

type ModernFieldProps = FieldUnion & {
  helper?: string;
};

function ModernField(props: ModernFieldProps) {
  const baseClass =
    "w-full border-0 border-b border-border bg-transparent px-0 pb-2 text-base transition focus:border-accent focus:ring-0";

  if (props.multiline) {
    const { label, name, className, helper, multiline: _multiline, ...textareaProps } = props as TextareaFieldProps & {
      helper?: string;
    };
    const id = textareaProps.id ?? name;
    return (
      <label className="grid gap-2" htmlFor={id}>
        <span className="text-xs uppercase tracking-[0.3em] text-subtle">{label}</span>
        <textarea id={id} name={name} className={clsx(baseClass, "resize-y", className)} {...textareaProps} />
        {helper && <span className="text-xs text-subtle/80">{helper}</span>}
      </label>
    );
  }

  const { label, name, className, helper, multiline: _multiline, ...inputProps } = props as InputFieldProps & {
    helper?: string;
  };
  const id = inputProps.id ?? name;
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="text-xs uppercase tracking-[0.3em] text-subtle">{label}</span>
      <input id={id} name={name} className={clsx(baseClass, className)} {...inputProps} />
      {helper && <span className="text-xs text-subtle/80">{helper}</span>}
    </label>
  );
}

function WarmField(props: FieldUnion) {
  const baseClass =
    "w-full rounded-[8px] border border-border/40 bg-white/60 px-6 py-4 text-base text-text shadow-sm shadow-accent/10 transition focus:border-accent focus:outline-none";

  if (props.multiline) {
    const { label, name, className, multiline: _multiline, ...textareaProps } = props as TextareaFieldProps;
    const id = textareaProps.id ?? name;
    return (
      <label className="grid gap-2 text-sm text-subtle" htmlFor={id}>
        <span>{label}</span>
        <textarea id={id} name={name} className={clsx(baseClass, "min-h-[180px]", className)} {...textareaProps} />
      </label>
    );
  }

  const { label, name, className, multiline: _multiline, ...inputProps } = props as InputFieldProps;
  const id = inputProps.id ?? name;
  return (
    <label className="grid gap-2 text-sm text-subtle" htmlFor={id}>
      <span>{label}</span>
      <input id={id} name={name} className={clsx(baseClass, className)} {...inputProps} />
    </label>
  );
}
