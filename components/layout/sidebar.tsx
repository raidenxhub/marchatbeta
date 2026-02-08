"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    MessageSquare,
    FolderOpen,
    LayoutGrid,
    Trash2,
    Archive,
    ArchiveRestore,
    MoreHorizontal,
    ChevronRight,
    ChevronDown,
    Square,
    Layers,
    Settings,
    Download,
    Pin,
    PinOff,
    Pencil,
    Search,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import { UserDropdown } from "@/components/sidebar/user-dropdown";
import { useChatStore } from "@/lib/store/chat-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import { cn, truncate } from "@/lib/utils";
import type { Conversation } from "@/lib/types/chat";

/* ------------------------------------------------------------------ */
/*  Date grouping helpers                                              */
/* ------------------------------------------------------------------ */

type DateGroup = "Pinned" | "Today" | "Yesterday" | "Last 7 Days" | "Last 30 Days" | "Older";

function getDateGroup(date: Date | string, isPinned?: boolean): DateGroup {
    if (isPinned) return "Pinned";
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    if (diffDays < 7) return "Last 7 Days";
    if (diffDays < 30) return "Last 30 Days";
    return "Older";
}

const GROUP_ORDER: DateGroup[] = ["Pinned", "Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Older"];

function groupConversations(conversations: Conversation[]): Map<DateGroup, Conversation[]> {
    const groups = new Map<DateGroup, Conversation[]>();
    for (const conv of conversations) {
        const group = getDateGroup(conv.updatedAt, conv.isPinned);
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group)!.push(conv);
    }
    return groups;
}

/* ------------------------------------------------------------------ */
/*  Conversation item component                                        */
/* ------------------------------------------------------------------ */

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onLoginClick?: () => void;
}

function ConversationItem({
    conversation,
    isActive,
    onClick,
    onDelete,
    onArchive,
    onExport,
    onPin,
    onRename,
}: {
    conversation: Conversation;
    isActive: boolean;
    onClick: () => void;
    onDelete: () => void;
    onArchive: () => void;
    onExport: () => void;
    onPin: () => void;
    onRename: (title: string) => void;
}) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(conversation.title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleRenameSubmit = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== conversation.title) {
            onRename(trimmed);
        }
        setIsEditing(false);
    };

    return (
        <div className="relative group">
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSubmit();
                        if (e.key === "Escape") { setIsEditing(false); setEditValue(conversation.title); }
                    }}
                    onBlur={handleRenameSubmit}
                    className="w-full text-left px-3 py-2 pr-8 text-sm bg-[#262624] border border-amber-500/40 rounded text-[var(--mar-fg)] outline-none"
                />
            ) : (
                <button
                    type="button"
                    onClick={onClick}
                    onDoubleClick={() => { setEditValue(conversation.title); setIsEditing(true); }}
                    className={cn(
                        "w-full text-left px-3 py-2 pr-8 text-sm truncate block transition-colors",
                        isActive ? "text-[var(--mar-fg)]" : "text-[var(--mar-fg)]/90 hover:text-[var(--mar-fg)]"
                    )}
                >
                    {conversation.isPinned && <Pin className="inline w-3 h-3 mr-1 text-amber-400/70" />}
                    {truncate(conversation.title, conversation.isPinned ? 30 : 36)}
                </button>
            )}
            <div className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2",
                dropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                "transition-opacity"
            )}>
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-[#c1c0b5]/40 hover:text-[#c1c0b5]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-[#262624] border-[#333] text-[#c1c0b5]">
                        <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onPin(); setDropdownOpen(false); }}>
                            {conversation.isPinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
                            {conversation.isPinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditValue(conversation.title); setIsEditing(true); setDropdownOpen(false); }}>
                            <Pencil className="w-4 h-4 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onExport(); setDropdownOpen(false); }}>
                            <Download className="w-4 h-4 mr-2" /> Export
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onArchive(); setDropdownOpen(false); }}>
                            <Archive className="w-4 h-4 mr-2" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(); setDropdownOpen(false); }} className="text-red-500 focus:text-red-500">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

