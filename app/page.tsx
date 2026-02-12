"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog";
import { useAuthStore } from "@/lib/store/auth-store";
import { fetchRecentConversationSummaries } from "@/lib/supabase/sync";
import { Header } from "@/components/layout/header";
import { DotShaderBackground } from "@/components/ui/dot-shader-background";
import { ArtifactPanel } from "@/components/artifacts/artifact-panel";
import { ChatInput, type ChatInputRef } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { WelcomeScreen } from "@/components/chat/welcome-screen";
import { CommandPalette, useGlobalShortcuts } from "@/components/command-palette";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { generateId } from "@/lib/utils";
import { fetchWithRetry } from "@/lib/utils/retry";
import type { Message, FlightResultsData, HotelResultsData, WeatherResultsData, ArtifactReference } from "@/lib/types/chat";

export default function ChatPage() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollAnchorRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastScrollTime = useRef(0);
    const [mounted, setMounted] = useState(false);
    const [wasTruncated, setWasTruncated] = useState(false);
    const [wasStopped, setWasStopped] = useState(false);
    const { modelMode, extendedThinking, setExtendedThinking, skills, memoryFacts, hasCompletedOnboarding, setHasCompletedOnboarding, profileName, whatShouldCallYou, workFunction, personalPreferences } = useSettingsStore();

    const chatInputRef = useRef<ChatInputRef>(null);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const { isAuthenticated, user, authDialogOpen, setAuthDialogOpen } = useAuthStore();

    const {
        sidebarOpen,
        setSidebarOpen,
        activeConversationId,
        selectedModel,
        setSelectedModel,
        isLoading,
        isStreaming,
        streamingMessage,
        streamingReasoning,
        streamingFlightResults,
        streamingHotelResults,
        streamingWeatherResults,
        incognitoMode,
        setIsLoading,
        setIsStreaming,
        setStreamingMessage,
        appendStreamingMessage,
        setStreamingReasoning,
        appendStreamingReasoning,
        setStreamingFlightResults,
        setStreamingHotelResults,
        setStreamingWeatherResults,
        setActiveConversation,
        addMessage,
        updateMessage,
        removeMessage,
        updateConversation,
        createConversation,
        getActiveMessages,
        addArtifact,
        branchConversation,
        artifactPanelOpen,
        preferences,
    } = useChatStore();

    const messages = getActiveMessages();

    // Hydration fix
    useEffect(() => {
        setMounted(true);
    }, []);

    // Close auth dialog when user becomes authenticated (e.g. after Try Again from error page)
    useEffect(() => {
        if (isAuthenticated && authDialogOpen) {
            setAuthDialogOpen(false);
        }
    }, [isAuthenticated, authDialogOpen, setAuthDialogOpen]);

    // Auto-scroll to bottom: smooth, reliable; throttle during stream to avoid jank
    const MIN_SCROLL_INTERVAL_MS = 150;
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const scrollToEnd = () => {
            const now = Date.now();
            if (isStreaming && now - lastScrollTime.current < MIN_SCROLL_INTERVAL_MS) return;
            lastScrollTime.current = now;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const target = container.scrollHeight - container.clientHeight;
                    container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
                });
            });
        };

        scrollToEnd();
    }, [messages.length, streamingMessage, isStreaming]);

    const handleSendMessage = useCallback(
        async (content: string) => {
            if (!content.trim()) return;

            if (!isAuthenticated) {
                setAuthDialogOpen(true);
                return;
            }

            // Create conversation if none exists
            let conversationId = activeConversationId;
            if (!conversationId) {
                conversationId = createConversation(selectedModel);
            }

            // Add user message
            const userMessage: Message = {
                id: generateId(),
                conversationId,
                role: "user",
                content: content.trim(),
                createdAt: new Date(),
            };
            addMessage(conversationId, userMessage);

            // Build messages array for API
            const allMessages = [...messages, userMessage].map((m) => ({
                role: m.role,
                content: m.content,
            }));

            // Start loading
            setIsLoading(true);
            setIsStreaming(true);
            setStreamingMessage("");
            setStreamingReasoning("");
            setStreamingFlightResults(null);
            setStreamingHotelResults(null);
            setStreamingWeatherResults(null);
            setWasTruncated(false);
            setWasStopped(false);

            // Create abort controller
            abortControllerRef.current = new AbortController();

                let pendingAssistant: {
                content: string;
                reasoning: string;
                flightResults?: FlightResultsData;
                hotelResults?: HotelResultsData;
                weatherResults?: WeatherResultsData;
                artifactRefs?: { id: string; type: string; title: string }[];
            } | null = null;
                const artifactRefs: { id: string; type: string; title: string }[] = [];

            try {
                const crossChatContext =
                    isAuthenticated && user?.id
                        ? await fetchRecentConversationSummaries(user.id, conversationId || null, 15)
                        : undefined;

                const response = await fetchWithRetry("/api/chat", {
                    retries: 2,
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: allMessages,
                        model: selectedModel,
                        conversationId,
                        stream: true,
                        persona: preferences.persona,
                        mode: extendedThinking ? "reasoner" : modelMode,
                        webSearchEnabled: preferences.webSearchEnabled ?? false,
                        responseStyle: preferences.responseStyle ?? "normal",
                        skills: skills?.length ? skills : undefined,
                        profileName: profileName?.trim() || undefined,
                        whatShouldCallYou: whatShouldCallYou?.trim() || undefined,
                        workFunction: workFunction?.trim() || undefined,
                        personalPreferences: personalPreferences?.trim() || undefined,
                        memoryFacts: memoryFacts?.length ? memoryFacts : undefined,
                        crossChatContext: crossChatContext?.length ? crossChatContext : undefined,
                    }),
                    signal: abortControllerRef.current.signal,
                }, (attempt) => {
                    if (attempt === 1) toast.info("Retrying…");
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || "Chat request failed");
                }

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) {
                    throw new Error("No response body");
                }

                let fullContent = "";
                let fullReasoning = "";
                let fullFlightResults: FlightResultsData | null = null;
                let fullHotelResults: HotelResultsData | null = null;
                let fullWeatherResults: WeatherResultsData | null = null;
                let buffer = "";
                let streamDone = false;

                // Safety timeout: if streaming takes over 90s, force-close
                const STREAM_TIMEOUT_MS = 90_000;
                const streamTimeout = setTimeout(() => {
                    try { reader.cancel(); } catch (_) {}
                }, STREAM_TIMEOUT_MS);

                try {
                while (!streamDone) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    const lines = buffer.split("\n");
                    buffer = lines.pop() || ""; // Save incomplete line for next iteration

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

                        const data = trimmedLine.substring(5).trim();
                        if (data === "[DONE]") { streamDone = true; break; }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.error) throw new Error(parsed.error);

                            if (parsed.text) {
                                fullContent += parsed.text;
                                appendStreamingMessage(parsed.text);
                            }
                            if (parsed.reasoning) {
                                fullReasoning += parsed.reasoning;
                                appendStreamingReasoning(parsed.reasoning);
                            }
                            if (parsed.artifact && typeof parsed.artifact === "object") {
                                const a = parsed.artifact as { title?: string; type?: string; content?: string };
                                const artifactId = generateId();
                                const artifactType = (a.type as string) || "document";
                                artifactRefs.push({ id: artifactId, type: artifactType, title: a.title || "Untitled" });
                                addArtifact({
                                    id: artifactId,
                                    userId: "local",
                                    conversationId: conversationId || undefined,
                                    type: artifactType as any,
                                    title: a.title || "Untitled",
                                    content: a.content || "",
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                });
                            }
                            if (parsed.flightResults && typeof parsed.flightResults === "object") {
                                const fr = parsed.flightResults as FlightResultsData;
                                fullFlightResults = fr;
                                setStreamingFlightResults(fr);
                            }
                            if (parsed.hotelResults && typeof parsed.hotelResults === "object") {
                                const hr = parsed.hotelResults as HotelResultsData;
                                fullHotelResults = hr;
                                setStreamingHotelResults(hr);
                            }
                            if (parsed.weatherResults && typeof parsed.weatherResults === "object") {
                                const wr = parsed.weatherResults as WeatherResultsData;
                                fullWeatherResults = wr;
                                setStreamingWeatherResults(wr);
                            }
                            if (parsed.truncated) { setWasTruncated(true); }
                            if (parsed.done) { streamDone = true; break; }
                        } catch (e) {
                            if (e instanceof Error && e.message && !e.message.includes("JSON")) throw e;
                            console.warn("SSE parse skip:", data?.slice(0, 80));
                        }
                    }
                }
                } finally {
                    clearTimeout(streamTimeout);
                }

                // Process remaining buffer if it contains data
                if (!streamDone && buffer.trim().startsWith("data: ")) {
                    const data = buffer.trim().substring(5).trim();
                    if (data !== "[DONE]") {
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.text) {
                                fullContent += parsed.text;
                                appendStreamingMessage(parsed.text);
                            }
                            if (parsed.reasoning) {
                                fullReasoning += parsed.reasoning;
                                appendStreamingReasoning(parsed.reasoning);
                            }
                        } catch (e) {
                            // Ignore error for partial final chunk
                        }
                    }
                }

                // Capture for adding in finally (avoids duplicate: streaming + persisted message)
                if (fullContent.trim() || fullReasoning.trim() || fullFlightResults || fullHotelResults || fullWeatherResults || artifactRefs.length > 0) {
                    pendingAssistant = {
                        content: fullContent.trim(),
                        reasoning: fullReasoning.trim(),
                        flightResults: fullFlightResults ?? undefined,
                        hotelResults: fullHotelResults ?? undefined,
                        weatherResults: fullWeatherResults ?? undefined,
                        artifactRefs: artifactRefs.length > 0 ? [...artifactRefs] : undefined,
                    };
                }

                if (messages.length === 0 && pendingAssistant && (pendingAssistant.content || pendingAssistant.flightResults || pendingAssistant.hotelResults || pendingAssistant.weatherResults)) {
                    try {
                        const assistantForTitle: Message = {
                            id: generateId(),
                            conversationId,
                            role: "assistant",
                            content: pendingAssistant.content || "\u200b",
                            createdAt: new Date(),
                            model: selectedModel,
                            metadata: { reasoning: pendingAssistant.reasoning || undefined },
                        };
                        const titleResponse = await fetch("/api/chat", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ messages: [userMessage, assistantForTitle] }),
                        });

                        if (titleResponse.ok) {
                            const { title } = await titleResponse.json();
                            updateConversation(conversationId, { title });
                        }
                    } catch (e) {
                        // Title generation failed, keep default
                    }
                }
            } catch (error) {
                if (error instanceof Error && error.name === "AbortError") {
                    // User cancelled - keep the partial content so user can continue
                    setWasStopped(true);
                    toast.info("Response generation stopped");
                } else {
                    console.error("Chat error:", error);
                    toast.error(error instanceof Error ? error.message : "Failed to send message");
                }
            } finally {
                // Add assistant message AFTER streaming ends to prevent duplicate flash
                if (pendingAssistant && conversationId) {
                    const completedStatuses: string[] = [];
                    if (pendingAssistant.reasoning?.trim()) completedStatuses.push("Analyzed");
                    if (pendingAssistant.flightResults?.flights?.length) completedStatuses.push("Searched flights");
                    if (pendingAssistant.hotelResults?.hotels?.length) completedStatuses.push("Searched hotels");
                    if (pendingAssistant.weatherResults) completedStatuses.push("Fetched weather");
                    const hasContent = !!(pendingAssistant.content?.trim() && pendingAssistant.content !== "\u200b");
                    if (hasContent) completedStatuses.push("Written");
                    if (pendingAssistant.artifactRefs?.length) completedStatuses.push("Created artifact");
                    const assistantMessage: Message = {
                        id: generateId(),
                        conversationId,
                        role: "assistant",
                        content: pendingAssistant.content || "\u200b",
                        createdAt: new Date(),
                        model: selectedModel,
                        metadata: {
                            reasoning: pendingAssistant.reasoning || undefined,
                            flightResults: pendingAssistant.flightResults || undefined,
                            hotelResults: pendingAssistant.hotelResults || undefined,
                            weatherResults: pendingAssistant.weatherResults || undefined,
                            completedStatuses: completedStatuses.length ? completedStatuses : undefined,
                            artifacts: pendingAssistant.artifactRefs as ArtifactReference[] | undefined,
                        },
                    };
                    addMessage(conversationId, assistantMessage);
                }
                setIsStreaming(false);
                setStreamingMessage("");
                setStreamingReasoning("");
                setStreamingFlightResults(null);
                setStreamingHotelResults(null);
                setStreamingWeatherResults(null);
                setIsLoading(false);
                abortControllerRef.current = null;
                // Response completion notifications disabled
            }
        },
        [
            activeConversationId,
            selectedModel,
            messages,
            preferences.persona,
            modelMode,
            extendedThinking,
            skills,
            memoryFacts,
            profileName,
            whatShouldCallYou,
            workFunction,
            personalPreferences,
            createConversation,
            addMessage,
            updateConversation,
            addArtifact,
            setIsLoading,
            setIsStreaming,
            setStreamingMessage,
            appendStreamingMessage,
            setStreamingReasoning,
            appendStreamingReasoning,
            setStreamingFlightResults,
            setStreamingHotelResults,
            setStreamingWeatherResults,
            isAuthenticated,
            setAuthDialogOpen,
            user?.id,
            preferences.responseStyle,
            preferences.webSearchEnabled,
        ]
    );

    const handleStopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    const handleContinueGenerating = useCallback(() => {
        if (!activeConversationId || isStreaming) return;
        handleSendMessage("Please continue from where you left off.");
    }, [activeConversationId, isStreaming, handleSendMessage]);

    const handleEditMessage = useCallback((messageId: string, newContent: string) => {
        if (!activeConversationId) return;
        const allMsgs = getActiveMessages();
        const idx = allMsgs.findIndex((m) => m.id === messageId);
        if (idx === -1) return;
        // Remove all messages after this one, update the edited message, then re-send
        const msgsToKeep = allMsgs.slice(0, idx);
        const { clearMessages, addMessage: addMsg } = useChatStore.getState();
        clearMessages(activeConversationId);
        for (const m of msgsToKeep) {
            addMsg(activeConversationId, m);
        }
        handleSendMessage(newContent);
    }, [activeConversationId, getActiveMessages, handleSendMessage]);

    const handleRegenerate = useCallback(() => {
        if (!activeConversationId || isStreaming) return;
        const allMsgs = getActiveMessages();
        const lastAssistantIdx = allMsgs.map((m) => m.role).lastIndexOf("assistant");
        const lastUserIdx = allMsgs.map((m) => m.role).lastIndexOf("user");
        if (lastAssistantIdx < 0 || lastUserIdx < 0 || lastAssistantIdx <= lastUserIdx) return;
        const lastUser = allMsgs[lastUserIdx];
        removeMessage(activeConversationId, allMsgs[lastAssistantIdx].id);
        removeMessage(activeConversationId, lastUser.id);
        handleSendMessage(lastUser.content);
    }, [activeConversationId, isStreaming, getActiveMessages, removeMessage, handleSendMessage]);

    const handleBranchFromMessage = useCallback((messageId: string) => {
        if (!activeConversationId) return;
        const newId = branchConversation(activeConversationId, messageId);
        setActiveConversation(newId);
        chatInputRef.current?.focus();
    }, [activeConversationId, branchConversation, setActiveConversation]);

    const handleRefineAction = useCallback((prompt: string) => {
        chatInputRef.current?.setMessage(prompt);
        chatInputRef.current?.focus();
    }, []);

    const handleInsertPrompt = useCallback((prompt: string) => {
        chatInputRef.current?.setMessage(prompt);
    }, []);

    const handleNewChat = useCallback(() => {
        const id = createConversation(selectedModel);
        setActiveConversation(id);
    }, [createConversation, selectedModel, setActiveConversation]);

    const handleFocusInput = useCallback(() => {
        chatInputRef.current?.focus();
    }, []);

    useGlobalShortcuts({
        onOpenPalette: () => setCommandPaletteOpen(true),
        onNewChat: handleNewChat,
        onFocusInput: handleFocusInput,
        onStop: handleStopGeneration,
    });

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="flex h-screen bg-[var(--mar-bg-secondary)]">
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--mar-fg-muted)]/30 border-t-[var(--mar-fg)] animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex h-screen text-[var(--mar-fg)] overflow-hidden transition-colors ${
                incognitoMode ? "m-1 rounded-xl border-4 border-[var(--mar-fg-muted)] bg-[var(--mar-bg-secondary)]" : ""
            }`}
        >
            <CommandPalette
                open={commandPaletteOpen}
                onOpenChange={setCommandPaletteOpen}
                onFocusInput={handleFocusInput}
                onStop={handleStopGeneration}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
            <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
            <OnboardingDialog
                open={isAuthenticated && !hasCompletedOnboarding}
                onComplete={() => setHasCompletedOnboarding(true)}
            />
            <SettingsDialog />
            {artifactPanelOpen && <ArtifactPanel />}
            {/* Sidebar – hidden in incognito */}
            {!incognitoMode && (
                <>
                    <Sidebar
                        isOpen={sidebarOpen}
                        onToggle={() => setSidebarOpen(!sidebarOpen)}
                        onLoginClick={() => setAuthDialogOpen(true)}
                    />
                    {sidebarOpen && (
                        <button
                            type="button"
                            aria-label="Close sidebar"
                            className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                </>
            )}

            {/* Main Content – full width when incognito; dot shader is the background */}
            <main
                className={`relative flex-1 flex flex-col transition-all duration-300 overflow-hidden rounded-lg ${
                    incognitoMode ? "ml-0" : sidebarOpen ? "ml-0 md:ml-72" : "ml-14"
                }`}
            >
                <DotShaderBackground />
                <div className="relative z-10 flex flex-col flex-1 min-h-0 bg-transparent">
                <Header
                    onMenuClick={incognitoMode ? undefined : () => setSidebarOpen(!sidebarOpen)}
                    sidebarOpen={sidebarOpen}
                />

                {/* Chat Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {messages.length === 0 && !isStreaming ? (
                        <WelcomeScreen
                            onSelectPrompt={handleInsertPrompt}
                            incognitoMode={incognitoMode}
                        >
                            <ChatInput
                                ref={chatInputRef}
                                onSend={handleSendMessage}
                                onStop={handleStopGeneration}
                                isLoading={isLoading}
                                compact
                            />
                        </WelcomeScreen>
                    ) : (
                        <>
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto custom-scrollbar"
                            >
                                <div className="max-w-6xl mx-auto py-4">
                                    <AnimatePresence initial={false} mode="sync">
                                        {messages.map((message, index) => (
                                            <ChatMessage
                                                key={message.id}
                                                message={message}
                                                isLast={index === messages.length - 1}
                                                onEditMessage={message.role === "user" ? handleEditMessage : undefined}
                                                onRegenerate={
                                                    message.role === "assistant" && index === messages.length - 1
                                                        ? handleRegenerate
                                                        : undefined
                                                }
                                                onBranch={
                                                    message.role === "assistant"
                                                        ? () => handleBranchFromMessage(message.id)
                                                        : undefined
                                                }
                                                onRefine={(prompt) => handleRefineAction(prompt)}
                                            />
                                        ))}
                                    </AnimatePresence>

                                    {isStreaming && (
                                        <ChatMessage
                                            key="streaming"
                                            message={{
                                                id: "streaming",
                                                conversationId: activeConversationId || "",
                                                role: "assistant",
                                                content: streamingMessage,
                                                createdAt: new Date(),
                                                metadata: {
                                                    reasoning: streamingReasoning,
                                                    flightResults: streamingFlightResults || undefined,
                                                    hotelResults: streamingHotelResults || undefined,
                                                    weatherResults: streamingWeatherResults || undefined,
                                                },
                                            }}
                                            isStreaming
                                        />
                                    )}
                                    <div ref={scrollAnchorRef} aria-hidden="true" className="h-px w-full shrink-0" />
                                </div>
                            </div>

                            {/* Continue generating button */}
                            {!isStreaming && (wasTruncated || wasStopped) && messages.length > 0 && (
                                <div className="flex justify-center py-2 bg-transparent">
                                    <button
                                        type="button"
                                        onClick={handleContinueGenerating}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#333] bg-[#1e1e1c] hover:bg-[#262624] text-sm text-[#c1c0b5] transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Continue generating
                                    </button>
                                </div>
                            )}

                            <div className="relative shrink-0 py-4 px-3 sm:px-4 bg-[#262624] safe-area-bottom">
                                <ChatInput
                                    ref={chatInputRef}
                                    onSend={handleSendMessage}
                                    onStop={handleStopGeneration}
                                    isLoading={isLoading}
                                    lastUserMessage={
                                        messages
                                            .slice()
                                            .reverse()
                                            .find((m) => m.role === "user")?.content
                                    }
                                />
                            </div>
                        </>
                    )}
                </div>
                </div>
            </main>
        </div>
    );
}
