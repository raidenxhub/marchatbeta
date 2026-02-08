"use client";

import { useState } from "react";
import { ChevronDown, Check, Zap, Brain, Microscope } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { MODELS, ModelId } from "@/lib/types/chat";
import { cn } from "@/lib/utils";

const MODEL_ICONS: Record<ModelId, React.ReactNode> = {
    "mar-beta": <Zap className="w-4 h-4 text-amber-400" />,
    "mar-pro": <Brain className="w-4 h-4 text-blue-400" />,
    "mar-deep": <Microscope className="w-4 h-4 text-violet-400" />,
};

const CAPABILITY_BARS: Record<ModelId, { speed: number; intelligence: number; context: number }> = {
    "mar-beta": { speed: 5, intelligence: 3, context: 4 },
    "mar-pro": { speed: 3, intelligence: 5, context: 4 },
    "mar-deep": { speed: 2, intelligence: 5, context: 5 },
};

function CapabilityBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#f5f5dc]/50 w-16 shrink-0">{label}</span>
            <div className="flex gap-0.5 flex-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-1 flex-1 rounded-full transition-colors",
                            i < value ? color : "bg-[#333]"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

interface ModelSelectorProps {
    selectedModel: ModelId;
    onModelChange: (model: ModelId) => void;
    extendedThinking?: boolean;
    onExtendedThinkingChange?: (value: boolean) => void;
    disabled?: boolean;
    compact?: boolean;
}

export function ModelSelector({
    selectedModel,
    onModelChange,
    extendedThinking = false,
    onExtendedThinkingChange,
    disabled = false,
    compact = false,
}: ModelSelectorProps) {
    const [open, setOpen] = useState(false);
    const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];
    const displayLabel = extendedThinking
        ? `${currentModel.name} Extended`
        : currentModel.name;

    const handleModelSelect = (modelId: ModelId) => {
        onModelChange(modelId);
        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "rounded-lg font-mono text-sm border-0 bg-transparent",
                        "text-[#f5f5dc]/80 hover:text-[#f5f5dc] hover:bg-[#262626]/50",
                        "transition-all duration-200",
                        compact ? "h-8 px-2 gap-1 text-xs" : "h-9 px-3 gap-2"
                    )}
                >
                    {MODEL_ICONS[selectedModel]}
                    <span className="font-medium tracking-tight truncate max-w-[140px]">
                        {displayLabel}
                    </span>
                    <ChevronDown className={cn("text-[#f5f5dc]/50 shrink-0", compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-80 p-0 bg-[#1a1a1a] border-[#333] overflow-hidden">
                <div className="p-1.5">
                    {MODELS.map((model) => {
                        const caps = CAPABILITY_BARS[model.id];
                        return (
                            <button
                                key={model.id}
                                type="button"
                                onClick={() => handleModelSelect(model.id)}
                                className={cn(
                                    "w-full flex flex-col items-start gap-2 p-3 rounded-lg cursor-pointer text-left transition-colors",
                                    "hover:bg-[#262626] focus:bg-[#262626] focus:outline-none",
                                    selectedModel === model.id && "bg-[#262626] ring-1 ring-inset ring-[#444]"
                                )}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    {MODEL_ICONS[model.id]}
                                    <span className="font-semibold text-sm text-[#f5f5dc] flex-1">
                                        {model.name}
                                    </span>
                                    {model.features && (
                                        <div className="flex gap-1">
                                            {model.features.slice(0, 3).map((f) => (
                                                <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#f5f5dc]/10 text-[#f5f5dc]/60">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {selectedModel === model.id && (
                                        <Check className="w-4 h-4 text-blue-500 shrink-0" />
                                    )}
                                </div>
                                <p className="text-xs text-[#f5f5dc]/60">
                                    {model.description}
                                </p>
                                {/* Capability indicators */}
                                <div className="w-full space-y-1 mt-1">
                                    <CapabilityBar label="Speed" value={caps.speed} color="bg-green-400/70" />
                                    <CapabilityBar label="Intelligence" value={caps.intelligence} color="bg-blue-400/70" />
                                    <CapabilityBar label="Context" value={caps.context} color="bg-violet-400/70" />
                                </div>
                            </button>
                        );
                    })}
                </div>

                <Separator className="bg-[#333]" />

                <div className="p-1.5">
                    <div
                        className={cn(
                            "flex items-center justify-between gap-3 p-3 rounded-lg",
                            "hover:bg-[#262626] focus-within:bg-[#262626]"
                        )}
                    >
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-semibold text-sm text-[#f5f5dc]">
                                Extended thinking
                            </span>
                            <p className="text-xs text-[#f5f5dc]/60">
                                Think longer for complex tasks
                            </p>
                        </div>
                        {onExtendedThinkingChange && (
                            <Switch
                                checked={extendedThinking}
                                onCheckedChange={onExtendedThinkingChange}
                                className="shrink-0"
                            />
                        )}
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
