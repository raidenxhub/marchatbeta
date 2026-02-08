"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Code2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleContentProps {
    title: string;
    type?: "code" | "document" | "python" | "result";
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export function CollapsibleContent({
    title,
    type = "document",
    children,
    defaultOpen = false,
}: CollapsibleContentProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const Icon = {
        code: Code2,
        document: FileText,
        python: Terminal,
        result: FileText,
    }[type];

    return (
        <div className="my-4 rounded-xl border border-[#333] overflow-hidden bg-[#0a0a0a]">
            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#1a1a1a] transition-colors text-[#f5f5dc]/80 hover:text-[#f5f5dc]"
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#f5f5dc]/40" />
                    <span className="text-sm font-medium font-mono truncate max-w-[200px]">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest opacity-30">
                        {isOpen ? "Collapse" : "Expand"}
                    </span>
                    {isOpen ? (
                        <ChevronDown className="w-4 h-4 opacity-50" />
                    ) : (
                        <ChevronRight className="w-4 h-4 opacity-50" />
                    )}
                </div>
            </button>

            {/* Content */}
            {isOpen && (
                <div className="border-t border-[#333] animate-in fade-in duration-300">
                    {children}
                </div>
            )}
        </div>
    );
}
