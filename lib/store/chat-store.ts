import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    Message,
    Conversation,
    ModelId,
    UserPreferences,
    DEFAULT_PREFERENCES,
    Artifact,
    Project,
    FlightResultsData,
    HotelResultsData,
    WeatherResultsData,
} from "@/lib/types/chat";
import { generateId } from "@/lib/utils";
import {
    syncConversationToSupabase,
    deleteConversationFromSupabase,
    syncMessageToSupabase,
} from "@/lib/supabase/sync";
import { useAuthStore } from "@/lib/store/auth-store";

/** Helper: returns the current Supabase user ID, or null if not logged in */
function getCurrentUserId(): string | null {
    try {
        return useAuthStore.getState().user?.id ?? null;
    } catch {
        return null;
    }
}

interface ChatState {
    // Conversations
    conversations: Conversation[];
    activeConversationId: string | null;

    // Messages
    messages: Record<string, Message[]>; // conversationId -> messages

    // Artifacts
    artifacts: Artifact[];
    activeArtifactId: string | null;

    // Projects
    projects: Project[];
    activeProjectId: string | null;

    // UI State
    isLoading: boolean;
    isStreaming: boolean;
    streamingMessage: string;
    streamingReasoning: string;
    streamingFlightResults: FlightResultsData | null;
    streamingHotelResults: HotelResultsData | null;
    streamingWeatherResults: WeatherResultsData | null;
    error: string | null;
    incognitoMode: boolean;

    // Settings
    selectedModel: ModelId;
    preferences: UserPreferences;
    sidebarOpen: boolean;
    artifactPanelOpen: boolean;

    // Actions
    setActiveConversation: (id: string | null) => void;
    createConversation: (model?: ModelId, options?: { isIncognito?: boolean }) => string;
    updateConversation: (id: string, updates: Partial<Conversation>) => void;
    deleteConversation: (id: string) => void;

    addMessage: (conversationId: string, message: Message) => void;
    updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
    removeMessage: (conversationId: string, messageId: string) => void;
    clearMessages: (conversationId: string) => void;
    branchConversation: (conversationId: string, upToMessageId: string) => string;

    addArtifact: (artifact: Artifact) => void;
    updateArtifact: (id: string, updates: Partial<Artifact>) => void;
    deleteArtifact: (id: string) => void;
    setActiveArtifact: (id: string | null) => void;

    createProject: (name: string) => string;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    setActiveProject: (id: string | null) => void;
    addConversationToProject: (projectId: string, conversationId: string) => void;
    removeConversationFromProject: (projectId: string, conversationId: string) => void;

    setIsLoading: (loading: boolean) => void;
    setIsStreaming: (streaming: boolean) => void;
    setStreamingMessage: (message: string) => void;
    appendStreamingMessage: (chunk: string) => void;
    setStreamingReasoning: (reasoning: string) => void;
    appendStreamingReasoning: (chunk: string) => void;
    setStreamingFlightResults: (data: FlightResultsData | null) => void;
    setStreamingHotelResults: (data: HotelResultsData | null) => void;
    setStreamingWeatherResults: (data: WeatherResultsData | null) => void;
    setError: (error: string | null) => void;

    setSelectedModel: (model: ModelId) => void;
    setPreferences: (preferences: Partial<UserPreferences>) => void;
    setSidebarOpen: (open: boolean) => void;
    setArtifactPanelOpen: (open: boolean) => void;
    setIncognitoMode: (on: boolean) => void;

    getActiveConversation: () => Conversation | undefined;
    getActiveMessages: () => Message[];

    reset: () => void;
}

