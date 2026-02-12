import { NextRequest, NextResponse } from "next/server";
import { streamChatCompletion, generateTitle } from "@/lib/ai/openai";
import type { ModelId, MessageRole } from "@/lib/types/chat";
import { checkRateLimit, getClientIdentifier } from "@/lib/api/rate-limit";
import { logChatRequest, logChatError } from "@/lib/api/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
    messages: Array<{
        role: MessageRole;
        content: string;
    }>;
    model: ModelId;
    conversationId?: string;
    stream?: boolean;
    persona?: string;
    mode?: string;
    webSearchEnabled?: boolean;
    responseStyle?: string;
    skills?: string[];
    profileName?: string;
    whatShouldCallYou?: string;
    workFunction?: string;
    personalPreferences?: string;
    memoryFacts?: string[];
    /** Cross-chat context: recent conversation titles + last message previews for better memory. */
    crossChatContext?: Array<{ title: string; lastPreview: string }>;
}

export async function POST(request: NextRequest) {
    const clientId = getClientIdentifier(request);
    const rate = checkRateLimit(clientId);
    if (!rate.allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429, headers: { "Retry-After": "60" } }
        );
    }

    try {
        const body: ChatRequestBody = await request.json();
        const {
            messages,
            model = "mar-beta",
            conversationId,
            stream = true,
            persona = "default",
            mode,
            webSearchEnabled = false,
            responseStyle = "normal",
            skills = [],
            profileName,
            whatShouldCallYou,
            workFunction,
            personalPreferences,
            memoryFacts,
            crossChatContext,
        } = body;

        // Use mode as persona if provided, otherwise default persona
        const effectivePersona = mode || persona || "default";
        const options = {
            webSearchEnabled,
            responseStyle,
            skills,
            profileName,
            whatShouldCallYou,
            workFunction,
            personalPreferences,
            memoryFacts,
            crossChatContext,
        };

        logChatRequest({ model, messageCount: messages.length, stream: stream ?? true });

        // Validate request
        if (!messages || messages.length === 0) {
            return NextResponse.json(
                { error: "Messages are required" },
                { status: 400 }
            );
        }

        // Check if OpenAI API key is configured (used for MAR backend)
        if (!process.env.OPENAI_API_KEY) {
            logChatError("Missing OPENAI_API_KEY");
            return NextResponse.json(
                { error: "MAR API key not configured" },
                { status: 500 }
            );
        }

        // For streaming responses
        if (stream) {
            const encoder = new TextEncoder();

            const streamResponse = new ReadableStream({
                async start(controller) {
                    try {
                        const generator = streamChatCompletion(messages, model, effectivePersona, options);

                        for await (const chunk of generator) {
                            const data = JSON.stringify(chunk);
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

                            if (chunk.done) {
                                console.log("[Chat API] Chunk done received");
                                break;
                            }
                        }

                        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                        controller.close();
                    } catch (error) {
                        logChatError(error instanceof Error ? error.message : "Streaming failed");
                        const errorData = JSON.stringify({
                            error: error instanceof Error ? error.message : "Streaming failed"
                        });
                        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                        controller.close();
                    }
                },
            });

            return new Response(streamResponse, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache, no-transform",
                    "Connection": "keep-alive",
                },
            });
        }

        // For non-streaming responses (not commonly used but supported)
        const { text, usage } = await (await import("@/lib/ai/openai")).generateChatCompletion(
            messages,
            model,
            effectivePersona,
            options
        );

        return NextResponse.json({
            message: {
                role: "assistant",
                content: text,
            },
            usage,
            conversationId,
        });
    } catch (error) {
        logChatError(error instanceof Error ? error.message : "Chat request failed");
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Chat request failed" },
            { status: 500 }
        );
    }
}

// Generate title for conversation
export async function PUT(request: NextRequest) {
    try {
        const { messages } = await request.json();

        if (!messages || messages.length === 0) {
            return NextResponse.json(
                { error: "Messages are required" },
                { status: 400 }
            );
        }

        const title = await generateTitle(messages);

        return NextResponse.json({ title });
    } catch (error) {
        console.error("[Chat API] Title generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate title" },
            { status: 500 }
        );
    }
}
