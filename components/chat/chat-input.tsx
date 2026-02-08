"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback, KeyboardEvent } from "react";
import { ArrowUp, Paperclip, Mic, StopCircle } from "lucide-react";
import { AttachPlusDropdown } from "@/components/chat/attach-plus-dropdown";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";
export interface ChatInputRef {
    setMessage: (text: string) => void;
    focus: () => void;
}

interface ChatInputProps {
    onSend: (message: string) => void;
    onStop?: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    placeholder?: string;
    compact?: boolean;
    /** Last user message content for ↑ key (previous message) */
    lastUserMessage?: string;
}

const ChatInputInner = forwardRef<ChatInputRef, ChatInputProps>(function ChatInputInner(
    {
        onSend,
        onStop,
        isLoading = false,
        disabled = false,
        placeholder = "How can I help you today?",
        compact = false,
        lastUserMessage,
    },
    ref
) {
    const [message, setMessage] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [attachments, setAttachments] = useState<File[]>([]);

    useImperativeHandle(ref, () => ({
        setMessage: (text: string) => {
            setMessage(text);
            setTimeout(() => textareaRef.current?.focus(), 0);
        },
        focus: () => textareaRef.current?.focus(),
    }));

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(
                textareaRef.current.scrollHeight,
                200
            )}px`;
        }
    }, [message]);

    const handleSend = () => {
        if ((message.trim() || attachments.length > 0) && !isLoading && !disabled) {
            // In a real app, we'd upload files or send as base64
            // For now, we'll just send the message text
            onSend(message.trim());
            setMessage("");
            setAttachments([]);
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
            return;
        }
        if (e.key === "Escape") {
            e.preventDefault();
            if (message.trim()) {
                setMessage("");
                if (textareaRef.current) textareaRef.current.style.height = "auto";
            } else {
                textareaRef.current?.blur();
            }
            return;
        }
        if (e.key === "ArrowUp" && !e.shiftKey && !message.trim() && lastUserMessage) {
            e.preventDefault();
            setMessage(lastUserMessage);
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
            }
        }
    };

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
            const file = items[i].kind === "file" ? items[i].getAsFile() : null;
            if (file) files.push(file);
        }
        if (files.length > 0) {
            e.preventDefault();
            setAttachments((prev) => [...prev, ...files]);
            toast.success(`Added ${files.length} file${files.length > 1 ? "s" : ""}`);
        }
    }, []);

    return (
        <TooltipProvider>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl mx-auto px-3 sm:px-4"
            >
                {/* File Previews */}
                <AnimatePresence>
                    {attachments.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex flex-wrap gap-2 mb-2"
                        >
                            {attachments.map((file, i) => (
                                <div
                                    key={i}
                                    className="group relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#262624] border border-[#333] text-xs text-[#c1c0b5]"
                                >
                                    <Paperclip className="w-3 h-3 text-[#c1c0b5]/50" />
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button
                                        onClick={() => removeAttachment(i)}
                                        className="ml-1 text-[#c1c0b5]/40 hover:text-red-400 transition-colors"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div
                    className={cn(
                        "relative flex items-end gap-2 p-3 rounded-2xl transition-all duration-300 rounded-[inherit]",
                        "bg-[#1e1e1c] border border-[#333]",
                        "shadow-lg",
                        isFocused && "border-[#c1c0b5]/30 shadow-[#c1c0b5]/5"
                    )}
                >
                    <GlowingEffect
                        spread={30}
                        glow
                        disabled={false}
                        proximity={80}
                        inactiveZone={0.4}
                        borderWidth={1}
                    />
                    <div className="relative z-10 flex items-end gap-1.5 sm:gap-2 flex-1 min-w-0">
                    {/* Plus dropdown: Add files, screenshot, project, web search, style */}
                    <AttachPlusDropdown
                        onFilesAdded={(files) => setAttachments((prev) => [...prev, ...files])}
                        disabled={disabled}
                    />

                    {/* Input Area */}
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholder}
                        disabled={disabled || isLoading}
                        rows={2}
                        className={cn(
                            "flex-1 min-h-[56px] max-h-[240px] py-3 px-3",
                            "bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                            "resize-none text-[#c1c0b5] scrollbar-hide",
                            "placeholder:text-[#c1c0b5]/40"
                        )}
                    />

                    {/* Voice Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 rounded-xl text-[#c1c0b5]/50 hover:text-[#c1c0b5] hover:bg-[#262624]"
                                disabled={disabled}
                                onClick={() => {
                                    toast.info("Voice mode is coming soon!");
                                }}
                            >
                                <Mic className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Voice input (Coming Soon)</TooltipContent>
                    </Tooltip>

                    {/* Send/Stop Button */}
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="stop"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={onStop}
                                            className="shrink-0 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                        >
                                            <StopCircle className="w-5 h-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Stop generating</TooltipContent>
                                </Tooltip>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="send"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleSend}
                                            disabled={disabled || (!message.trim() && attachments.length === 0)}
                                            className={cn(
                                                "shrink-0 rounded-xl transition-all duration-300",
                                                (message.trim() || attachments.length > 0)
                                                    ? "bg-[#c1c0b5] text-[#262624] hover:bg-[#d4d3c8] opacity-100"
                                                    : "bg-[#333] text-[#c1c0b5]/30 opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <ArrowUp className="w-5 h-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Send message
                                    </TooltipContent>
                                </Tooltip>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    </div>
                </div>

                {/* Helper Text (hidden in compact/welcome view) */}
                {!compact && (
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-[#c1c0b5]/50 flex-wrap">
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1c] border border-[#333] text-[#c1c0b5]/70 font-mono">Enter</kbd> send</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1c] border border-[#333] text-[#c1c0b5]/70 font-mono">↑</kbd> last message</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1c] border border-[#333] text-[#c1c0b5]/70 font-mono">Esc</kbd> clear</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1c] border border-[#333] text-[#c1c0b5]/70 font-mono">/</kbd> commands</span>
                </div>
                )}
            </motion.div>
        </TooltipProvider>
    );
});

export const ChatInput = ChatInputInner;