export function Sidebar({ isOpen, onToggle, onLoginClick }: SidebarProps) {
    const user = useAuthStore((s) => s.user);
    const setSettingsOpen = useSettingsStore((s) => s.setIsOpen);
    const {
        conversations,
        messages,
        activeConversationId,
        setActiveConversation,
        createConversation,
        deleteConversation,
        updateConversation,
        projects,
        activeProjectId,
        createProject,
        deleteProject,
        setActiveProject,
        addConversationToProject,
        artifacts,
        activeArtifactId,
        setActiveArtifact,
        setArtifactPanelOpen,
    } = useChatStore();

    const [activeNav, setActiveNav] = useState<"chats" | "projects" | "artifacts">("chats");
    const [showArchived, setShowArchived] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    const filteredConversations = useMemo(() => {
        let list = conversations.filter((c) => !c.isArchived && !c.isIncognito);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((c) => c.title.toLowerCase().includes(q));
        }
        return list;
    }, [conversations, searchQuery]);

    const archivedConversations = useMemo(
        () => conversations.filter((c) => c.isArchived && !c.isIncognito),
        [conversations]
    );

    const groupedConversations = useMemo(
        () => groupConversations(filteredConversations),
        [filteredConversations]
    );

    const handleExportConversation = useCallback((conv: Conversation) => {
        const msgs = messages[conv.id] ?? [];
        const data = {
            exportVersion: 1,
            exportedAt: new Date().toISOString(),
            conversation: {
                id: conv.id,
                title: conv.title,
                model: conv.model,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt,
            },
            messages: msgs.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: m.createdAt,
                model: m.model,
                metadata: m.metadata,
            })),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-${conv.title.replace(/[^a-z0-9]/gi, "-").slice(0, 40)}-${conv.id.slice(0, 8)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [messages]);

    const handleNewChat = () => {
        createConversation();
    };

    const renderConversationList = () => {
        if (searchQuery.trim()) {
            // When searching, show flat list with highlighted matches
            if (filteredConversations.length === 0) {
                return <p className="px-3 py-6 text-xs text-[#c1c0b5]/40">No chats found for &ldquo;{searchQuery}&rdquo;</p>;
            }
            return filteredConversations.map((conversation) => (
                <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={activeConversationId === conversation.id}
                    onClick={() => setActiveConversation(conversation.id)}
                    onDelete={() => deleteConversation(conversation.id)}
                    onArchive={() => updateConversation(conversation.id, { isArchived: true })}
                    onExport={() => handleExportConversation(conversation)}
                    onPin={() => updateConversation(conversation.id, { isPinned: !conversation.isPinned })}
                    onRename={(title) => updateConversation(conversation.id, { title })}
                />
            ));
        }

        // Date-grouped rendering
        const elements: React.ReactNode[] = [];
        for (const group of GROUP_ORDER) {
            const convs = groupedConversations.get(group);
            if (!convs || convs.length === 0) continue;
            elements.push(
                <p key={`group-${group}`} className="px-4 pt-3 pb-1 text-xs font-medium text-[#c1c0b5]/50">
                    {group}
                </p>
            );
            for (const conversation of convs) {
                elements.push(
                    <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isActive={activeConversationId === conversation.id}
                        onClick={() => setActiveConversation(conversation.id)}
                        onDelete={() => deleteConversation(conversation.id)}
                        onArchive={() => updateConversation(conversation.id, { isArchived: true })}
                        onExport={() => handleExportConversation(conversation)}
                        onPin={() => updateConversation(conversation.id, { isPinned: !conversation.isPinned })}
                        onRename={(title) => updateConversation(conversation.id, { title })}
                    />
                );
            }
        }
        if (elements.length === 0) {
            return <p className="px-3 py-6 text-xs text-[#c1c0b5]/40">No chats yet</p>;
        }
        return elements;
    };

    return (
        <TooltipProvider>
            {/* Collapsed strip: show when sidebar is closed */}
            {!isOpen && (
                <div className="fixed left-0 top-0 z-40 h-full w-14 flex flex-col items-center py-4 bg-[var(--mar-bg-secondary)] border-r border-[var(--mar-fg-muted)]/30">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggle}
                                className="h-9 w-9 rounded-lg text-[#c1c0b5]/60 hover:text-[#c1c0b5] hover:bg-[#262624]"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Open sidebar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setActiveNav("artifacts"); onToggle(); }}
                                className="mt-4 h-9 w-9 rounded-lg text-[#c1c0b5]/70 hover:text-[#c1c0b5] hover:bg-[#262624]"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Layout</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNewChat}
                                className="mt-1 h-9 w-9 rounded-lg text-[#c1c0b5]/70 hover:text-[#c1c0b5] hover:bg-[#262624]"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">New chat</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setActiveNav("chats"); onToggle(); }}
                                className="mt-1 h-9 w-9 rounded-lg text-[#c1c0b5]/70 hover:text-[#c1c0b5] hover:bg-[#262624]"
                            >
                                <MessageSquare className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Chat history</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setActiveNav("projects"); onToggle(); }}
                                className="mt-1 h-9 w-9 rounded-lg text-[#c1c0b5]/70 hover:text-[#c1c0b5] hover:bg-[#262624]"
                            >
                                <Layers className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Projects</TooltipContent>
                    </Tooltip>
                    <div className="flex-1" />
                    {user && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSettingsOpen(true)}
                                    className="mt-1 h-9 w-9 rounded-lg text-[#c1c0b5]/70 hover:text-[#c1c0b5] hover:bg-[#262624]"
                                >
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Settings</TooltipContent>
                        </Tooltip>
                    )}
                    <div className="pt-2">
                        <UserDropdown user={user} compact onLoginClick={onLoginClick} />
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.aside
                        role="navigation"
                        aria-label="Chat sidebar"
                        initial={{ x: -288, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -288, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed left-0 top-0 z-40 h-full w-[min(288px,100%)] md:w-72 flex flex-col bg-[var(--mar-bg-secondary)] border-r border-[var(--mar-fg-muted)]/30 shadow-xl"
                    >
                        {/* Header */}
                        <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3">
                            <span className="flex items-center gap-1.5">
                                <span className="text-amber-400/90 text-lg">✦</span>
                                <span className="font-normal italic text-lg text-white tracking-tight" style={{ fontFamily: '"Times New Roman", Times, serif' }}>MAR Chat</span>
                            </span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onToggle}
                                        className="h-8 w-8 rounded text-[#c1c0b5]/60 hover:text-[#c1c0b5] hover:bg-[#262624]"
                                    >
                                        <Square className="w-4 h-4 stroke-[1.5]" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Close sidebar</TooltipContent>
                            </Tooltip>
                        </div>

                        {/* + New chat */}
                        <div className="shrink-0 px-3 pb-2">
                            <button
                                type="button"
                                onClick={handleNewChat}
                                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white hover:bg-[#262624] rounded-lg transition-colors text-left"
                            >
                                <Plus className="w-4 h-4 text-[#c1c0b5]/80" />
                                New chat
                            </button>
                        </div>

                        {/* Nav: Chats, Projects, Artifacts */}
                        <nav className="shrink-0 px-3">
                            <div className="flex flex-col gap-0.5">
                                <button
                                    type="button"
                                    aria-current={activeNav === "chats" ? "true" : undefined}
                                    aria-label="Chats"
                                    onClick={() => setActiveNav("chats")}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left min-h-[44px]",
                                        activeNav === "chats" ? "text-[#c1c0b5]" : "text-[#c1c0b5]/80 hover:text-[#c1c0b5] hover:bg-[#262624]"
                                    )}
                                >
                                    <MessageSquare className="w-4 h-4 shrink-0" />
                                    Chats
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveNav("projects")}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                                        activeNav === "projects" ? "text-[#c1c0b5]" : "text-[#c1c0b5]/80 hover:text-[#c1c0b5] hover:bg-[#262624]"
                                    )}
                                >
                                    <FolderOpen className="w-4 h-4 shrink-0" />
                                    Projects
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveNav("artifacts")}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                                        activeNav === "artifacts" ? "text-[#c1c0b5]" : "text-[#c1c0b5]/80 hover:text-[#c1c0b5] hover:bg-[#262624]"
                                    )}
                                >
                                    <LayoutGrid className="w-4 h-4 shrink-0" />
                                    Artifacts
                                </button>
                            </div>
                        </nav>

                        {/* Search bar (chats tab only) */}
                        {activeNav === "chats" && (
                            <div className="shrink-0 px-3 pt-2 pb-1">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#c1c0b5]/40" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search chats..."
                                        className="w-full pl-8 pr-8 py-1.5 text-sm bg-[#262624] border border-[#333] rounded-lg text-[#c1c0b5] placeholder:text-[#c1c0b5]/30 outline-none focus:border-amber-500/40 transition-colors"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#c1c0b5]/40 hover:text-[#c1c0b5]"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="py-2">
                                {activeNav === "chats" && (
                                    <>
                                        <div className="px-1">
                                            {renderConversationList()}

                                            {/* Archived section */}
                                            {archivedConversations.length > 0 && !searchQuery && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowArchived((a) => !a)}
                                                        className="w-full flex items-center gap-2 px-3 py-2 mt-2 text-xs font-medium text-[#c1c0b5]/60 hover:text-[#c1c0b5]"
                                                    >
                                                        <Archive className="w-3.5 h-3.5" />
                                                        Archived ({archivedConversations.length})
                                                        {showArchived ? <ChevronDown className="w-3.5 h-3.5 ml-auto" /> : <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                                                    </button>
                                                    {showArchived && (
                                                        <div className="px-1 space-y-0">
                                                            {archivedConversations.map((conversation) => (
                                                                <div key={conversation.id} className="relative group flex items-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setActiveConversation(conversation.id)}
                                                                        className="flex-1 text-left px-3 py-2 text-sm truncate text-[#c1c0b5]/70 hover:text-[#c1c0b5]"
                                                                    >
                                                                        {truncate(conversation.title, 36)}
                                                                    </button>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-44 bg-[#262624] border-[#333]">
                                                                            <DropdownMenuItem onClick={() => updateConversation(conversation.id, { isArchived: false })}>
                                                                                <ArchiveRestore className="w-4 h-4 mr-2" /> Unarchive
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onClick={() => handleExportConversation(conversation)}>
                                                                                <Download className="w-4 h-4 mr-2" /> Export
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem onClick={() => deleteConversation(conversation.id)} className="text-red-500">
                                                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                                {activeNav === "projects" && (
                                    <>
                                        <p className="px-3 py-1.5 text-xs font-medium text-[#c1c0b5]/50 uppercase tracking-wider">
                                            Projects
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => createProject("New project")}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#c1c0b5]/70 hover:bg-[#262624] hover:text-[#c1c0b5]"
                                        >
                                            <Plus className="w-4 h-4 shrink-0" />
                                            New project
                                        </button>
                                        {activeProjectId && activeConversationId && (
                                            <button
                                                type="button"
                                                onClick={() => addConversationToProject(activeProjectId, activeConversationId)}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#c1c0b5]/70 hover:bg-[#262624] hover:text-[#c1c0b5]"
                                            >
                                                Add current chat to project
                                            </button>
                                        )}
                                        {projects.length > 0 ? (
                                            projects.map((project) => (
                                                <div
                                                    key={project.id}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-2 rounded-lg group",
                                                        activeProjectId === project.id && "bg-[#262624]"
                                                    )}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveProject(project.id)}
                                                        className="flex-1 min-w-0 text-left text-sm text-[#c1c0b5] truncate"
                                                    >
                                                        {project.name}
                                                    </button>
                                                    <span className="text-[10px] text-[#c1c0b5]/40">
                                                        {project.conversationIds.length} chat{project.conversationIds.length !== 1 ? "s" : ""}
                                                    </span>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40 bg-[#262624] border-[#333]">
                                                            <DropdownMenuItem onClick={() => deleteProject(project.id)} className="text-red-500">
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="px-3 py-4 text-xs text-[#c1c0b5]/40">No projects yet</p>
                                        )}
                                    </>
                                )}
                                {activeNav === "artifacts" && (
                                    <>
                                        <p className="px-3 py-1.5 text-xs font-medium text-[#c1c0b5]/50 uppercase tracking-wider">
                                            Artifacts
                                        </p>
                                        {artifacts.length > 0 ? (
                                            artifacts.map((artifact) => (
                                                <button
                                                    key={artifact.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveArtifact(artifact.id);
                                                        setArtifactPanelOpen(true);
                                                    }}
                                                    className={cn(
                                                        "w-full flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg text-left text-sm transition-colors",
                                                        activeArtifactId === artifact.id
                                                            ? "bg-[#262624] text-[#c1c0b5]"
                                                            : "text-[#c1c0b5]/80 hover:bg-[#262624]"
                                                    )}
                                                >
                                                    <span className="truncate w-full font-medium">{artifact.title}</span>
                                                    <span className="text-[10px] text-[#c1c0b5]/50 capitalize">{artifact.type}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="px-3 py-4 text-xs text-[#c1c0b5]/40">No artifacts yet. Ask the AI to create one.</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Footer */}
                        <div className="shrink-0 p-4 border-t border-[#333]">
                            <UserDropdown user={user} onLoginClick={onLoginClick} />
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </TooltipProvider>
    );
}
