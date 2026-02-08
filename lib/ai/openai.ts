import { Message, ModelId, MessageRole } from "@/lib/types/chat";
import { getOpenAITools, executeTool } from "@/lib/tools/registry";
import { logToolCall } from "@/lib/api/observability";
import "@/lib/tools/init";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Most cost-efficient model with reliable tool use (~$0.15/1M in, ~$0.60/1M out)
const DEFAULT_MODEL = "gpt-4o-mini";

const MODEL_MAP: Record<ModelId, string> = {
    "mar-beta": "gpt-4o-mini",
    "mar-pro": "gpt-4o-mini",
    "mar-deep": "gpt-4o-mini",
};

const MAX_TOKENS_MAP: Record<ModelId, number> = {
    "mar-beta": 4096,
    "mar-pro": 4096,
    "mar-deep": 4096,
};

// Same system prompts as gemini.ts for consistent MAR personality and tool usage
const SYSTEM_PROMPTS: Record<string, string> = {
    default: `You are MAR, a world-class AI assistant created by MAR AI (gomarai.com). 

Your core principles:
- Be proactive: If a user asks for something that requires a tool (like flights), and you need more info (like airport codes), use your google_search tool to find it first instead of asking the user.
- Be helpful: Provide accurate, useful, and comprehensive responses.
- Be honest: Be truthful, acknowledge uncertainty, and correct mistakes.
- Be human: Use natural, fluid language. Avoid "AI-isms" or overly formal/mechanical tone. NEVER say "I'm an AI", "I'm just a program", "as a language model", or similar robotic phrases. You're MAR—warm, capable, and present. Speak in first person as MAR.
- Be stylish: Use standard Markdown formatting.
- Never use emojis, be professional
- Always sound human in writing, over advanced lexicon or language, be a human being.
- Never use "certainly, precisely" etc filler worlds like these, be human!

Key capabilities:
- MAR PRO: Ultra-fast reasoning and tool use.
- MAR BETA: Deep analysis and complex problem solving.
- MAR Deep Research: Specialized for evidence-based research.

MAR (MAR Chat parent company):
Introducing MAR Chat
AI that understands
your needs
MAR builds reliable, interpretable, and steerable AI systems. Our mission is to create AI that is safe, beneficial, and accessible to everyone.
Frontier AI with unmatched capabilities
Advanced reasoning
Complex problem-solving and logical analysis across domains from mathematics to business strategy.

Code generation
Write, debug, and explain code in any programming language with contextual understanding.

Creative writing
Generate compelling content from blog posts to technical documentation with your voice.

Data analysis
Extract insights from complex datasets and visualize findings with clarity.

Multilingual support
Fluent communication in over 100 languages with cultural nuance.

Enterprise security
SOC 2 Type II compliant with end-to-end encryption and data privacy controls.
About MAR
We are building AI systems that are safe, beneficial, and accessible to everyone. Our mission is to ensure that artificial intelligence helps humanity flourish.

Our mission

Creating AI that understands and helps
At MAR, we believe that AI has the potential to be one of the most transformative technologies in human history. Done right, it can help solve some of the worlds most pressing challenges, from climate change to disease to poverty.

But realizing this potential requires getting AI development right. That means building systems that are not just capable, but also safe, interpretable, and aligned with human values. This is the challenge that drives everything we do.

Our values

What guides us
Safety first
We prioritize the safety of our AI systems above all else, investing heavily in research to ensure our technology is beneficial and aligned with human values.

Transparency
We publish our research, share our safety practices, and engage openly with the AI community and policymakers about the challenges and opportunities ahead.

Long-term thinking
We make decisions with a long-term perspective, focusing on building trust and creating lasting positive impact rather than short-term gains.

Collaboration
We work closely with researchers, organizations, and agencies around the world to ensure AI development benefits everyone.

Our journey

Key milestones
2023

MAR founded with a mission to build safe, beneficial AI

2024

First research paper published on AI alignment techniques

2025

MAR Chat beta launched to select partners

2026

Public launch of MAR Chat and API

Leadership

Our team
Kenan Nezar
Kenan Nezar
Founder

kenannezar@gomarai.com

Alaa Abbadi
Alaa Abbadi
Co-founder

alaaabbadi@gomarai.com

Tool usage instructions:
- ONLY use tools when REQUIRED or explicitly asked. Do NOT call tools for general chat, follow-ups, or when you can answer from knowledge. This saves tokens.
- When the user clearly asks for real-time info (flights, weather, search, hotel availability, etc.), THEN use the tool.
- Use at most 2-3 tool calls per turn. After getting tool results, write your final answer directly—do not chain more tool calls.
- When searching for flights: (1) Use google_search to find IATA codes if needed (e.g. Dammam=DMM, Frankfurt=FRA). (2) ALWAYS pass outbound_date and return_date in YYYY-MM-DD format (e.g. 2026-02-12, 2026-02-19). Parse "12th february" as 2026-02-12.
- CRITICAL for search_flights, search_hotels, get_current_weather: Results appear as instant cards in the UI. Your reply MUST be ONLY 1–2 short sentences like "Here are the available flights for your dates. Do you have any preference?" or "Here are some hotel options. Would you like me to narrow it down?" or "Here's the weather for that location." NEVER list airlines, hotels, times, prices, temperatures, conditions, or any table/list data—the user already sees it. If you type out the data, your message will be hidden.
- If a tool returns an error, briefly say what went wrong and suggest the user try again or rephrase. Do not apologize excessively.
- Always be proactive. Don't wait for the user if you can find the info yourself.
- When the user asks you to create, build, or write something they can use (a webpage, a script, a document, code they can run), use the create_artifact tool with a clear title, type (code, document, or html), and the full content. For web pages use type "html" and provide complete HTML. For scripts use type "code".
- Use web_fetch to fetch URL content when the user wants to read a webpage, doc, or API response.
- Document skills: For Word (.docx), PowerPoint (.pptx), PDF, or Excel (.xlsx), provide runnable Python/Node scripts using docx, openpyxl, pandas, pypdf, pdfplumber, reportlab. Use create_artifact type "code" to deliver. Follow best practices: Excel formulas over hardcoded values, proper docx-js structure for Word, reportlab for PDF creation.`,

    professional: `You are MAR, a professional AI assistant. Maintain formal language, structured responses, and focus on clarity and accuracy.`,

    casual: `You are MAR, a friendly AI assistant. Be conversational, use occasional emoji, and maintain an approachable tone while still being helpful.`,

    technical: `You are MAR, a technical AI assistant. Focus on precision, include code examples, and use technical terminology where appropriate.`,

    creative: `You are MAR, a creative AI assistant. Be expressive, think outside the box, and help with creative projects with enthusiasm.`,

    educational: `You are MAR, an educational AI assistant. Explain concepts clearly with examples, use analogies, and encourage learning through questions.`,

    "deep-research": `You are MAR Deep Research. YOUR SOLE PURPOSE is to provide comprehensive, evidence-based answers. 
    - You MUST use the google_search tool extensively to verify facts and gather information. 
    - Verify multiple sources before answering. 
    - Provide deep analysis, not just surface-level summaries. 
    - Cite your sources clearly.`,

    reasoner: `You are MAR Reasoner. YOUR GOAL is to solve complex problems through rigorous step-by-step thinking.
    - BREAK DOWN every problem into smaller components.
    - SHOW YOUR WORK: Explain your thought process clearly.
    - Use the calculator or sandbox tools for any computation or code execution to ensure accuracy.
    - Double-check your logic before concluding.
    - Never use filler w`,
    
};

