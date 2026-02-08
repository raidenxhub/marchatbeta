"use client";

import { useEffect, useCallback } from "react";
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandShortcut,
} from "@/components/ui/command";
import { Plus, MessageSquare, Square, Keyboard, Settings } from "lucide-react";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFocusInput?: () => void;
    onStop?: () => void;
    sidebarOpen: boolean;
    onToggleSidebar?: () => void;
}

export function CommandPalette({
    open,
    onOpenChange,
    onFocusInput,
    onStop,
    sidebarOpen,
    onToggleSidebar,
}: CommandPaletteProps) {
    const { createConversation, setActiveConversation, isStreaming } = useChatStore();
    const { setIsOpen: setSettingsOpen } = useSettingsStore();

    const handleNewChat = useCallback(() => {
        const id = createConversation();
        setActiveConversation(id);
        onOpenChange(false);
    }, [createConversation, setActiveConversation, onOpenChange]);

    const handleFocusInput = useCallback(() => {
        onFocusInput?.();
        onOpenChange(false);
    }, [onFocusInput, onOpenChange]);

    const handleStop = useCallback(() => {
        onStop?.();
        onOpenChange(false);
    }, [onStop, onOpenChange]);

    const handleToggleSidebar = useCallback(() => {
        onToggleSidebar?.();
        onOpenChange(false);
    }, [onToggleSidebar, onOpenChange]);

    const handleSettings = useCallback(() => {
        setSettingsOpen(true);
        onOpenChange(false);
    }, [setSettingsOpen, onOpenChange]);

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Type a command or search…" aria-label="Command palette search" />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Actions">
                    <CommandItem onSelect={handleNewChat} aria-label="New chat">
                        <Plus className="mr-2 h-4 w-4" />
                        New chat
                        <CommandShortcut>Ctrl+N</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={handleFocusInput} aria-label="Focus message input">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Focus message input
                        <CommandShortcut>/</CommandShortcut>
                    </CommandItem>
                    {isStreaming && (
                        <CommandItem onSelect={handleStop} aria-label="Stop generating">
                            <Square className="mr-2 h-4 w-4" />
                            Stop generating
                            <CommandShortcut>Esc</CommandShortcut>
                        </CommandItem>
                    )}
                    <CommandItem onSelect={handleToggleSidebar} aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}>
                        <Keyboard className="mr-2 h-4 w-4" />
                        {sidebarOpen ? "Close sidebar" : "Open sidebar"}
                    </CommandItem>
                    <CommandItem onSelect={handleSettings} aria-label="Open settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                        <CommandShortcut>Ctrl+,</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}

/** Hook: Ctrl+K open palette, Ctrl+N new chat, Esc stop, / focus input. */
export function useGlobalShortcuts(
    options: {
        onOpenPalette: () => void;
        onNewChat: () => void;
        onFocusInput: () => void;
        onStop: () => void;
    }
) {
    const { onOpenPalette, onNewChat, onFocusInput, onStop } = options;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "k") {
                e.preventDefault();
                onOpenPalette();
                return;
            }
            if (e.ctrlKey && e.key === "n") {
                e.preventDefault();
                onNewChat();
                return;
            }
            if (e.key === "Escape") {
                onStop();
                return;
            }
            if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const target = e.target as HTMLElement;
                const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
                if (!isInput) {
                    e.preventDefault();
                    onFocusInput();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onOpenPalette, onNewChat, onFocusInput, onStop]);
}
