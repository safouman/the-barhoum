export class ProgressError extends Error {
    constructor(readonly code: "INVALID_INPUT" | "NOT_FOUND" | "REVISION_CONFLICT", readonly current?: unknown) {
        super({
            INVALID_INPUT: "Check the information and try again.",
            NOT_FOUND: "This lesson or video is unavailable.",
            REVISION_CONFLICT: "Progress changed in another session. Check the current state and try again.",
        }[code]);
    }

    get status() {
        return { INVALID_INPUT: 400, NOT_FOUND: 404, REVISION_CONFLICT: 409 }[this.code];
    }
}
