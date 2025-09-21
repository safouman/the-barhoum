"use client";

import Link from "next/link";
import { event } from "@/lib/analytics";

interface PdfCardProps {
  href: string;
  label: string;
  localeLabel: string;
}

export function PdfCard({ href, label, localeLabel }: PdfCardProps) {
  const handleClick = () => {
    event("pdf_download", { href });
  };

  return (
    <Link
      className="grid gap-3 rounded-md border border-border bg-surface p-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm"
      href={href}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="font-heading text-lg font-semibold">{label}</span>
      <span className="text-sm text-subtle">{localeLabel}</span>
    </Link>
  );
}
