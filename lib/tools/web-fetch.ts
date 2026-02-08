import { SchemaType } from "@google/generative-ai";
import { ToolImplementation } from "./registry";

const MAX_BODY_BYTES = 100_000; // ~100KB
const FETCH_TIMEOUT_MS = 15_000;

async function fetchUrl(url: string): Promise<{ content: string; title?: string; error?: string }> {
    try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
            return { content: "", error: "Only http and https URLs are allowed" };
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        const res = await fetch(url, {
            signal: controller.signal,
            headers: { "User-Agent": "MAR-Chat/1.0 (https://gomarai.com)" },
        });
        clearTimeout(timeout);

        if (!res.ok) {
            return { content: "", error: `HTTP ${res.status}: ${res.statusText}` };
        }

        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/json")) {
            return { content: "", error: `Unsupported content type: ${contentType.split(";")[0]}` };
        }

        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > MAX_BODY_BYTES) {
            return {
                content: new TextDecoder("utf-8", { fatal: false }).decode(buffer.slice(0, MAX_BODY_BYTES)) +
                    "\n\n[Content truncated - response exceeded 100KB]",
                error: undefined,
            };
        }

        const content = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
        return { content };
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Fetch failed";
        return { content: "", error: msg };
    }
}

export const webFetchTool: ToolImplementation = {
    declaration: {
        name: "web_fetch",
        description: "Fetch and return the text content of a URL. Use for reading web pages, docs, APIs (JSON), or any public URL. Only supports http/https. Returns raw HTML/text - extract the relevant parts in your response.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                url: {
                    type: SchemaType.STRING,
                    description: "The full URL to fetch (must start with http:// or https://)",
                },
            },
            required: ["url"],
        },
    },
    execute: async (args: { url?: string }) => {
        const url = args?.url;
        if (!url || typeof url !== "string") {
            return { error: "URL is required" };
        }
        return await fetchUrl(url.trim());
    },
};