const MAX_MESSAGES_CONTEXT = 20;
const MAX_TOOL_ITERATIONS = 5; // Prevent infinite tool loops

function getApiKey(): string {
    let key = (process.env.OPENAI_API_KEY ?? "").trim().split(/\s/)[0] ?? "";
    if (!key) throw new Error("OPENAI_API_KEY is not configured");
    if (key.startsWith("OPENAI_API_KEY=")) key = key.replace(/^OPENAI_API_KEY=/, "");
    return key;
}

type OpenAIMessage =
    | { role: "system" | "user" | "assistant"; content: string }
    | { role: "assistant"; content: string | null; tool_calls: Array<{ id: string; type?: string; function: { name: string; arguments: string } }> }
    | { role: "tool"; tool_call_id: string; content: string };

const RESPONSE_STYLE_MODIFIERS: Record<string, string> = {
    normal: "",
    learning: "\n\nResponse style: Learning mode. Explain concepts step-by-step, use analogies, and encourage understanding through examples. Be educational and patient.",
    concise: "\n\nResponse style: Be concise and brief. Get to the point quickly. Avoid unnecessary elaboration.",
    explanatory: "\n\nResponse style: Be thorough and explanatory. Provide detailed explanations with examples. Cover nuances and edge cases.",
    formal: "\n\nResponse style: Use formal language. Be professional, structured, and precise. Avoid casual expressions.",
};

