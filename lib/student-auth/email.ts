import "server-only";

import { resendAdapter } from "@payloadcms/email-resend";
import { after } from "next/server";
import type { Payload } from "payload";
import { AuthError, authOrigin, emailInput } from "./core";

type EmailKind = "signup" | "google-signup" | "reset" | "email-change" | "email-changed";
const messages = {
    signup: { path: "/verify-email", subject: "Verify your Barhoum email", action: "Verify your email" },
    "google-signup": { path: "/verify-email?method=google", subject: "Verify your Barhoum email", action: "Verify your email" },
    reset: { path: "/reset-password", subject: "Reset your Barhoum password", action: "Reset your password" },
    "email-change": { path: "/confirm-email", subject: "Confirm your new Barhoum email", action: "Confirm your new email" },
    "email-changed": { path: "/account", subject: "Your Barhoum email was changed", action: "View account" },
};

export function requireStudentEmail() {
    const apiKey = process.env.RESEND_API_KEY;
    const defaultFromAddress = process.env.STUDENT_AUTH_FROM_EMAIL;
    if (!apiKey || !defaultFromAddress || !emailInput.safeParse(defaultFromAddress).success) throw new AuthError("UNAVAILABLE");
    const allowlist = new Set((process.env.STUDENT_AUTH_EMAIL_ALLOWLIST ?? "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean));
    const restricted = process.env.VERCEL_ENV !== "production";
    if (restricted && !allowlist.size) throw new AuthError("UNAVAILABLE");
    return { apiKey, defaultFromAddress, allowlist, restricted };
}

export function queueEmailWork(payload: Payload, work: () => Promise<void>) {
    after(async () => {
        try {
            await work();
        } catch {
            payload.logger.warn("Student auth email processing failed.");
        }
    });
}

export async function sendStudentEmail(payload: Payload, to: string, kind: EmailKind, token?: string) {
    const settings = requireStudentEmail();
    if (settings.restricted && !settings.allowlist.has(to)) return;
    const message = messages[kind];
    const link = new URL(message.path, authOrigin());
    if (token) link.hash = new URLSearchParams({ token }).toString();
    const text = token
        ? `${message.action}: ${link.href}\n\nIf you did not request this, you can ignore this email.`
        : `The email address for your Barhoum account was changed. If you did not request this, contact support.\n\n${message.action}: ${link.href}`;
    const adapter = resendAdapter({ apiKey: settings.apiKey, defaultFromAddress: settings.defaultFromAddress, defaultFromName: "Barhoum" })({ payload });
    await adapter.sendEmail({ to, subject: message.subject, text });
}

export function queueStudentEmail(payload: Payload, to: string, kind: EmailKind, token?: string) {
    queueEmailWork(payload, () => sendStudentEmail(payload, to, kind, token));
}
