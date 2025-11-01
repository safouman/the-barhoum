type RateLimitBackend = "kv" | "memory";

const redisRestUrl =
    process.env.RATE_LIMIT_REDIS_REST_URL ??
    process.env.UPSTASH_REDIS_REST_URL ??
    "";
const redisRestToken =
    process.env.RATE_LIMIT_REDIS_REST_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    "";

type RateLimitResult = {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetMs: number;
    backend: RateLimitBackend;
};

type MemoryEntry = {
    count: number;
    resetTime: number;
};

function getMemoryStore(): Map<string, MemoryEntry> {
    const globalScope = globalThis as typeof globalThis & {
        __rateLimitMemoryStore?: Map<string, MemoryEntry>;
    };
    if (!globalScope.__rateLimitMemoryStore) {
        globalScope.__rateLimitMemoryStore = new Map<string, MemoryEntry>();
    }
    return globalScope.__rateLimitMemoryStore;
}

async function hitRedisRateLimit(
    key: string,
    windowMs: number,
    maxRequests: number
): Promise<RateLimitResult | null> {
    if (!redisRestUrl || !redisRestToken) {
        return null;
    }

    try {
        const response = await fetch(`${redisRestUrl}/pipeline`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${redisRestToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify([
                ["INCR", key],
                ["PEXPIRE", key, windowMs, "NX"],
                ["PTTL", key],
            ]),
        });

        if (!response.ok) {
            return null;
        }

        const payload = (await response.json()) as {
            result: Array<number | string>;
        };

        const [countRaw, , ttlRaw] = payload.result ?? [];
        const count = Number(countRaw ?? 0);
        let ttl = Number(ttlRaw ?? windowMs);

        if (!Number.isFinite(ttl) || ttl < 0) {
            ttl = windowMs;
        }

        const remaining = Math.max(0, maxRequests - count);

        return {
            allowed: count <= maxRequests,
            remaining,
            limit: maxRequests,
            resetMs: ttl,
            backend: "kv",
        };
    } catch {
        return null;
    }
}

function hitMemoryRateLimit(
    key: string,
    windowMs: number,
    maxRequests: number
): RateLimitResult {
    const store = getMemoryStore();
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now >= entry.resetTime) {
        const resetTime = now + windowMs;
        store.set(key, { count: 1, resetTime });
        return {
            allowed: true,
            remaining: maxRequests - 1,
            limit: maxRequests,
            resetMs: windowMs,
            backend: "memory",
        };
    }

    if (entry.count >= maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            limit: maxRequests,
            resetMs: Math.max(0, entry.resetTime - now),
            backend: "memory",
        };
    }

    entry.count += 1;
    store.set(key, entry);

    return {
        allowed: true,
        remaining: maxRequests - entry.count,
        limit: maxRequests,
        resetMs: Math.max(0, entry.resetTime - now),
        backend: "memory",
    };
}

export async function hitRateLimit(
    key: string,
    windowMs: number,
    maxRequests: number
): Promise<RateLimitResult> {
    const redisResult = await hitRedisRateLimit(key, windowMs, maxRequests);
    if (redisResult) {
        return redisResult;
    }
    return hitMemoryRateLimit(key, windowMs, maxRequests);
}

export function getRateLimitBackend(): RateLimitBackend {
    return redisRestUrl && redisRestToken ? "kv" : "memory";
}
