/**
 * Observability: log tool calls and errors without user content.
 * Use for latency percentiles and token usage in production (e.g. export to your metrics backend).
 */

export function logToolCall(params: {
    name: string;
    durationMs: number;
    success: boolean;
    error?: string;
}) {
    const { name, durationMs, success, error } = params;
    if (process.env.NODE_ENV === "development") {
        console.log(`[Tool] ${name} ${success ? "ok" : "error"} ${durationMs}ms${error ? ` ${error}` : ""}`);
    }
    // In production you could send to your logging/metrics service:
    // metrics.toolCall({ name, durationMs, success, error: error?.slice(0, 100) });
}

export function logChatRequest(params: {
    model: string;
    messageCount: number;
    stream: boolean;
}) {
    if (process.env.NODE_ENV === "development") {
        console.log(`[Chat] model=${params.model} messages=${params.messageCount} stream=${params.stream}`);
    }
}

export function logChatError(message: string) {
    console.error("[Chat API]", message);
}
