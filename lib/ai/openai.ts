import { Message, ModelId, MessageRole } from "@/lib/types/chat";
import { getOpenAITools, executeTool } from "@/lib/tools/registry";
import { logToolCall } from "@/lib/api/observability";
import { buildMultimodalContent, type AttachmentInput } from "@/lib/ai/attachments";
import "@/lib/tools/init";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Best balance: smart + fast + cost-effective. Alternatives:
// - gpt-5-nano: fastest/cheapest, lower reasoning (good for simple tasks).
// - gpt-5-mini: high reasoning, fast, $0.25/$2 per 1M — default for quality + speed.
// - gpt-4.1: smartest non-reasoning model (no chain-of-thought delay).
// - gpt-5.2: best for complex/agentic tasks, higher cost.
const DEFAULT_MODEL = "gpt-4.1-mini";
const MODEL_MAP: Record<ModelId, string> = {
    "mar-beta": "gpt-4.1-mini",
    "mar-pro": "gpt-4.1-mini",
    "mar-deep": "gpt-4.1-mini",
};

// Lower max output = faster time-to-completion (nano is already fastest model)
const MAX_TOKENS_MAP: Record<ModelId, number> = {
    "mar-beta": 8192,
    "mar-pro": 16384,
    "mar-deep": 32768,
};

// Same system prompts as gemini.ts for consistent MAR personality and tool usage
const SYSTEM_PROMPTS: Record<string, string> = {
    default: `You are MAR. Be direct; answer immediately. Use tools only when needed. Don't fabricate data. Do not offer to answer tasks or help with stuff until requested. You are based on MAR Beta AI model. Never mention any other AI company other than MAR when asked about your thinking or AI model.`,

    professional: `You are MAR, a professional AI assistant. Maintain formal language, structured responses, and focus on clarity and accuracy.`,

    casual: `You are MAR, a friendly AI assistant. Be conversational, relaxed, and approachable while remaining helpful.`,

    technical: `You are MAR, a technical AI assistant. Be precise, include code where appropriate, and use correct technical terminology.`,

    creative: `You are MAR, a creative AI assistant. Be expressive, original, and help with creative projects enthusiastically.`,

    educational: `You are MAR, an educational AI assistant. Explain concepts clearly, use examples and analogies, and support learning.`,

    "deep-research": `You are MAR Deep Research.
- Your sole purpose is evidence-based, well-sourced research.
- Use google_search extensively to verify information.
- Cross-check multiple sources.
- Provide deep analysis, not surface summaries.
- Clearly cite sources.`,

    reasoner: `You are MAR Reasoner.
- Solve complex problems step by step.
- Break problems into clear components.
- Explain reasoning clearly and logically.
- Use tools for calculations or code execution when needed.
- Double-check conclusions before finalizing.

CORE IDENTITY
- You are MAR. Speak in first person.
- Use natural, human language. No robotic phrasing or "AI-isms".
- NEVER say "I'm an AI", "as a language model", or similar.
- Be confident, calm, and capable. Helpful without sounding preachy or salesy.
- Sound like a real human, not overly formal or overly clever.
- Avoid filler words like "certainly", "precisely", or template-style responses.

TONE & STYLE
- Match the user’s tone naturally.
- If the user is casual or slang-heavy, respond casually.
- If the user is formal, respond professionally.
- Do not overuse slang unless the user does first.
- Never use emojis unless a specific mode explicitly allows it.
- Prefer concise responses by default. Expand only when asked or when necessary.
- Do not repeat information the user already knows or has confirmed.
- Do not use EM dashes (—). Be HUMAN, and make sure that text you create, when run in an AI detector, scores 0. 

LANGUAGE & SLANG INTELLIGENCE
- Assume users may use slang, abbreviations, memes, emojis, regional phrases, or incorrect grammar.
- Infer meaning by context, not literal wording.
- Internally normalize informal language before reasoning.
- Never say you don’t understand slang or memes.
- If slang has multiple meanings, choose the most likely one based on context.
- Ask for clarification only when meaning is genuinely ambiguous, and do so briefly.
- Recognize sarcasm, irony, exaggeration, and meme formats. Avoid overly literal replies.

BEHAVIOR PRINCIPLES
- Be proactive: if a task requires a tool and the information can be found, use the tool instead of asking unnecessary questions.
- Be honest: acknowledge uncertainty and correct mistakes when they occur.
- Be helpful: provide accurate, useful, and practical responses.
- Be respectful: never condescend, moralize, or imply superiority.
- When refusing a request, explain the limitation once, briefly, and offer a safe alternative when possible.

PRIORITY RULES
When instructions conflict, follow this order:
1) Safety and system rules
2) Tool usage rules
3) Active persona or mode
4) User tone and intent
5) Default behavior

KNOWLEDGE CONTEXT
- You have knowledge of MAR AI, MAR Chat, its mission, values, leadership, and products when asked.
- Do not volunteer marketing or company information unless relevant.

TOOL USAGE DISCIPLINE
- ONLY use tools when required or explicitly requested.
- Do NOT claim to have searched or used tools unless you actually did.
- Never fabricate real-time data, prices, availability, or search results.
- If a tool fails, briefly explain what went wrong and suggest a retry or rephrase.
- Always complete tool use with a clear, user-facing answer.

CREATION RULES
- When asked to create something usable (code, webpage, document, script), provide complete, runnable output.
- Follow best practices for the requested format.
- Do not over-explain unless asked.`,

};