/** Human-like reasoning text (like Gemini/Claude) based on tool name and args. */
function getHumanReasoning(toolName: string, args: Record<string, unknown>): string {
    const q = typeof args.query === "string" ? args.query : typeof args.q === "string" ? args.q : null;
    const url = typeof args.url === "string" ? args.url : null;
    const loc = typeof args.location === "string" ? args.location : typeof args.city === "string" ? args.city : null;
    const title = typeof args.title === "string" ? args.title : null;
    const type = typeof args.type === "string" ? args.type : "document";
    const origin = typeof args.origin === "string" ? args.origin : null;
    const dest = typeof args.destination === "string" ? args.destination : null;

    switch (toolName) {
        case "google_search":
            return q
                ? `Let me search the web for "${q.slice(0, 60)}${q.length > 60 ? "…" : ""}". I'll find the most relevant and up-to-date information.`
                : "Searching the web for relevant information to answer your question.";
        case "web_fetch":
            return url
                ? `I'll read that page at ${url.slice(0, 50)}${url.length > 50 ? "…" : ""} to get the details you need.`
                : "Fetching the webpage to extract the information.";
        case "search_flights":
            return origin && dest
                ? `Let me search for flights from ${origin} to ${dest}. I'll check prices and availability across airlines.`
                : "Looking up flights for your trip. I'll compare prices and schedules.";
        case "search_hotels":
            return loc
                ? `Searching for hotels in ${loc}. I'll find the best options that match your criteria.`
                : "Searching for hotels that match your criteria. Let me compare the options.";
        case "get_current_weather":
            return loc
                ? `Checking the current weather in ${loc} and the forecast for the coming days.`
                : "Getting the current weather conditions and forecast.";
        case "create_artifact":
            return title
                ? `Creating "${title}" as a ${type}. I'll build this step by step.`
                : `Building your ${type}. Give me a moment to put this together.`;
        case "calculator":
            return "Running the calculation. Let me crunch those numbers.";
        case "read_file":
        case "read_document":
            return "Reading through the document to extract the relevant information.";
        case "sandbox":
        case "run_code":
            return "Executing the code in a sandboxed environment. I'll show you the results.";
        default:
            return "Working on that. Give me a moment.";
    }
}

/** Brief summary after tool results come back. */
function getToolResultSummary(toolName: string, result: unknown): string | null {
    if (!result || typeof result !== "object") return null;
    const r = result as Record<string, unknown>;
    if (r.error) return null; // Don't summarize errors

    switch (toolName) {
        case "google_search": {
            const items = Array.isArray(r.results) ? r.results.length : 0;
            return items > 0 ? `Found ${items} results. Let me format the best information for you.` : null;
        }
        case "search_flights": {
            const flights = Array.isArray(r.flights) ? r.flights.length : 0;
            return flights > 0 ? `Found ${flights} flight options. Let me show you the best ones.` : null;
        }
        case "search_hotels": {
            const hotels = Array.isArray(r.hotels) ? r.hotels.length : 0;
            return hotels > 0 ? `Found ${hotels} hotels. Let me highlight the top choices.` : null;
        }
        case "get_current_weather":
            return "Got the weather data. Here's what I found.";
        case "web_fetch":
            return "Finished reading the page. Let me summarize the key points.";
        case "sandbox":
        case "run_code":
            return "Code execution complete. Here are the results.";
        default:
            return null;
    }
}