const initialState = {
    conversations: [],
    activeConversationId: null,
    messages: {},
    artifacts: [],
    activeArtifactId: null,
    projects: [],
    activeProjectId: null,
    isLoading: false,
    isStreaming: false,
    streamingMessage: "",
    streamingReasoning: "",
    streamingFlightResults: null,
    streamingHotelResults: null,
    streamingWeatherResults: null,
    error: null,
    selectedModel: "mar-beta" as ModelId,
    preferences: DEFAULT_PREFERENCES,
    sidebarOpen: false,
    artifactPanelOpen: false,
    incognitoMode: false,
};

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Conversation actions
            setActiveConversation: (id) => set({ activeConversationId: id }),

            createConversation: (model, options) => {
                const current = get();
                const isIncognito = options?.isIncognito !== undefined ? options.isIncognito : current.incognitoMode;
                const messageCount = (id: string) => (current.messages[id] || []).length;
                const emptyChat = current.conversations.find(
                    (c) =>
                        !c.isArchived &&
                        c.isIncognito === isIncognito &&
                        messageCount(c.id) === 0
                );
                if (emptyChat && messageCount(emptyChat.id) === 0) {
                    set({ activeConversationId: emptyChat.id });
                    return emptyChat.id;
                }
                const id = generateId();
                const conversation: Conversation = {
                    id,
                    userId: "local",
                    title: "New Chat",
                    model: model || current.selectedModel,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isArchived: false,
                    isIncognito,
                };

                set((state) => ({
                    conversations: [conversation, ...state.conversations],
                    activeConversationId: id,
                    messages: { ...state.messages, [id]: [] },
                }));

                // Fire-and-forget sync
                const uid = getCurrentUserId();
                if (uid) syncConversationToSupabase(conversation, uid);

                return id;
            },

            updateConversation: (id, updates) => {
                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c.id === id
                            ? { ...c, ...updates, updatedAt: new Date() }
                            : c
                    ),
                }));
                // Fire-and-forget sync
                const uid = getCurrentUserId();
                if (uid) {
                    const conv = get().conversations.find((c) => c.id === id);
                    if (conv) syncConversationToSupabase(conv, uid);
                }
            },

            deleteConversation: (id) => {
                set((state) => {
                    const { [id]: _, ...remainingMessages } = state.messages;
                    return {
                        conversations: state.conversations.filter((c) => c.id !== id),
                        messages: remainingMessages,
                        activeConversationId:
                            state.activeConversationId === id
                                ? state.conversations.length > 1
                                    ? state.conversations.find((c) => c.id !== id)?.id || null
                                    : null
                                : state.activeConversationId,
                    };
                });
                // Fire-and-forget sync
                const uid = getCurrentUserId();
                if (uid) deleteConversationFromSupabase(id);
            },

            // Message actions
            addMessage: (conversationId, message) => {
                set((state) => ({
                    messages: {
                        ...state.messages,
                        [conversationId]: [...(state.messages[conversationId] || []), message],
                    },
                }));
                // Fire-and-forget sync
                const uid = getCurrentUserId();
                if (uid) syncMessageToSupabase(message);
            },

            updateMessage: (conversationId, messageId, updates) => {
                set((state) => ({
                    messages: {
                        ...state.messages,
                        [conversationId]: (state.messages[conversationId] || []).map((m) =>
                            m.id === messageId ? { ...m, ...updates } : m
                        ),
                    },
                }));
            },

            removeMessage: (conversationId, messageId) => {
                set((state) => ({
                    messages: {
                        ...state.messages,
                        [conversationId]: (state.messages[conversationId] || []).filter((m) => m.id !== messageId),
                    },
                }));
            },

            clearMessages: (conversationId) => {
                set((state) => ({
                    messages: { ...state.messages, [conversationId]: [] },
                }));
            },

            branchConversation: (conversationId, upToMessageId) => {
                const current = get();
                const msgs = current.messages[conversationId] || [];
                const idx = msgs.findIndex((m) => m.id === upToMessageId);
                if (idx < 0) return conversationId;
                const branchMsgs = msgs.slice(0, idx + 1);
                const conv = current.conversations.find((c) => c.id === conversationId);
                const newId = generateId();
                const conversation: Conversation = {
                    id: newId,
                    userId: "local",
                    title: "Branch",
                    model: conv?.model || current.selectedModel,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isArchived: false,
                    isIncognito: conv?.isIncognito ?? false,
                };
                set((state) => ({
                    conversations: [conversation, ...state.conversations],
                    activeConversationId: newId,
                    messages: { ...state.messages, [newId]: [...branchMsgs] },
                }));
                const uid = getCurrentUserId();
                if (uid) syncConversationToSupabase(conversation, uid);
                return newId;
            },

            // Artifact actions
            addArtifact: (artifact) => {
                set((state) => ({
                    artifacts: [artifact, ...state.artifacts],
                    activeArtifactId: artifact.id,
                    artifactPanelOpen: true,
                }));
            },

            updateArtifact: (id, updates) => {
                set((state) => ({
                    artifacts: state.artifacts.map((a) =>
                        a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
                    ),
                }));
            },

            deleteArtifact: (id) => {
                set((state) => ({
                    artifacts: state.artifacts.filter((a) => a.id !== id),
                    activeArtifactId:
                        state.activeArtifactId === id ? null : state.activeArtifactId,
                }));
            },

            setActiveArtifact: (id) => set({ activeArtifactId: id }),

            createProject: (name) => {
                const id = generateId();
                const project: Project = {
                    id,
                    userId: "local",
                    name,
                    conversationIds: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                set((s) => ({ projects: [project, ...s.projects], activeProjectId: id }));
                return id;
            },
            updateProject: (id, updates) => {
                set((s) => ({
                    projects: s.projects.map((p) =>
                        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
                    ),
                }));
            },
            deleteProject: (id) => {
                set((s) => ({
                    projects: s.projects.filter((p) => p.id !== id),
                    activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
                }));
            },
            setActiveProject: (id) => set({ activeProjectId: id }),
            addConversationToProject: (projectId, conversationId) => {
                set((s) => ({
                    projects: s.projects.map((p) =>
                        p.id === projectId && !p.conversationIds.includes(conversationId)
                            ? {
                                  ...p,
                                  conversationIds: [...p.conversationIds, conversationId],
                                  updatedAt: new Date(),
                              }
                            : p
                    ),
                }));
            },
            removeConversationFromProject: (projectId, conversationId) => {
                set((s) => ({
                    projects: s.projects.map((p) =>
                        p.id === projectId
                            ? {
                                  ...p,
                                  conversationIds: p.conversationIds.filter((c) => c !== conversationId),
                                  updatedAt: new Date(),
                              }
                            : p
                    ),
                }));
            },

            // UI state actions
            setIsLoading: (loading) => set({ isLoading: loading }),
            setIsStreaming: (streaming) => set({ isStreaming: streaming }),
            setStreamingMessage: (message) => set({ streamingMessage: message }),
            appendStreamingMessage: (chunk) =>
                set((state) => ({ streamingMessage: state.streamingMessage + chunk })),
            setStreamingReasoning: (reasoning) => set({ streamingReasoning: reasoning }),
            appendStreamingReasoning: (chunk) =>
                set((state) => ({ streamingReasoning: state.streamingReasoning + chunk })),
            setStreamingFlightResults: (data) => set({ streamingFlightResults: data }),
            setStreamingHotelResults: (data) => set({ streamingHotelResults: data }),
            setStreamingWeatherResults: (data) => set({ streamingWeatherResults: data }),
            setError: (error) => set({ error }),

            // Settings actions
            setSelectedModel: (model) => set({ selectedModel: model }),
            setPreferences: (preferences) =>
                set((state) => ({
                    preferences: { ...state.preferences, ...preferences },
                })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            setArtifactPanelOpen: (open) => set({ artifactPanelOpen: open }),
            setIncognitoMode: (on) => set({ incognitoMode: on }),

            // Getters
            getActiveConversation: () => {
                const state = get();
                return state.conversations.find((c) => c.id === state.activeConversationId);
            },

            getActiveMessages: () => {
                const state = get();
                if (!state.activeConversationId) return [];
                return state.messages[state.activeConversationId] || [];
            },

            reset: () => set(initialState),
        }),
        {
            name: "mar-chat-storage",
            partialize: (state) => ({
                conversations: state.conversations.filter((c) => !c.isIncognito),
                messages: Object.fromEntries(
                    Object.entries(state.messages).filter(
                        ([id]) => !state.conversations.find((c) => c.id === id && c.isIncognito)
                    )
                ),
                artifacts: state.artifacts,
                projects: state.projects,
                selectedModel: state.selectedModel,
                preferences: state.preferences,
            }),
        }
    )
);
