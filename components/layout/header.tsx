"use client";

import { Share2, Download, Ghost, X, Cloud, Menu, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { useChatStore } from "@/lib/store/chat-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HeaderProps {
    onMenuClick?: () => void;
    sidebarOpen: boolean;
}

export function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
    const {
        getActiveConversation,
        getActiveMessages,
        incognitoMode,
        setIncognitoMode,
        createConversation,
        setActiveConversation,
    } = useChatStore();

    const activeConversation = getActiveConversation();
    const messages = getActiveMessages();

    const handleExitIncognito = () => {
        setIncognitoMode(false);
        const id = createConversation(undefined, { isIncognito: false });
        setActiveConversation(id);
    };

    const handleExportChat = () => {
        if (!activeConversation || messages.length === 0) {
            toast.info("No messages to export");
            return;
        }
        const lines = messages.map((m) => {
            const role = m.role === "user" ? "You" : "MAR";
            return `**${role}:**\n${m.content}`;
        });
        const blob = new Blob([lines.join("\n\n")], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeConversation.title || "chat"}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Chat exported");
    };

    const handleShareChat = async () => {
        if (!activeConversation || messages.length === 0) {
            toast.info("No messages to share");
            return;
        }
        const text = messages
            .map((m) => {
                const role = m.role === "user" ? "You" : "MAR";
                return `${role}:\n${m.content}`;
            })
            .join("\n\n");
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Conversation copied to clipboard");
        } catch {
            toast.error("Could not copy");
        }
    };

    const handleCopyConversation = async () => {
        if (!activeConversation || messages.length === 0) {
            toast.info("No messages to copy");
            return;
        }
        const title = activeConversation.title || "Conversation";
        const date = new Date(activeConversation.createdAt).toLocaleDateString();
        const header = `# ${title}\n*${date} | ${messages.length} messages*\n\n---\n\n`;
        const body = messages
            .map((m) => {
                const role = m.role === "user" ? "**You**" : "**MAR**";
                return `### ${role}\n\n${m.content}`;
            })
            .join("\n\n---\n\n");
        try {
            await navigator.clipboard.writeText(header + body);
            toast.success("Full conversation copied as markdown");
        } catch {
            toast.error("Could not copy");
        }
    };

    return (
        <TooltipProvider>
            <header
                role="banner"
                aria-label="Chat header"
                className={cn(
                    "sticky top-0 z-30 h-14 shrink-0 px-4 safe-area-top",
                    "flex items-center justify-between gap-4",
                    incognitoMode
                        ? "bg-[#e5e5e0] text-[#333] border-b border-[#d4d4d4]"
                        : "bg-[#1a1a18]/95 backdrop-blur-xl border-b border-[#333]"
                )}
            >
                <div className="flex items-center gap-3 min-h-[44px]">
                    {onMenuClick && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onMenuClick}
                            className="h-9 w-9 rounded-lg text-[#c1c0b5]/70 hover:text-[#c1c0b5] hover:bg-[#262624] md:hidden"
                            aria-label="Toggle sidebar"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                    )}
                </div>

                {incognitoMode ? (
                    <>
                        <div className="flex items-center gap-2 flex-1 justify-center">
                            <Ghost className="w-4 h-4 text-[#333]/80" />
                            <h1 className="text-sm font-medium text-[#333] truncate">Incognito chat</h1>
                        </div>
                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleExitIncognito}
                                        className="h-8 w-8 rounded-lg text-[#333]/70 hover:text-[#333] hover:bg-[#d4d4d4]"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Close incognito</TooltipContent>
                            </Tooltip>
                        </div>
                    </>
                ) : (
                    <>
                        {activeConversation && (
                            <div className="hidden md:flex flex-1 items-center justify-center gap-2">
                                <h1 className="text-sm font-medium text-[#c1c0b5]/90 truncate max-w-md">
                                    {activeConversation.title}
                                </h1>
                                <span
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-[#c1c0b5]/60 bg-[#262624] border border-[#333]"
                                    title="Requests are processed in the cloud"
                                    aria-label="Cloud processing"
                                >
                                    <Cloud className="w-3 h-3" />
                                    Cloud
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIncognitoMode(true)}
                                        className="h-8 w-8 rounded-lg text-[#c1c0b5]/60 hover:text-amber-400/90 hover:bg-[#262624]"
                                    >
                                        <Ghost className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Incognito – chats not saved</TooltipContent>
                            </Tooltip>

                            {activeConversation && (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleCopyConversation}
                                                className="h-8 w-8 rounded-lg text-[#c1c0b5]/60 hover:text-[#c1c0b5] hover:bg-[#262624]"
                                            >
                                                <ClipboardCopy className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">Copy conversation</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleShareChat}
                                                className="h-8 w-8 rounded-lg text-[#c1c0b5]/60 hover:text-[#c1c0b5] hover:bg-[#262624]"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">Share chat</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleExportChat}
                                                className="h-8 w-8 rounded-lg text-[#c1c0b5]/60 hover:text-[#c1c0b5] hover:bg-[#262624]"
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">Export chat</TooltipContent>
                                    </Tooltip>
                                </>
                            )}
                        </div>
                    </>
                )}
            </header>
        </TooltipProvider>
    );
}
