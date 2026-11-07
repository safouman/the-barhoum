import "server-only";

import { readStudentSession } from "@/lib/student-auth/session";

export async function readHeaderSignedIn(): Promise<boolean> {
    try {
        return Boolean(await readStudentSession());
    } catch {
        // A session lookup outage must not take down the public site.
        return false;
    }
}
