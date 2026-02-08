/**
 * In-memory rate limiter by identifier (e.g. IP).
 * For production with multiple instances, use Redis or similar.
 */

const windowMs = 60 * 1000; // 1 minute
const maxRequestsPerWindow = 60; // 60 requests per minute per IP

const store = new Map<string, { count: number; resetAt: number }>();

function getWindow(key: string): { count: number; resetAt: number } {
    const now = Date.now();
    const entry = store.get(key);
    if (!entry) {
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return { count: 1, resetAt };
    }
    if (now > entry.resetAt) {
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return { count: 1, resetAt };
    }
    entry.count += 1;
    return entry;
}

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const { count, resetAt } = getWindow(identifier);
    const allowed = count <= maxRequestsPerWindow;
    const remaining = Math.max(0, maxRequestsPerWindow - count);
    return { allowed, remaining, resetAt };
}

export function getClientIdentifier(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp;
    return "unknown";
}
