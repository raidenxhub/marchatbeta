// Core chat types for MAR Chat

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
    id: string;
    conversationId: string;
    role: MessageRole;
    content: string;
    createdAt: Date;
    metadata?: MessageMetadata;
    tokensUsed?: number;
    model?: string;
}

export interface FlightResult {
    airline: string;
    airline_logo: string | null;
    departure: string | null;
    arrival: string | null;
    duration: string;
    price: string | number;
    link: string;
}

export interface FlightResultsData {
    flights: FlightResult[];
    search_url: string;
    route?: string;
}

export interface HotelResult {
    name: string;
    description?: string;
    image: string | null;
    rating: unknown;
    price: unknown;
    total_price: unknown;
    amenities: string | null;
    link: string | null;
}

export interface HotelResultsData {
    hotels: HotelResult[];
    search_url: string;
}

export interface WeatherResultsData {
    current: { temperature: string; condition: string; wind: string; isDay: string };
    forecast_summary?: { average_temp_next_24h?: string; max_precipitation_probability?: string };
    daily_forecast?: Array<{ date: string; max_temp: string; min_temp: string; condition: string }>;
}

export interface MessageMetadata {
    toolCalls?: ToolCall[];
    artifacts?: ArtifactReference[];
    citations?: Citation[];
    reasoning?: string;
    error?: string;
    flightResults?: FlightResultsData;
    hotelResults?: HotelResultsData;
    weatherResults?: WeatherResultsData;
    /** Past-tense status labels when done (e.g. "Analyzed", "Searched flights") */
    completedStatuses?: string[];
}

export interface ToolCall {
    id: string;
    name: string;
    input: Record<string, unknown>;
    output?: unknown;
    status: "pending" | "running" | "completed" | "error";
    error?: string;
    duration?: number;
}

export interface Citation {
    id: string;
    title: string;
    url: string;
    snippet?: string;
}

export interface ArtifactReference {
    id: string;
    type: ArtifactType;
    title: string;
}

export type ArtifactType =
    | "document"
    | "code"
    | "presentation"
    | "spreadsheet"
    | "image"
    | "chart"
    | "html";

export interface Artifact {
    id: string;
    userId: string;
    conversationId?: string;
    messageId?: string;
    type: ArtifactType;
    title: string;
    content: string;
    fileUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, unknown>;
}

export interface Conversation {
    id: string;
    userId: string;
    title: string;
    model: ModelId;
    createdAt: Date;
    updatedAt: Date;
    isArchived: boolean;
    isIncognito?: boolean;
    isPinned?: boolean;
    metadata?: ConversationMetadata;
}

export interface ConversationMetadata {
    messageCount?: number;
    lastMessagePreview?: string;
    tags?: string[];
}

export interface Project {
    id: string;
    userId: string;
    name: string;
    conversationIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

export type ModelId = "mar-beta" | "mar-pro" | "mar-deep";

export interface Model {
    id: ModelId;
    name: string;
    description: string;
    geminiModel: string;
    contextWindow: number;
    maxOutputTokens: number;
    icon: string;
    isPro?: boolean;
    features?: string[];
}

export const MODELS: Model[] = [
    {
        id: "mar-beta",
        name: "MAR",
        description: "Fast, efficient model for everyday tasks.",
        geminiModel: "gpt-5-nano",
        contextWindow: 400000,
        maxOutputTokens: 32768,
        icon: "zap",
        features: ["Tools", "Fast", "Cost-efficient"],
    },
    {
        id: "mar-pro",
        name: "MAR Pro",
        description: "Most capable model for complex reasoning and creation.",
        geminiModel: "gpt-5-nano",
        contextWindow: 400000,
        maxOutputTokens: 32768,
        icon: "brain",
        isPro: true,
        features: ["Tools", "Reasoning", "Advanced"],
    },
    {
        id: "mar-deep",
        name: "MAR Deep",
        description: "Research-grade model for deep analysis and long-form output.",
        geminiModel: "gpt-5-nano",
        contextWindow: 400000,
        maxOutputTokens: 131072,
        icon: "flask",
        isPro: true,
        features: ["Tools", "Analysis", "Research"],
    },
];

export interface ChatRequest {
    messages: Array<{
        role: MessageRole;
        content: string;
    }>;
    model: ModelId;
    conversationId?: string;
    stream?: boolean;
    tools?: string[];
}

export interface ChatResponse {
    id: string;
    message: Message;
    conversationId: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: ToolCategory;
    parameters: ToolParameter[];
    enabled: boolean;
}

export type ToolCategory =
    | "search"
    | "code"
    | "document"
    | "creative"
    | "data"
    | "utility";

export interface ToolParameter {
    name: string;
    type: "string" | "number" | "boolean" | "array" | "object";
    description: string;
    required: boolean;
    default?: unknown;
}

export interface User {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    preferences: UserPreferences;
}

export type ResponseStyle =
    | "normal"
    | "learning"
    | "concise"
    | "explanatory"
    | "formal";

export interface UserPreferences {
    theme: "light" | "dark" | "system";
    defaultModel: ModelId;
    privacyMode: "public" | "private" | "anonymous";
    enableTools: boolean;
    enableArtifacts: boolean;
    persona: PersonaType;
    notifications: boolean;
    webSearchEnabled: boolean;
    responseStyle: ResponseStyle;
}

export type PersonaType =
    | "professional"
    | "casual"
    | "technical"
    | "creative"
    | "educational";

export const DEFAULT_PREFERENCES: UserPreferences = {
    theme: "system",
    defaultModel: "mar-beta",
    privacyMode: "public",
    enableTools: true,
    enableArtifacts: true,
    persona: "professional",
    notifications: true,
    webSearchEnabled: false,
    responseStyle: "normal",
};