function messagesToOpenAI(
    messages: Array<{ role: MessageRole; content: string }>,
    persona: string = "default",
    options?: {
        webSearchEnabled?: boolean;
        responseStyle?: string;
        skills?: string[];
        profileName?: string;
        whatShouldCallYou?: string;
        workFunction?: string;
        personalPreferences?: string;
        memoryFacts?: string[];
    }
): OpenAIMessage[] {
    const trimmed = messages.length > MAX_MESSAGES_CONTEXT
        ? messages.slice(-MAX_MESSAGES_CONTEXT)
        : messages;
    let systemPrompt = SYSTEM_PROMPTS[persona] ?? SYSTEM_PROMPTS.default;
    if (options?.webSearchEnabled === false) {
        systemPrompt += "\n\nCRITICAL: Web search is DISABLED. Do NOT use the google_search tool. Answer only from your training knowledge.";
    }
    const styleMod = options?.responseStyle && RESPONSE_STYLE_MODIFIERS[options.responseStyle];
    if (styleMod) systemPrompt += styleMod;
    if (options?.skills?.length) {
        systemPrompt += "\n\nUser-defined skills to follow in every response:\n" + options.skills.map((s, i) => `${i + 1}. ${s}`).join("\n");
    }
    const profileParts: string[] = [];
    if (options?.profileName) profileParts.push(`Full name: ${options.profileName}`);
    if (options?.whatShouldCallYou) profileParts.push(`Preferred name / what MAR should call you: ${options.whatShouldCallYou}`);
    if (options?.workFunction) profileParts.push(`What best describes their work: ${options.workFunction}`);
    if (options?.personalPreferences) profileParts.push(`Personal preferences to consider in responses: ${options.personalPreferences}`);
    if (profileParts.length) {
        systemPrompt += "\n\nUser profile—USE THIS IN EVERY RESPONSE:\n" + profileParts.join("\n") + "\n\nAddress the user by their preferred name when natural. Reference their work and preferences when relevant. Never remind them you're an AI.";
    }
    if (options?.memoryFacts?.length) {
        systemPrompt += "\n\nThings to remember (use across conversations):\n" + options.memoryFacts.map((f, i) => `${i + 1}. ${f}`).join("\n");
    }
    const openaiMessages: OpenAIMessage[] = [
        { role: "system", content: systemPrompt },
    ];
    for (const m of trimmed) {
        if (m.role === "system") continue;
        openaiMessages.push({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
        });
    }
    return openaiMessages;
}

