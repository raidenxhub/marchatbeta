/** Retry fetch with exponential backoff for transient errors */
export async function fetchWithRetry(
    url: string,
    init: RequestInit & { retries?: number },
    onRetry?: (attempt: number, error: Error) => void
): Promise<Response> {
    const maxRetries = init.retries ?? 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url, { ...init, retries: undefined } as RequestInit);
            if (res.ok || res.status < 500) return res;
            if (attempt < maxRetries && res.status >= 500) {
                lastError = new Error(res.statusText || `Server error ${res.status}`);
                onRetry?.(attempt + 1, lastError);
                await delay(1000 * Math.pow(2, attempt));
                continue;
            }
            return res;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (lastError.name === "AbortError") throw lastError;
            if (attempt < maxRetries) {
                onRetry?.(attempt + 1, lastError);
                await delay(1000 * Math.pow(2, attempt));
            } else {
                throw lastError;
            }
        }
    }
    throw lastError ?? new Error("Request failed");
}

function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}