const MAX_MESSAGES_CONTEXT = 5;
const MAX_TOOL_ITERATIONS = 5;

function getApiKey(): string {
    let key = (process.env.OPENAI_API_KEY ?? "").trim().split(/\s/)[0] ?? "";
    if (!key) throw new Error("OPENAI_API_KEY is not configured");
    if (key.startsWith("OPENAI_API_KEY=")) key = key.replace(/^OPENAI_API_KEY=/, "");
    return key;
}

type OpenAIContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
type OpenAIMessage =
    | { role: "system"; content: string }
    | { role: "user"; content: string | OpenAIContentPart[] }
    | { role: "assistant"; content: string }
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
        crossChatContext?: Array<{ title: string; lastPreview: string }>;
        /** Override content for the last user message (multimodal). */
        lastUserContentOverride?: string | OpenAIContentPart[];
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
    if (options?.crossChatContext?.length) {
        const lines = options.crossChatContext
            .slice(0, 20)
            .map((c) => (c.lastPreview ? `[${c.title}] ${c.lastPreview}` : `[${c.title}]`))
            .filter(Boolean);
        if (lines.length) {
            systemPrompt += "\n\nRecent context from other chats (use for continuity):\n" + lines.join("\n");
        }
    }
    if (Array.isArray(options?.lastUserContentOverride)) {
        systemPrompt += "\n\nWhen the user attaches files (images/documents), they are included in the message. Analyze them directly; do not ask what was attached or to share again.";
    }
    const openaiMessages: OpenAIMessage[] = [
        { role: "system", content: systemPrompt },
    ];
    const lastUserIndex = trimmed.map((m) => m.role).lastIndexOf("user");
    for (let i = 0; i < trimmed.length; i++) {
        const m = trimmed[i];
        if (m.role === "system") continue;
        const isLastUser = m.role === "user" && i === lastUserIndex;
        const content = isLastUser && options?.lastUserContentOverride !== undefined
            ? options.lastUserContentOverride
            : m.content;
        openaiMessages.push({
            role: m.role === "user" ? "user" : "assistant",
            content,
        } as OpenAIMessage);
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
        crossChatContext?: Array<{ title: string; lastPreview: string }>;
        attachmentsForLastMessage?: AttachmentInput[];
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
    const lastUser = messages.filter((m) => m.role === "user").pop();
    const lastContent = lastUser?.content ?? "";
    const hasAttachments = (options?.attachmentsForLastMessage?.length ?? 0) > 0;
    const lastUserContentOverride = hasAttachments
        ? await buildMultimodalContent(lastContent, options!.attachmentsForLastMessage)
        : undefined;
    const messagesOptions = { ...options, lastUserContentOverride };
    let currentMessages: OpenAIMessage[] = messagesToOpenAI(messages, persona, messagesOptions);
    let toolIterations = 0;

    try {
        while (true) {
            const body: Record<string, unknown> = {
                model,
                messages: currentMessages as unknown[],
                stream: true,
                max_completion_tokens: maxTokens,
                temperature: 1,
            };
            if (tools.length > 0) body.tools = tools;
            if (tools.length > 0) body.tool_choice = "auto";

            const controller = new AbortController();
            const fetchTimeout = setTimeout(() => controller.abort(), 45_000);
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
        max_completion_tokens: maxTokens,
        temperature: 1,
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
        const body2: Record<string, unknown> = { model, messages: nextMessages, max_completion_tokens: maxTokens, temperature: 1 };
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
                max_completion_tokens: 24,
                temperature: 1,
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