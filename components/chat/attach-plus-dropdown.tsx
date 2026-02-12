"use client";

import { useRef, useCallback } from "react";
import { Plus, Paperclip, Camera, FolderOpen, Globe, Pen, Brain, Search, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuSeparator,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/lib/store/chat-store";
import { useSettingsStore } from "@/lib/store/settings-store";
import type { ResponseStyle } from "@/lib/types/chat";
import { cn } from "@/lib/utils";

const RESPONSE_STYLES: { value: ResponseStyle; label: string }[] = [
    { value: "normal", label: "Normal" },
    { value: "learning", label: "Learning" },
    { value: "concise", label: "Concise" },
    { value: "explanatory", label: "Explanatory" },
    { value: "formal", label: "Formal" },
];

interface AttachPlusDropdownProps {
    onFilesAdded: (files: File[]) => void;
    disabled?: boolean;
    className?: string;
}

export function AttachPlusDropdown({
    onFilesAdded,
    disabled = false,
    className,
}: AttachPlusDropdownProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { extendedThinking, setExtendedThinking, modelMode, setModelMode } = useSettingsStore();
    const {
        preferences,
        setPreferences,
        projects,
        createProject,
        addConversationToProject,
        activeConversationId,
        getActiveConversation,
    } = useChatStore();

    const handleTakeScreenshot = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            });
            const track = stream.getVideoTracks()[0];
            let blob: Blob;
            if (typeof ImageCapture !== "undefined") {
                const capture = new ImageCapture(track);
                blob = await capture.takePhoto();
            } else {
                const video = document.createElement("video");
                video.srcObject = stream;
                await video.play();
                await new Promise<void>((resolve) => {
                    if (video.readyState >= 2) resolve();
                    else video.onloadeddata = () => resolve();
                });
                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Canvas not supported");
                ctx.drawImage(video, 0, 0);
                blob = await new Promise<Blob>((resolve, reject) =>
                    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
                );
            }
            track.stop();
            stream.getTracks().forEach((t) => t.stop());
            const file = new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" });
            onFilesAdded([file]);
            toast.success("Screenshot captured");
        } catch (err) {
            if ((err as Error).name === "NotAllowedError") {
                toast.error("Screenshot cancelled");
            } else {
                toast.error("Screenshot not supported in this browser");
            }
        }
    }, [onFilesAdded]);

    const handleAddToProject = (projectId: string) => {
        const convId = activeConversationId || getActiveConversation()?.id;
        if (!convId) {
            toast.info("Start a conversation first");
            return;
        }
        addConversationToProject(projectId, convId);
        toast.success("Added to project");
    };

    const handleCreateProject = () => {
        const name = prompt("Project name:");
        if (!name?.trim()) return;
        const id = createProject(name.trim());
        const convId = activeConversationId || getActiveConversation()?.id;
        if (convId) addConversationToProject(id, convId);
        toast.success("Project created and conversation added");
    };

    return (
        <>
            <input
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.doc,.docx,.svg,.csv,.json,.xml,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                    if (e.target.files) {
                        onFilesAdded(Array.from(e.target.files));
                    }
                }}
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("shrink-0 rounded-xl text-[#c1c0b5]/50 hover:text-[#c1c0b5] hover:bg-[#262624]", className)}
                        disabled={disabled}
                        aria-label="Attach files or images"
                    >
                        <Plus className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    side="bottom"
                    className="min-w-[200px] rounded-xl border-[#333] bg-[#1e1e1c] p-1 text-[#c1c0b5]"
                >
                    <DropdownMenuItem
                        className="cursor-pointer rounded-lg focus:bg-[#262624] focus:text-[#c1c0b5] min-h-[44px]"
                        onSelect={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="mr-2 h-4 w-4 shrink-0" />
                        Add files or photos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="cursor-pointer rounded-lg focus:bg-[#262624] focus:text-[#c1c0b5] min-h-[44px]"
                        onSelect={handleTakeScreenshot}
                    >
                        <Camera className="mr-2 h-4 w-4 shrink-0" />
                        Take a screenshot
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer rounded-lg focus:bg-[#262624] focus:text-[#c1c0b5] min-h-[44px]">
                            <FolderOpen className="mr-2 h-4 w-4 shrink-0" />
                            Add to project
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent
                            className="min-w-[180px] rounded-xl border-[#333] bg-[#1e1e1c] p-1"
                            alignOffset={-4}
                        >
                            {projects.length === 0 ? (
                                <DropdownMenuItem
                                    className="cursor-pointer rounded-lg focus:bg-[#262624]"
                                    onSelect={handleCreateProject}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create new project
                                </DropdownMenuItem>
                            ) : (
                                <>
                                    {projects.map((p) => (
                                        <DropdownMenuItem
                                            key={p.id}
                                            className="cursor-pointer rounded-lg focus:bg-[#262624]"
                                            onSelect={() => handleAddToProject(p.id)}
                                        >
                                            {p.name}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator className="bg-[#333]" />
                                    <DropdownMenuItem
                                        className="cursor-pointer rounded-lg focus:bg-[#262624]"
                                        onSelect={handleCreateProject}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create & edit projects
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator className="bg-[#333]" />
                    <DropdownMenuItem
                        onSelect={(e) => { e.preventDefault(); setPreferences({ webSearchEnabled: !(preferences.webSearchEnabled ?? false) }); }}
                        className="flex cursor-pointer rounded-lg focus:bg-[#262624] focus:text-[#c1c0b5] min-h-[44px]"
                    >
                        <Globe className="mr-2 h-4 w-4 shrink-0" />
                        Web search
                        {(preferences.webSearchEnabled ?? false) && <Check className="ml-auto h-4 w-4 shrink-0 text-blue-400" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={(e) => { e.preventDefault(); setExtendedThinking(!extendedThinking); }}
                        className="flex cursor-pointer rounded-lg focus:bg-[#262624] focus:text-[#c1c0b5] min-h-[44px]"
                    >
                        <Brain className="mr-2 h-4 w-4 shrink-0" />
                        Extended thinking
                        {extendedThinking && <Check className="ml-auto h-4 w-4 shrink-0 text-blue-400" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={(e) => { e.preventDefault(); setModelMode(modelMode === "deep-research" ? "standard" : "deep-research"); }}
                        className="flex cursor-pointer rounded-lg focus:bg-[#262624] focus:text-[#c1c0b5] min-h-[44px]"
                    >
                        <Search className="mr-2 h-4 w-4 shrink-0" />
                        Deep research
                        {modelMode === "deep-research" && <Check className="ml-auto h-4 w-4 shrink-0 text-blue-400" />}
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer rounded-lg focus:bg-[#262624] focus:text-[#c1c0b5] min-h-[44px]">
                            <Pen className="mr-2 h-4 w-4 shrink-0" />
                            Use style
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent
                            className="min-w-[180px] rounded-xl border-[#333] bg-[#1e1e1c] p-1"
                            alignOffset={-4}
                        >
                            <DropdownMenuRadioGroup
                                value={preferences.responseStyle ?? "normal"}
                                onValueChange={(v) =>
                                    setPreferences({ responseStyle: v as ResponseStyle })
                                }
                            >
                                {RESPONSE_STYLES.map((s) => (
                                    <DropdownMenuRadioItem
                                        key={s.value}
                                        value={s.value}
                                        className="cursor-pointer rounded-lg focus:bg-[#262624] focus:text-[#c1c0b5] data-[state=checked]:text-blue-400"
                                    >
                                        {s.label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