export async function* streamChatCompletion(
    messages: Array<{ role: MessageRole; content: string }>,
    modelId: ModelId = "mar-beta",
    persona: string = "default",
    options?: {
        webSearchEnabled?: boolean;
        responseStyle?: string;
        skills?: string[];
        profileName?: string;
        whatShouldCallYou?: string;
        workFunction?: string;
        personalPreferences?: string;
        memoryFacts?: string[];
    }
): AsyncGenerator<{
    text?: string;
    reasoning?: string;
    done: boolean;
    truncated?: boolean;
    usage?: { promptTokens: number; completionTokens: number };
    artifact?: { title: string; type?: string; content?: string };
    flightResults?: { flights: unknown[]; search_url: string };
    hotelResults?: { hotels: unknown[]; search_url: string };
    weatherResults?: { current: unknown; forecast_summary?: unknown; daily_forecast?: unknown[] };
}> {
    const model = MODEL_MAP[modelId] || DEFAULT_MODEL;
    const maxTokens = MAX_TOKENS_MAP[modelId] || 4096;
    const apiKey = getApiKey();
    const tools = getOpenAITools();
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let currentMessages: OpenAIMessage[] = messagesToOpenAI(messages, persona, options);
    let toolIterations = 0;

    try {
        while (true) {
            const body: Record<string, unknown> = {
                model,
                messages: currentMessages as unknown[],
                stream: true,
                max_tokens: maxTokens,
                temperature: 0.7,
            };
            if (tools.length > 0) body.tools = tools;
            if (tools.length > 0) body.tool_choice = "auto";

            const controller = new AbortController();
            const fetchTimeout = setTimeout(() => controller.abort(), 60_000);
            let res: Response;
            try {
                res = await fetch(OPENAI_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify(body),
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(fetchTimeout);
            }

            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || `OpenAI ${res.status}`);
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No response body");
            const decoder = new TextDecoder();
            let buffer = "";
            let yieldedAnyText = false;
            let finishReason: string | null = null;
            const toolCallsAccum: Array<{ id: string; name: string; args: string }> = [];

            const READ_TIMEOUT_MS = 30_000; // 30s per chunk max
            while (true) {
                const readPromise = reader.read();
                const timeoutPromise = new Promise<{ done: true; value: undefined }>((resolve) =>
                    setTimeout(() => resolve({ done: true, value: undefined }), READ_TIMEOUT_MS)
                );
                const { done, value } = await Promise.race([readPromise, timeoutPromise]);
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6).trim();
                        if (data === "[DONE]") break;
                        try {
                            const parsed = JSON.parse(data);
                            const choice = parsed.choices?.[0];
                            if (choice?.finish_reason) finishReason = choice.finish_reason;
                            const delta = choice?.delta;
                            if (!delta) continue;

                            if (delta.content) {
                                yieldedAnyText = true;
                                yield { text: delta.content, done: false };
                            }
                            if (delta.tool_calls) {
                                for (const tc of delta.tool_calls as Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }>) {
                                    const idx = tc.index ?? 0;
                                    if (!toolCallsAccum[idx]) toolCallsAccum[idx] = { id: "", name: "", args: "" };
                                    if (tc.id) toolCallsAccum[idx].id = tc.id;
                                    if (tc.function?.name) toolCallsAccum[idx].name = tc.function.name;
                                    if (tc.function?.arguments) toolCallsAccum[idx].args += tc.function.arguments;
                                }
                            }
                        } catch (_e) {
                            // skip
                        }
                    }
                }
            }

            const firstTool = toolCallsAccum.find((t) => t.name && t.id);
            if (firstTool) {
                toolIterations++;
                if (toolIterations > MAX_TOOL_ITERATIONS) {
                    // Force stop tool loop - return fallback and exit
                    yieldedAnyText = true;
                    yield {
                        text: "\n\n*I've gathered the information but hit a limit. Please try asking more specifically.*",
                        done: false,
                    };
                    break;
                }

                let args: Record<string, unknown> = {};
                try {
                    args = JSON.parse(firstTool.args);
                } catch (_e) {}

                const humanReasoning = getHumanReasoning(firstTool.name, args);
                yield { reasoning: humanReasoning, done: false };
                let toolResult: unknown;
                const toolStart = Date.now();
                try {
                    toolResult = await executeTool(firstTool.name, args);
                    logToolCall({ name: firstTool.name, durationMs: Date.now() - toolStart, success: true });
                } catch (err) {
                    const msg = err instanceof Error ? err.message : "Tool failed";
                    logToolCall({ name: firstTool.name, durationMs: Date.now() - toolStart, success: false, error: msg });
                    toolResult = { error: msg };
                }

                // Yield brief summary after tool completes
                const summary = getToolResultSummary(firstTool.name, toolResult);
                if (summary) {
                    yield { reasoning: summary, done: false };
                }
                if (firstTool.name === "create_artifact" && toolResult && typeof toolResult === "object" && (toolResult as { title?: string }).title) {
                    yield { artifact: toolResult as { title: string; type?: string; content?: string }, done: false };
                }
                if (firstTool.name === "search_flights" && toolResult && typeof toolResult === "object" && !(toolResult as { error?: string }).error) {
                    const data = toolResult as { flights?: unknown[]; search_url?: string };
                    if (Array.isArray(data.flights) && data.flights.length > 0) {
                        yield { flightResults: { flights: data.flights, search_url: data.search_url || "https://www.google.com/travel/flights" }, done: false };
                    }
                }
                if (firstTool.name === "search_hotels" && toolResult && typeof toolResult === "object" && !(toolResult as { error?: string }).error) {
                    const data = toolResult as { hotels?: unknown[]; search_url?: string };
                    if (Array.isArray(data.hotels) && data.hotels.length > 0) {
                        yield { hotelResults: { hotels: data.hotels, search_url: data.search_url || "https://www.google.com/travel/hotels" }, done: false };
                    }
                }
                if (firstTool.name === "get_current_weather" && toolResult && typeof toolResult === "object" && !(toolResult as { error?: string }).error) {
                    const data = toolResult as { current?: unknown; forecast_summary?: unknown; daily_forecast?: unknown[] };
                    if (data.current) {
                        yield { weatherResults: { current: data.current, forecast_summary: data.forecast_summary, daily_forecast: data.daily_forecast }, done: false };
                    }
                }

                let toolContent = typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult);
                if (firstTool.name === "search_flights" || firstTool.name === "search_hotels" || firstTool.name === "get_current_weather") {
                    const label = firstTool.name === "search_flights" ? "flights" : firstTool.name === "search_hotels" ? "hotels" : "weather";
                    toolContent = `[CRITICAL: The ${label} results are shown as cards in the UI. Reply with ONLY 1–2 sentences like "Here are the available ${label} for your dates. Do you have any preference?" or "Here's the weather for that location." Do NOT list any data—no airlines, hotels, times, prices, temperatures, or conditions. Your reply will be hidden if you do.]\n\n` + toolContent;
                }
                currentMessages = [
                    ...currentMessages,
                    {
                        role: "assistant" as const,
                        content: null as unknown as string,
                        tool_calls: [{ id: firstTool.id, type: "function", function: { name: firstTool.name, arguments: firstTool.args } }],
                    },
                    {
                        role: "tool" as const,
                        tool_call_id: firstTool.id,
                        content: toolContent,
                    },
                ];
                // Next request: force model to respond with text after tools (avoid infinite tool loop)
                continue;
            }

            if (!yieldedAnyText) {
                yield {
                    text: "I'm having trouble with that right now. Please try again in a moment.",
                    done: false,
                };
            }

            yield {
                done: true,
                truncated: finishReason === "length",
                usage: { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens },
            };
            break;
        }
    } catch (error) {
        console.error("[MAR/OpenAI] Streaming error:", error);
        yield {
            text: `\n\n**Error:** ${error instanceof Error ? error.message : "An unexpected error occurred."}`,
            done: true,
        };
    }
}

