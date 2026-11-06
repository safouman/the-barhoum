import "server-only";

import type { NextRequest } from "next/server";

function claimsStudent(token?: string) {
    if (!token || token.length > 8192) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    try {
        return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"))?.collection === "students";
    } catch {
        return false;
    }
}

export function adminREST<Args extends unknown[]>(handler: (request: NextRequest, ...args: Args) => Promise<Response>) {
    return (request: NextRequest, ...args: Args) => {
        const auth = request.headers.get("authorization");
        const bearer = /^(?:Bearer|JWT) (.+)$/.exec(auth ?? "")?.[1];
        // A claimed student token can only cause a denial. Payload still authenticates
        // all remaining requests and applies its existing collection access rules.
        if (claimsStudent(bearer) || claimsStudent(request.cookies.get("payload-token")?.value)) {
            return Promise.resolve(Response.json({ errors: [{ message: "Administrator access is required." }] }, {
                status: 403,
                headers: { "Cache-Control": "no-store" },
            }));
        }
        return handler(request, ...args);
    };
}
