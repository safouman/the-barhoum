import "server-only";

import type { NextRequest } from "next/server";
import { z } from "zod";
import { AuthError, authOrigin, rateLimit, studentPayload } from "../../student-auth/core";
import { requestStudent } from "../../student-auth/session";
import { ProgressError } from "./errors";
import { authorizedProgressWrite, recordVisit, saveResume, setCompletion } from "./service";

const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
const revision = z.number().int().min(0).max(2_147_483_647);
const completionInput = z.strictObject({ completed: z.boolean(), expectedRevision: revision });
const resumeInput = z.strictObject({
    videoId: z.string().regex(/^[1-9][0-9]{0,29}$/),
    seconds: z.number().min(0).max(86_400),
    expectedRevision: revision,
});

async function readInput(request: Request, empty: boolean) {
    if (request.headers.get("origin") !== authOrigin().origin || request.headers.get("sec-fetch-site") === "cross-site") {
        throw new ProgressError("INVALID_INPUT");
    }
    if (!request.body && empty) return;
    if (!request.body || (!empty && request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json")) {
        throw new ProgressError("INVALID_INPUT");
    }

    const reader = request.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let bytes = 0;
    let text = "";
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > (empty ? 0 : 1024)) {
                await reader.cancel();
                throw new ProgressError("INVALID_INPUT");
            }
            text += decoder.decode(value, { stream: true });
        }
        return empty ? undefined : JSON.parse(text + decoder.decode()) as unknown;
    } catch {
        throw new ProgressError("INVALID_INPUT");
    } finally {
        reader.releaseLock();
    }
}

type ProgressRouteContext = { params: Promise<{ courseSlug: string; lessonId: string }> };

export function progressHandler(action: "visit" | "completion" | "resume") {
    return async (request: NextRequest, { params }: ProgressRouteContext) => {
        try {
            const { courseSlug, lessonId } = await params;
            if (!/^[1-9]\d{0,9}$/.test(lessonId) || Number(lessonId) > 2_147_483_647 ||
                !courseSlug || courseSlug.length > 200) throw new ProgressError("INVALID_INPUT");
            const input = await readInput(request, action === "visit");
            const completion = action === "completion" ? completionInput.parse(input) : null;
            const resume = action === "resume" ? resumeInput.parse(input) : null;
            const payload = await studentPayload();
            const identity = await requestStudent(payload, request);
            if (!identity?.user._verified) throw new AuthError("UNAUTHENTICATED");
            await rateLimit(payload, request, `learning-progress:${action}`, String(identity.user.id), [180, 2400], 5);
            const result = await authorizedProgressWrite<unknown>(payload, identity, courseSlug, Number(lessonId), async (context, studentId, scope) => {
                if (completion) return setCompletion(context, studentId, scope, completion.completed, completion.expectedRevision);
                if (resume) return saveResume(payload, context, studentId, scope, resume.videoId, resume.seconds, resume.expectedRevision);
                return recordVisit(context, studentId, scope);
            });
            return Response.json(result, { headers });
        } catch (cause) {
            const error = cause instanceof z.ZodError ? new ProgressError("INVALID_INPUT") : cause;
            const safe = error instanceof ProgressError || error instanceof AuthError ? error : new AuthError("UNAVAILABLE");
            return Response.json({
                error: { code: safe.code, message: safe.message },
                ...(safe instanceof ProgressError && safe.current !== undefined ? { current: safe.current } : {}),
            }, { status: safe.status, headers });
        }
    };
}
