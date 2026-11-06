import "server-only";

import { sql } from "@payloadcms/db-postgres";
import { AuthError, digest, opaqueToken, type AuthTx } from "./core";

type Purpose = "signup" | "google-signup" | "email-change" | "google-oauth";

export async function createChallenge({ tx }: AuthTx, purpose: Purpose, context: object, minutes: number) {
    const token = opaqueToken();
    await tx.execute(sql`DELETE FROM student_auth_challenges WHERE expires_at <= now()`);
    await tx.execute(sql`
        INSERT INTO student_auth_challenges (token_hash, purpose, context, expires_at)
        VALUES (${digest(token)}, ${purpose}, ${JSON.stringify(context)}::jsonb, ${new Date(Date.now() + minutes * 60_000).toISOString()})
    `);
    return token;
}

export async function consumeChallenge({ tx }: AuthTx, token: string, purposes: Purpose[]) {
    const { rows } = await tx.execute(sql`
        DELETE FROM student_auth_challenges
        WHERE token_hash = ${digest(token)} AND purpose IN (${sql.join(purposes.map(purpose => sql`${purpose}`), sql`, `)}) AND expires_at > now()
        RETURNING purpose, context
    `);
    if (!rows[0]) throw new AuthError("INVALID_TOKEN");
    return rows[0] as { purpose: Purpose; context: Record<string, unknown> };
}

export async function readEmailChangeChallenge({ tx }: AuthTx, token: string) {
    const { rows } = await tx.execute(sql`
        SELECT context FROM student_auth_challenges
        WHERE token_hash = ${digest(token)} AND purpose = 'email-change' AND expires_at > now()
    `);
    if (!rows[0]) throw new AuthError("INVALID_TOKEN");
    return rows[0].context;
}
