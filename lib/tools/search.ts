import { SchemaType } from "@google/generative-ai";
import { ToolImplementation } from "./registry";

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

async function webSearch(query: string) {
    if (!SERPAPI_KEY) throw new Error("SERPAPI_API_KEY not configured");
    const q = String(query || "").trim();
    if (!q) throw new Error("Search query is required");

    const params = new URLSearchParams({
        api_key: SERPAPI_KEY,
        engine: "google",
        q,
        google_domain: "google.com",
        gl: "us",
        hl: "en",
    });
    console.log(`[Search] Querying: ${q}`);
    try {
        const res = await fetch(`https://serpapi.com/search.json?${params}`);
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[Search] SerpApi error (${res.status}):`, errorText);
            throw new Error(`SerpApi error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();

        if (data.error) {
            throw new Error(typeof data.error === "string" ? data.error : "Search failed");
        }

        const raw = Array.isArray(data.organic_results) ? data.organic_results : [];
        const organic = raw.slice(0, 5).map((r: Record<string, unknown>) => ({
            title: r.title ?? "",
            link: r.link ?? "",
            snippet: r.snippet ?? "",
        }));

        return { results: organic };
    } catch (e) {
        console.error("[Search] Web search fetch error:", e);
        throw e;
    }
}

async function imageSearch(query: string) {
    if (!SERPAPI_KEY) throw new Error("SERPAPI_API_KEY not configured");
    const q = String(query || "").trim();
    if (!q) throw new Error("Image search query is required");

    const params = new URLSearchParams({
        api_key: SERPAPI_KEY,
        engine: "google_images",
        q,
        gl: "us",
        hl: "en",
    });
    try {
        const res = await fetch(`https://serpapi.com/search.json?${params}`);
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[Search] Image SerpApi error (${res.status}):`, errorText);
            throw new Error(`SerpApi error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();

        if (data.error) {
            throw new Error(typeof data.error === "string" ? data.error : "Image search failed");
        }

        const raw = Array.isArray(data.images_results) ? data.images_results : [];
        const images = raw.slice(0, 5).map((img: Record<string, unknown>) => ({
            title: img.title ?? "",
            url: img.original ?? img.thumbnail ?? "",
            thumbnail: img.thumbnail ?? img.original ?? "",
        }));

        return { images };
    } catch (e) {
        console.error("[Search] Image search fetch error:", e);
        throw e;
    }
}

export const googleSearchTool: ToolImplementation = {
    declaration: {
        name: "google_search",
        description: "Search the web for information, news, and current events.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: {
                    type: SchemaType.STRING,
                    description: "The search query"
                }
            },
            required: ["query"]
        }
    },
    execute: async (args: { query?: string }) => {
        try {
            const query = args?.query;
            if (!query || typeof query !== "string") {
                return { error: "Search query is required" };
            }
            return await webSearch(query);
        } catch (e) {
            return { error: e instanceof Error ? e.message : "Search failed" };
        }
    },
};

export const googleImageSearchTool: ToolImplementation = {
    declaration: {
        name: "google_image_search",
        description: "Search for images.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: {
                    type: SchemaType.STRING,
                    description: "Image search query"
                }
            },
            required: ["query"]
        }
    },
    execute: async (args: { query?: string }) => {
        try {
            const query = args?.query;
            if (!query || typeof query !== "string") {
                return { error: "Image search query is required" };
            }
            return await imageSearch(query);
        } catch (e) {
            return { error: e instanceof Error ? e.message : "Image search failed" };
        }
    },
};
