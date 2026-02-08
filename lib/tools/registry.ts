import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export interface ToolImplementation {
    declaration: FunctionDeclaration;
    execute: (args: any) => Promise<any>;
}

export const tools: Record<string, ToolImplementation> = {};

export function registerTool(impl: ToolImplementation) {
    tools[impl.declaration.name] = impl;
}

export function getToolDeclarations(): FunctionDeclaration[] {
    return Object.values(tools).map(t => t.declaration);
}

const SCHEMA_TYPE_MAP: Record<string, string> = {
    [SchemaType.STRING]: "string",
    [SchemaType.NUMBER]: "number",
    [SchemaType.INTEGER]: "integer",
    [SchemaType.BOOLEAN]: "boolean",
    [SchemaType.ARRAY]: "array",
    [SchemaType.OBJECT]: "object",
};

function toOpenAISchema(params: FunctionDeclaration["parameters"]): Record<string, unknown> {
    if (!params || !params.properties) {
        return { type: "object", properties: {} };
    }
    const properties: Record<string, unknown> = {};
    for (const [key, spec] of Object.entries(params.properties)) {
        const typed = spec as { type?: string; description?: string };
        properties[key] = {
            type: SCHEMA_TYPE_MAP[typed.type as string] ?? "string",
            description: typed.description,
        };
    }
    return {
        type: "object",
        properties,
        required: params.required || [],
    };
}

export function getOpenAITools(): Array<{ type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } }> {
    return Object.values(tools).map((t) => ({
        type: "function" as const,
        function: {
            name: t.declaration.name,
            description: t.declaration.description || "",
            parameters: toOpenAISchema(t.declaration.parameters),
        },
    }));
}

const TOOL_TIMEOUT_MS = 30_000;
const TOOL_MAX_RETRIES = 2;

/** In-memory cache for tool results (e.g. weather). Key -> { value, expires }. */
const toolCache = new Map<string, { value: unknown; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

function cacheKey(name: string, args: Record<string, unknown>): string {
    return `${name}:${JSON.stringify(args)}`;
}

function getCached<T>(key: string): T | undefined {
    const entry = toolCache.get(key);
    if (!entry || Date.now() > entry.expires) {
        if (entry) toolCache.delete(key);
        return undefined;
    }
    return entry.value as T;
}

function setCache(key: string, value: unknown): void {
    toolCache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

export async function executeTool(name: string, args: any): Promise<any> {
    const tool = tools[name];
    if (!tool) {
        throw new Error(`Tool ${name} not found`);
    }

    const argsObj = typeof args === "object" && args !== null ? args : {};
    const key = cacheKey(name, argsObj);
    const cached = getCached<unknown>(key);
    if (cached !== undefined && (name === "get_current_weather" || name === "google_search")) {
        return cached;
    }

    const run = () =>
        Promise.race([
            tool.execute(args),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Tool ${name} timed out after ${TOOL_TIMEOUT_MS}ms`)), TOOL_TIMEOUT_MS)
            ),
        ]);

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= TOOL_MAX_RETRIES; attempt++) {
        try {
            const result = await run();
            if (name === "get_current_weather" && result && typeof result === "object" && !(result as { error?: string }).error) {
                setCache(key, result);
            }
            return result;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt === TOOL_MAX_RETRIES) break;
        }
    }
    throw lastError ?? new Error(`Tool ${name} failed`);
}
