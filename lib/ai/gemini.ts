import { GoogleGenerativeAI, GenerativeModel, Content, Part, FunctionCall } from "@google/generative-ai";
import { Message, ModelId, MODELS, MessageRole } from "@/lib/types/chat";
import { getToolDeclarations, executeTool } from "@/lib/tools/registry";
import "@/lib/tools/init";

// System prompts for different personas
const SYSTEM_PROMPTS = {
    default: `You are MAR, a world-class AI assistant created by MAR AI (gomarai.com). 

Your core principles:
- Be proactive: If a user asks for something that requires a tool (like flights), and you need more info (like airport codes), use your search tool to find it first instead of asking the user.
- Be helpful: Provide accurate, useful, and comprehensive responses.
- Be honest: Be truthful, acknowledge uncertainty, and correct mistakes.
- Be human: Use natural, fluid language. Avoid "AI-isms" or overly formal/mechanical tone.
- Be stylish: Use standard Markdown formatting.

Key capabilities:
- MAR PRO: Ultra-fast reasoning and tool use.
- MAR BETA: Deep analysis and complex problem solving.
- MAR Deep Research: Specialized for evidence-based research.

Tool usage instructions:
- ONLY use tools when REQUIRED or explicitly asked. Do NOT call tools for general chat or when you can answer from knowledge. Saves tokens.
- Format flight results in a premium Markdown table.
- Always be proactive. Don't wait for the user if you can find the info yourself.
- When the user asks you to create, build, or write something they can use (a webpage, a script, a document, code they can run), use the create_artifact tool with a clear title, type (code, document, or html), and the full content. For web pages use type "html" and provide complete HTML. For scripts use type "code".`,

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
    - Double-check your logic before concluding.`,
};

// Initialize the client
function getGeminiClient() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }
    return new GoogleGenerativeAI(apiKey);
}

// Get the model based on model ID
function getModelConfig(modelId: ModelId): { model: GenerativeModel; config: typeof MODELS[0] } {
    const config = MODELS.find((m) => m.id === modelId) || MODELS[0];
    const client = getGeminiClient();

    const model = client.getGenerativeModel({
        model: config.geminiModel,
        generationConfig: {
            maxOutputTokens: config.maxOutputTokens,
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
        },
        tools: [
            {
                functionDeclarations: getToolDeclarations(),
            },
        ],
    });

    return { model, config };
}

// Convert messages to Gemini format
function messagesToContents(
    messages: Array<{ role: MessageRole; content: string }>,
    persona: string = "default"
): Content[] {
    const contents: Content[] = [];

    // Add persona-specific system context to the first user message
    const systemPrompt = SYSTEM_PROMPTS[persona as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.default;

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];

        // Gemini expects alternating user/model messages
        if (msg.role === "system") {
            continue; // Skip system messages, we handle them differently
        }

        const role = msg.role === "user" ? "user" : "model";
        let content = msg.content;

        // Prepend system prompt to first user message
        if (i === 0 && role === "user") {
            content = `[Context: ${systemPrompt}]\n\n${content}`;
        }

        contents.push({
            role,
            parts: [{ text: content }],
        });
    }

    return contents;
}

// Non-streaming chat completion
export async function generateChatCompletion(
    messages: Array<{ role: MessageRole; content: string }>,
    modelId: ModelId = "mar-beta",
    persona: string = "default"
): Promise<{ text: string; usage: { promptTokens: number; completionTokens: number } }> {
    const { model } = getModelConfig(modelId);
    const contents = messagesToContents(messages, persona);

    try {
        const chat = model.startChat({
            history: contents.slice(0, -1),
        });

        const lastMessage = contents[contents.length - 1];
        const result = await chat.sendMessage(lastMessage.parts);
        const response = result.response;

        // Handle function calls
        const functionCalls = response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            try {
                // Execute tool via registry
                const toolResult = await executeTool(call.name, call.args);

                // Send function response back to model
                const result2 = await chat.sendMessage([
                    {
                        functionResponse: {
                            name: call.name,
                            response: { name: call.name, content: toolResult }
                        }
                    }
                ]);

                const response2 = result2.response;
                return {
                    text: response2.text(),
                    usage: {
                        promptTokens: (response.usageMetadata?.promptTokenCount || 0) + (response2.usageMetadata?.promptTokenCount || 0),
                        completionTokens: (response.usageMetadata?.candidatesTokenCount || 0) + (response2.usageMetadata?.candidatesTokenCount || 0),
                    }
                };
            } catch (error) {
                console.error(`[Gemini] Error executing tool ${call.name}:`, error);

                // Return error to model so it can apologize
                const result2 = await chat.sendMessage([
                    {
                        functionResponse: {
                            name: call.name,
                            response: { name: call.name, content: { error: "Tool execution failed" } }
                        }
                    }
                ]);

                const response2 = result2.response;
                return {
                    text: response2.text(),
                    usage: {
                        promptTokens: (response.usageMetadata?.promptTokenCount || 0) + (response2.usageMetadata?.promptTokenCount || 0),
                        completionTokens: (response.usageMetadata?.candidatesTokenCount || 0) + (response2.usageMetadata?.candidatesTokenCount || 0),
                    }
                };
            }
        }

        const text = response.text();

        // Get token counts
        const promptTokens = response.usageMetadata?.promptTokenCount || 0;
        const completionTokens = response.usageMetadata?.candidatesTokenCount || 0;

        return {
            text,
            usage: {
                promptTokens,
                completionTokens,
            },
        };
    } catch (error) {
        console.error("[Gemini] Error generating completion:", error);
        throw error;
    }
}

// Streaming chat completion
export async function* streamChatCompletion(
    messages: Array<{ role: MessageRole; content: string }>,
    modelId: ModelId = "mar-beta",
    persona: string = "default"
): AsyncGenerator<{ text?: string; reasoning?: string; done: boolean; usage?: { promptTokens: number; completionTokens: number }; artifact?: { title: string; type?: string; content?: string } }> {
    const { model } = getModelConfig(modelId);
    const contents = messagesToContents(messages, persona);

    try {
        const chat = model.startChat({
            history: contents.slice(0, -1),
        });

        let currentParts = contents[contents.length - 1].parts;
        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;

        // Loop to support potential multi-step tool calls
        while (true) {
            const result = await chat.sendMessageStream(currentParts);
            let functionCallFound: FunctionCall | null = null;
            let yieldedAnyText = false;

            for await (const chunk of result.stream) {
                // 1. Handle Reasoning (Thought) parts for thinking models
                try {
                    const parts = chunk.candidates?.[0]?.content?.parts;
                    if (parts) {
                        for (const part of parts) {
                            if ((part as any).thought) {
                                yield {
                                    reasoning: (part as any).text || "",
                                    done: false,
                                };
                            }
                        }
                    }
                } catch (e) {
                    // Ignore parsing errors for thinking parts
                }

                // 2. Handle Text content safely
                let chunkText = "";
                try {
                    chunkText = chunk.text();
                } catch (e) {
                    // Chunks might not have text (e.g. only function calls)
                }

                if (chunkText) {
                    yieldedAnyText = true;
                    yield {
                        text: chunkText,
                        done: false,
                    };
                }

                // 3. Handle Function Calls
                try {
                    const calls = chunk.functionCalls();
                    if (calls && calls.length > 0) {
                        functionCallFound = calls[0];
                        break; // Stop streaming text to execute tool
                    }
                } catch (e) {
                    // Ignore function call parsing errors in text chunks
                }
            }

            // Sync usages after the turn is complete
            const response = await result.response;

            // Fallback: stream may not emit text chunks. Yield full response text if we didn't stream any.
            if (!functionCallFound && !yieldedAnyText) {
                try {
                    const fullText = response.text();
                    if (fullText && fullText.trim()) {
                        yield { text: fullText, done: false };
                    } else {
                        yield { text: "I'm having trouble with that right now. Please try again in a moment.", done: false };
                    }
                } catch (_e) {
                    yield { text: "Something went wrong on my side. Please try again.", done: false };
                }
            }
            totalPromptTokens += response.usageMetadata?.promptTokenCount || 0;
            totalCompletionTokens += response.usageMetadata?.candidatesTokenCount || 0;

            if (functionCallFound) {
                yield { reasoning: "Using tools…", done: false };

                const toolResult = await executeTool(functionCallFound.name, functionCallFound.args);

                if (functionCallFound.name === "create_artifact" && toolResult && typeof toolResult === "object" && toolResult.title) {
                    yield { artifact: toolResult, done: false };
                }

                yield { reasoning: "Finalizing answer…", done: false };

                // Prepare next turn with the function response
                currentParts = [
                    {
                        functionResponse: {
                            name: functionCallFound.name,
                            response: { name: functionCallFound.name, content: toolResult }
                        }
                    }
                ];
                continue; // Loop back for more streaming
            }

            // End of interaction (no more tools)
            yield {
                done: true,
                usage: {
                    promptTokens: totalPromptTokens,
                    completionTokens: totalCompletionTokens,
                },
            };
            break;
        }
    } catch (error) {
        console.error("[Gemini] Error in streaming completion:", error);
        yield {
            text: `\n\n**Error:** ${error instanceof Error ? error.message : "An unexpected error occurred."}`,
            done: true
        };
    }
}

// Generate title from conversation
export async function generateTitle(
    messages: Array<{ role: MessageRole; content: string }>
): Promise<string> {
    if (messages.length === 0) return "New Chat";

    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Based on this conversation, generate a short, descriptive title (max 6 words). Only output the title, nothing else.

Conversation:
${messages.slice(0, 4).map((m) => `${m.role}: ${m.content.slice(0, 200)}`).join("\n")}`;

    try {
        const result = await model.generateContent(prompt);
        const title = result.response.text().trim();
        return title.slice(0, 50); // Limit to 50 chars
    } catch (error) {
        console.error("[Gemini] Error generating title:", error);
        // Extract title from first user message
        const firstUserMessage = messages.find((m) => m.role === "user");
        if (firstUserMessage) {
            return firstUserMessage.content.slice(0, 40) + (firstUserMessage.content.length > 40 ? "..." : "");
        }
        return "New Chat";
    }
}

// Count tokens (approximation)
export async function countTokens(text: string, modelId: ModelId = "mar-beta"): Promise<number> {
    const { model } = getModelConfig(modelId);

    try {
        const result = await model.countTokens(text);
        return result.totalTokens;
    } catch (error) {
        console.error("[Gemini] Error counting tokens:", error);
        // Rough approximation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }
}

// Check if API is configured and working
export async function checkApiStatus(): Promise<{ configured: boolean; working: boolean; error?: string }> {
    try {
        if (!process.env.GOOGLE_GEMINI_API_KEY) {
            return { configured: false, working: false, error: "API key not configured" };
        }

        const client = getGeminiClient();
        const model = client.getGenerativeModel({ model: "gemini-3-pro-preview" });

        // Simple test
        const result = await model.generateContent("Say 'OK'");
        const response = result.response.text();

        return { configured: true, working: response.includes("OK") || response.length > 0 };
    } catch (error) {
        return {
            configured: true,
            working: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
