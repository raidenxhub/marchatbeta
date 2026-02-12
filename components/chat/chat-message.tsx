"use client";

import { memo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    Copy,
    Check,
    User,
    Bot,
    RefreshCw,
    ThumbsUp,
    ThumbsDown,
    Play,
    Upload,
    Download,
    ChevronRight,
    ChevronDown,
    FileText,
    Code,
    Layout,
    Image as ImageIcon,
    Pencil,
    GitBranch,
    MoreHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { cn, copyToClipboard, formatTime } from "@/lib/utils";
import { CollapsibleContent } from "./collapsible-content";
import { FlightResultsCard } from "./flight-results-card";
import { HotelResultsCard } from "./hotel-results-card";
import { WeatherResultsCard } from "./weather-results-card";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { SparkleLoader } from "@/components/ui/sparkle-loader";
import type { Message, ArtifactReference } from "@/lib/types/chat";
import { useChatStore } from "@/lib/store/chat-store";
import { REFINE_ACTIONS } from "@/lib/data/quick-chats";

/** Single status label when streaming. Used when no explicit streamingStatus is set. */
function getStreamingStatusLabel(
    reasoning: string,
    hasContent: boolean,
    flightCount: number,
    hotelCount: number,
    hasWeather: boolean
): string {
    if (hasContent) return "Writing…";
    if (flightCount > 0) return `Found ${flightCount} flight${flightCount !== 1 ? "s" : ""}`;
    if (hotelCount > 0) return `Found ${hotelCount} hotel${hotelCount !== 1 ? "s" : ""}`;
    if (hasWeather) return "Fetched weather";
    if (/Searching the web/i.test(reasoning)) return "Searching…";
    if (/Reading the page|Fetching the webpage/i.test(reasoning)) return "Fetching page…";
    if (/Looking up flights/i.test(reasoning)) return "Searching flights…";
    if (/Searching for hotels/i.test(reasoning)) return "Searching hotels…";
    if (/Fetching weather|Getting current weather/i.test(reasoning)) return "Fetching weather…";
    if (/Creating|Building your/i.test(reasoning)) return "Creating…";
    if (/Running the calculation|crunch those numbers/i.test(reasoning)) return "Calculating…";
    if (reasoning.trim()) return "Thinking…";
    return "Analyzing…";
}

const ARTIFACT_ICONS: Record<string, React.ReactNode> = {
    document: <FileText className="w-4 h-4" />,
    code: <Code className="w-4 h-4" />,
    html: <Layout className="w-4 h-4" />,
    presentation: <Layout className="w-4 h-4" />,
    spreadsheet: <FileText className="w-4 h-4" />,
    image: <ImageIcon className="w-4 h-4" aria-hidden />,
    chart: <ImageIcon className="w-4 h-4" aria-hidden />,
};

/** When tool cards exist, hide content that duplicates flight/hotel/weather data. Only show brief intros. */
function getDisplayContent(
    content: string,
    hasFlightResults: boolean,
    hasHotelResults: boolean,
    hasWeatherResults: boolean
): string {
    if (!content || content === "\u200b") return "";
    const hasToolCards = hasFlightResults || hasHotelResults || hasWeatherResults;
    if (!hasToolCards) return content;

    const trimmed = content.trim();
    /* Hide content that duplicates card data */
    const hasTable = /^\s*\|.+\|/m.test(trimmed);
    const hasNumberedListWithDates = /^\d+\.\s.*\d{4}-\d{2}-\d{2}/m.test(trimmed);
    const hasFlightPatterns = /(Qatar|Emirates|Etihad|Turkish|airline|Departure:|Arrival:|Duration:|\$\d{2,4})/i.test(trimmed);
    const hasHotelPatterns = /(hotel.*\d+\.?\d*\s*\*|rating|amenities|per night)/i.test(trimmed);
    const hasWeatherPatterns = /(\d+°|°F|°C|temperature|humidity|wind.*mph|condition:)/i.test(trimmed);
    const tooLong = trimmed.length > 280;
    const looksLikeDuplicate =
        hasTable || hasNumberedListWithDates || hasFlightPatterns || hasHotelPatterns || hasWeatherPatterns || tooLong;
    if (looksLikeDuplicate) return "";
    return trimmed;
}

/** Single pressable row. Click to expand/collapse what the AI is thinking. Uses TextShimmer for Analyzing/Thinking/Finalizing. */
const ReasoningBlock = memo(function ReasoningBlock({
    reasoning,
    isStreaming,
    hasContent,
}: {
    reasoning: string;
    isStreaming: boolean;
    hasContent: boolean;
}) {
    const [open, setOpen] = useState(false);
    const isAnalyzing = isStreaming && !hasContent;
    const label = isAnalyzing ? "Analyzing" : "AI Thoughts";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-0 mb-4"
        >
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    "w-full flex items-center justify-between gap-2 rounded-lg py-2 px-3 text-left transition-colors",
                    "text-[#c1c0b5]/60 hover:text-[#c1c0b5] hover:bg-[#262624]/80 text-sm font-medium"
                )}
            >
                <span className="flex items-center gap-1">
                    {isAnalyzing ? (
                        <TextShimmer duration={1.2} spread={1.5} className="text-sm font-medium">
                            Analyzing
                        </TextShimmer>
                    ) : (
                        label
                    )}
                </span>
                {open ? (
                    <ChevronDown className="w-4 h-4 shrink-0 text-[#c1c0b5]/40" />
                ) : (
                    <ChevronRight className="w-4 h-4 shrink-0 text-[#c1c0b5]/40" />
                )}
            </button>
            {open && (
                <div className="rounded-b-lg border border-[#333] border-t-0 bg-[#1e1e1c] overflow-hidden">
                    <div className="p-4 text-sm text-[#c1c0b5]/70 italic font-serif leading-relaxed whitespace-pre-wrap">
                        {reasoning || (isStreaming ? "Thinking…" : "No reasoning captured.")}
                    </div>
                </div>
            )}
        </motion.div>
    );
});

