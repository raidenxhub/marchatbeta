import { NextRequest, NextResponse } from "next/server";
import { streamChatCompletion, generateTitle } from "@/lib/ai/openai";
import type { ModelId, MessageRole } from "@/lib/types/chat";
import { checkRateLimit, getClientIdentifier } from "@/lib/api/rate-limit";
import { logChatRequest, logChatError } from "@/lib/api/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Attachment for image/document analysis (dataUrl = base64 data URL). */
export interface ChatAttachment {
    type: "image" | "document";
    dataUrl: string;
    name: string;
    mimeType?: string;
}

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
    crossChatContext?: Array<{ title: string; lastPreview: string }>;
    /** Attachments for the current (last) user message: images + documents for analysis. */
    attachments?: ChatAttachment[];
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
            attachments,
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
            attachmentsForLastMessage: attachments?.length ? attachments : undefined,
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
                        // Send status immediately so client shows "Analyzing…" before first token (no buffering)
                        if (attachments?.length) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "analyzing" })}\n\n`));
                        }
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
                    "Cache-Control": "no-cache, no-store, no-transform",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
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