export async function generateChatCompletion(
    messages: Array<{ role: MessageRole; content: string }>,
    modelId: ModelId = "mar-beta",
    persona: string = "default",
    options?: { webSearchEnabled?: boolean; responseStyle?: string }
): Promise<{ text: string; usage: { promptTokens: number; completionTokens: number } }> {
    const model = MODEL_MAP[modelId] || DEFAULT_MODEL;
    const maxTokens = MAX_TOKENS_MAP[modelId] || 4096;
    const apiKey = getApiKey();
    const body: Record<string, unknown> = {
        model,
        messages: messagesToOpenAI(messages, persona, options),
        max_tokens: maxTokens,
        temperature: 0.7,
    };
    const tools = getOpenAITools();
    if (tools.length > 0) {
        body.tools = tools;
        body.tool_choice = "auto";
    }
    const res = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string; tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }> } }>;
        usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const msg = data.choices?.[0]?.message;
    if (msg?.tool_calls?.length) {
        const tc = msg.tool_calls[0];
        let args: Record<string, unknown> = {};
        try {
            args = JSON.parse(tc.function.arguments);
        } catch (_e) {}
        const toolResult = await executeTool(tc.function.name, args);
        const toolCallsWithType = msg.tool_calls.map((t) => ({
            id: t.id,
            type: "function" as const,
            function: t.function,
        }));
        const nextMessages: OpenAIMessage[] = [
            ...messagesToOpenAI(messages, persona, options),
            { role: "assistant", content: msg.content ?? null, tool_calls: toolCallsWithType },
            { role: "tool", tool_call_id: tc.id, content: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult) },
        ];
        const body2: Record<string, unknown> = { model, messages: nextMessages, max_tokens: maxTokens, temperature: 0.7 };
        if (tools.length > 0) {
            body2.tools = tools;
            body2.tool_choice = "auto";
        }
        const res2 = await fetch(OPENAI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify(body2),
        });
        if (!res2.ok) throw new Error(await res2.text());
        const data2 = (await res2.json()) as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens: number; completion_tokens: number } };
        const text = data2.choices?.[0]?.message?.content ?? "";
        const usage = data.usage && data2.usage
            ? { promptTokens: data.usage.prompt_tokens + data2.usage.prompt_tokens, completionTokens: data.usage.completion_tokens + data2.usage.completion_tokens }
            : { promptTokens: 0, completionTokens: 0 };
        return { text, usage };
    }
    const text = msg?.content ?? "";
    const usage = data.usage
        ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens }
        : { promptTokens: 0, completionTokens: 0 };
    return { text, usage };
}

export async function generateTitle(
    messages: Array<{ role: MessageRole; content: string }>
): Promise<string> {
    if (messages.length === 0) return "New Chat";
    const apiKey = getApiKey();
    const prompt = `Generate a short conversation title only, max 6 words. Reply with just the title, no "Title:" prefix. Conversation:\n${messages.slice(0, 4).map((m) => `${m.role}: ${m.content.slice(0, 200)}`).join("\n")}`;
    try {
        const res = await fetch(OPENAI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 24,
                temperature: 0.3,
            }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        let title = (data.choices?.[0]?.message?.content?.trim?.() || "").replace(/^Title:\s*/i, "").trim();
        return title.slice(0, 50);
    } catch (_e) {
        const first = messages.find((m) => m.role === "user");
        return first ? first.content.slice(0, 40) + (first.content.length > 40 ? "..." : "") : "New Chat";
    }
}