interface ChatMessageProps {
    message: Message;
    isStreaming?: boolean;
    onRegenerate?: () => void;
    onBranch?: () => void;
    onRefine?: (prompt: string) => void;
    onEdit?: () => void;
    onEditMessage?: (messageId: string, newContent: string) => void;
    onFeedback?: (messageId: string, type: "up" | "down") => void;
    onAction?: (messageId: string, action: string) => void;
    isLast?: boolean;
}

const CodeBlock = memo(function CodeBlock({
    language,
    value,
}: {
    language: string;
    value: string;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await copyToClipboard(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4 rounded-xl overflow-hidden border border-[#333]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#333]">
                <span className="text-sm text-[#f5f5dc]/50 font-mono">
                    {language || "code"}
                </span>
                <div className="flex items-center gap-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopy}
                                    className="h-7 px-2 text-[#f5f5dc]/50 hover:text-[#f5f5dc] hover:bg-[#262626]"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{copied ? "Copied!" : "Copy code"}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    {(language === "javascript" ||
                        language === "typescript" ||
                        language === "python") && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-[#f5f5dc]/50 hover:text-[#f5f5dc] hover:bg-[#262626]"
                                        >
                                            <Play className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Run code</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                </div>
            </div>

            {/* Code */}
            <SyntaxHighlighter
                language={language}
                style={oneDark}
                customStyle={{
                    margin: 0,
                    padding: "1rem",
                    background: "#0a0a0a",
                    fontSize: "0.875rem",
                }}
                showLineNumbers
                lineNumberStyle={{ color: "#333", minWidth: "2.5em" }}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    );
});

function ArtifactCard({ artifact, onOpen }: { artifact: ArtifactReference; onOpen: () => void }) {
    const icon = ARTIFACT_ICONS[artifact.type] ?? <FileText className="w-4 h-4" />;
    return (
        <button
            type="button"
            onClick={onOpen}
            className={cn(
                "flex items-center gap-3 w-full max-w-sm rounded-xl border border-[#333] bg-[#1e1e1c] px-4 py-3 text-left",
                "hover:bg-[#262624] hover:border-[#444] transition-colors group"
            )}
        >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#262626] text-[#c1c0b5]/80 group-hover:text-amber-400/90">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <span className="block truncate font-medium text-[#c1c0b5] text-sm">{artifact.title}</span>
                <span className="text-[10px] text-[#c1c0b5]/50 capitalize">{artifact.type}</span>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0 text-[#c1c0b5]/40" />
        </button>
    );
}

export const ChatMessage = memo(function ChatMessage({
    message,
    isStreaming = false,
    onRegenerate,
    onBranch,
    onRefine,
    onEdit,
    onEditMessage,
    onFeedback,
    onAction,
    isLast = false,
}: ChatMessageProps) {
    const [showActions, setShowActions] = useState(false);
    const [showRefineMenu, setShowRefineMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const editTextareaRef = useRef<HTMLTextAreaElement>(null);
    const isUser = message.role === "user";

    useEffect(() => {
        if (isEditing && editTextareaRef.current) {
            editTextareaRef.current.focus();
            editTextareaRef.current.setSelectionRange(editContent.length, editContent.length);
        }
        // Intentionally only run when isEditing toggles; editContent.length would refocus on every keystroke
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing]);

    const handleEditSubmit = () => {
        const trimmed = editContent.trim();
        if (trimmed && trimmed !== message.content && onEditMessage) {
            onEditMessage(message.id, trimmed);
        }
        setIsEditing(false);
    };
    const setActiveArtifact = useChatStore((s) => s.setActiveArtifact);
    const setArtifactPanelOpen = useChatStore((s) => s.setArtifactPanelOpen);
    const streamingStatus = useChatStore((s) => s.streamingStatus);
    const completedStatuses = message.metadata?.completedStatuses ?? [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className={cn(
                "group relative flex gap-4 px-4 py-8",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            {/* Avatar */}
            <Avatar className={cn("w-8 h-8 shrink-0", isUser ? "ml-2" : "mr-2")}>
                {isUser ? (
                    <>
                        <AvatarImage src="/user-avatar.png" alt="User" />
                        <AvatarFallback className="bg-[#1e1e1c] text-[#c1c0b5] border border-[#333]">
                            <User className="w-4 h-4" />
                        </AvatarFallback>
                    </>
                ) : (
                    <>
                        <AvatarImage src="/mar-avatar.png" alt="MAR" />
                        <AvatarFallback className="bg-[#1e1e1c] text-[#c1c0b5] border border-[#333]">
                            <Bot className="w-4 h-4" />
                        </AvatarFallback>
                    </>
                )}
            </Avatar>

            {/* Message Content */}
            <div
                className={cn(
                    "flex-1 space-y-2.5 min-w-0",
                    isUser ? "items-end flex flex-col max-w-[85%] sm:max-w-[45%] ml-auto" : "items-start max-w-[95%] sm:max-w-[85%]"
                )}
            >
                {/* Header: You + timestamp for user; timestamp only for AI */}
                <div
                    className={cn(
                        "flex items-center gap-2",
                        isUser ? "flex-row-reverse text-right" : "flex-row"
                    )}
                >
                    {isUser && (
                        <span className="font-bold text-[#c1c0b5] text-sm tracking-tight capitalize">
                            You
                        </span>
                    )}
                    <span className="text-[#c1c0b5]/50 text-[10px] tabular-nums font-mono">
                        {formatTime(message.createdAt)}
                    </span>
                </div>

                {/* Content */}
                <div
                    className={cn(
                        "relative px-5 py-3.5 text-base transition-all break-words overflow-wrap-anywhere",
                        isUser
                            ? "rounded-2xl bg-[#1e1e1c] text-[#c1c0b5] ring-1 ring-inset ring-[#333] shadow-sm"
                            : "bg-transparent text-[#c1c0b5] ring-0 px-0"
                    )}
                >
                    {isUser ? (
                        isEditing ? (
                            <div className="space-y-2 w-full">
                                <textarea
                                    ref={editTextareaRef}
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                                        if (e.key === "Escape") { setIsEditing(false); setEditContent(message.content); }
                                    }}
                                    className="w-full min-h-[60px] p-2 text-sm bg-[#262624] border border-amber-500/40 rounded-lg text-[#c1c0b5] outline-none resize-none"
                                    rows={Math.min(editContent.split("\n").length + 1, 8)}
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => { setIsEditing(false); setEditContent(message.content); }}
                                        className="px-3 py-1 text-xs rounded-lg border border-[#333] text-[#c1c0b5]/70 hover:text-[#c1c0b5] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleEditSubmit}
                                        className="px-3 py-1 text-xs rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                                    >
                                        Save & Submit
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="whitespace-pre-wrap font-sans leading-relaxed text-sm font-medium">
                                {message.content}
                            </p>
                        )
                    ) : (
                        <div className="markdown-content space-y-4">
                            {/* Flight results - instant pop-up, no typing animation */}
                            {!isUser && message.metadata?.flightResults && (
                                <FlightResultsCard data={message.metadata.flightResults} />
                            )}
                            {/* Hotel results - instant pop-up */}
                            {!isUser && message.metadata?.hotelResults && (
                                <HotelResultsCard data={message.metadata.hotelResults} />
                            )}
                            {!isUser && message.metadata?.weatherResults && (
                                <WeatherResultsCard data={message.metadata.weatherResults} />
                            )}
                            {/* Artifact cards - reopenable from chat history */}
                            {!isUser && message.metadata?.artifacts && message.metadata.artifacts.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {message.metadata.artifacts.map((ref) => (
                                        <ArtifactCard
                                            key={ref.id}
                                            artifact={ref}
                                            onOpen={() => {
                                                setActiveArtifact(ref.id);
                                                setArtifactPanelOpen(true);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                            {/* Status row: streaming (live) or completed (past tense) */}
                            {!isUser && (isStreaming || completedStatuses.length > 0) && (
                                <div
                                    className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#c1c0b5]/60 mb-2"
                                    role="status"
                                    aria-live="polite"
                                >
                                    {isStreaming ? (
                                        <>
                                            <SparkleLoader size="sm" />
                                            {(() => {
                                                const label = streamingStatus ?? getStreamingStatusLabel(
                                                    message.metadata?.reasoning ?? "",
                                                    !!(message.content && message.content.trim() && message.content !== "\u200b"),
                                                    message.metadata?.flightResults?.flights?.length ?? 0,
                                                    message.metadata?.hotelResults?.hotels?.length ?? 0,
                                                    !!message.metadata?.weatherResults
                                                );
                                                return (
                                                    <TextShimmer duration={1.5} spread={1} className="text-sm font-medium">
                                                        {label}
                                                    </TextShimmer>
                                                );
                                            })()}
                                        </>
                                    ) : (
                                        <>
                                            <SparkleLoader size="sm" animate={false} />
                                            {completedStatuses.map((s, i) => (
                                                <span key={i} className="flex items-center gap-1.5">
                                                    {i > 0 && <span className="text-[#c1c0b5]/40">·</span>}
                                                    <span>{s}</span>
                                                </span>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                            {/* Reasoning (AI Thoughts) - only when not streaming, expandable */}
                            {!isUser && !isStreaming && message.metadata?.reasoning?.trim() ? (
                                <ReasoningBlock
                                    reasoning={message.metadata.reasoning}
                                    isStreaming={false}
                                    hasContent={!!(message.content && message.content.trim() && message.content !== "\u200b")}
                                />
                            ) : null}

                            {(() => {
                                const displayContent = getDisplayContent(
                                    message.content || "",
                                    !!message.metadata?.flightResults,
                                    !!message.metadata?.hotelResults,
                                    !!message.metadata?.weatherResults
                                );
                                return displayContent && (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        code({ node, className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || "");
                                            const isInline = !match;
                                            const value = String(children).replace(/\n$/, "");

                                            if (isInline) {
                                                return (
                                                    <code
                                                        className="px-1.5 py-0.5 rounded-md bg-[#1e1e1c] text-[#c1c0b5] border border-[#333] text-sm font-mono"
                                                        {...props}
                                                    >
                                                        {children}
                                                    </code>
                                                );
                                            }

                                            const language = match ? match[1] : "code";

                                            return (
                                                <CollapsibleContent
                                                    title={`${language.charAt(0).toUpperCase() + language.slice(1)} Block`}
                                                    type="code"
                                                >
                                                    <CodeBlock
                                                        language={language}
                                                        value={value}
                                                    />
                                                </CollapsibleContent>
                                            );
                                        },
                                        a({ href, children }) {
                                            return (
                                                <a
                                                    href={href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#c1c0b5] hover:text-[#e0dfd4] underline underline-offset-4 decoration-1 decoration-[#c1c0b5]/50"
                                                >
                                                    {children}
                                                </a>
                                            );
                                        },
                                        p({ children }) {
                                            return <p className="leading-relaxed mb-4 last:mb-0">{children}</p>
                                        },
                                        ul({ children }) {
                                            return <ul className="list-disc pl-6 space-y-1 mb-4">{children}</ul>
                                        },
                                        ol({ children }) {
                                            return <ol className="list-decimal pl-6 space-y-1 mb-4">{children}</ol>
                                        }
                                    }}
                                >
                                    {displayContent}
                                </ReactMarkdown>
                                );
                            })()}

                        </div>
                    )}
                </div>

                {/* Actions: Copy for user messages; full actions for assistant */}
                {isUser && showActions && !isEditing && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1 pt-1"
                    >
                        <TooltipProvider>
                            {onEditMessage && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-[#f5f5dc]/40 hover:text-[#f5f5dc] hover:bg-[#1a1a1a]"
                                            onClick={() => { setEditContent(message.content); setIsEditing(true); }}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                            )}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[#f5f5dc]/40 hover:text-[#f5f5dc] hover:bg-[#1a1a1a]"
                                        onClick={() => copyToClipboard(message.content)}
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </motion.div>
                )}
                {!isUser && showActions && !isStreaming && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1 pt-1"
                    >
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[#f5f5dc]/40 hover:text-[#f5f5dc] hover:bg-[#1a1a1a]"
                                        onClick={() => copyToClipboard(message.content)}
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy</TooltipContent>
                            </Tooltip>

                            {isLast && onRegenerate && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-[#f5f5dc]/40 hover:text-[#f5f5dc] hover:bg-[#1a1a1a]"
                                            onClick={onRegenerate}
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Regenerate</TooltipContent>
                                </Tooltip>
                            )}

                            {onBranch && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-[#f5f5dc]/40 hover:text-[#f5f5dc] hover:bg-[#1a1a1a]"
                                            onClick={onBranch}
                                        >
                                            <GitBranch className="w-3.5 h-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Branch from here</TooltipContent>
                                </Tooltip>
                            )}

                            {onRefine && message.content?.trim() && message.content !== "\u200b" && (
                                <div className="relative">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-[#f5f5dc]/40 hover:text-[#f5f5dc] hover:bg-[#1a1a1a]"
                                                onClick={() => setShowRefineMenu((v) => !v)}
                                            >
                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Refine response</TooltipContent>
                                    </Tooltip>
                                    {showRefineMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowRefineMenu(false)} />
                                            <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-[#333] bg-[#1e1e1c] py-1 shadow-xl">
                                                {REFINE_ACTIONS.filter((a) => a.id !== "translate").map((action) => (
                                                    <button
                                                        key={action.id}
                                                        type="button"
                                                        className="w-full px-3 py-2 text-left text-sm text-[#c1c0b5]/90 hover:bg-[#262624]"
                                                        onClick={() => {
                                                            onRefine(`[Previous response]\n\n${message.content}\n\n---\n\n${action.prompt}`);
                                                            setShowRefineMenu(false);
                                                        }}
                                                    >
                                                        {action.label}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    className="w-full px-3 py-2 text-left text-sm text-[#c1c0b5]/90 hover:bg-[#262624]"
                                                    onClick={() => {
                                                        onRefine(`[Previous response]\n\n${message.content}\n\n---\n\nTranslate this to another language. Keep the same tone and formatting.`);
                                                        setShowRefineMenu(false);
                                                    }}
                                                >
                                                    Translate
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[#f5f5dc]/40 hover:text-green-500/80 hover:bg-[#1a1a1a]"
                                        onClick={() => {
                                            if (onFeedback) {
                                                onFeedback(message.id, "up");
                                            } else {
                                                toast.success("Feedback received! Thank you.");
                                            }
                                        }}
                                    >
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Good response</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[#f5f5dc]/40 hover:text-red-500/80 hover:bg-[#1a1a1a]"
                                        onClick={() => {
                                            if (onFeedback) {
                                                onFeedback(message.id, "down");
                                            } else {
                                                toast.info("Feedback received. We'll improve!");
                                            }
                                        }}
                                    >
                                        <ThumbsDown className="w-3.5 h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Bad response</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[#f5f5dc]/40 hover:text-[#f5f5dc] hover:bg-[#1a1a1a]"
                                        onClick={() => {
                                            if (onAction) onAction(message.id, "share");
                                            else {
                                                copyToClipboard(window.location.href);
                                                toast.success("Share link copied!");
                                            }
                                        }}
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Share</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-[#f5f5dc]/40 hover:text-[#f5f5dc] hover:bg-[#1a1a1a]"
                                        onClick={() => {
                                            const blob = new Blob([message.content], { type: "text/markdown" });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement("a");
                                            a.href = url;
                                            a.download = `msg-${message.id.slice(0, 8)}.md`;
                                            a.click();
                                            toast.success("Downloading message...");
                                        }}
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
});
