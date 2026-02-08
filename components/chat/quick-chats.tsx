"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { QUICK_CHAT_TOPICS } from "@/lib/data/quick-chats";
import { cn } from "@/lib/utils";

interface QuickChatsProps {
    onSelectPrompt: (text: string) => void;
}

export function QuickChats({ onSelectPrompt }: QuickChatsProps) {
    const [openId, setOpenId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) return;
        import("gsap").then(({ gsap }) => {
            const btns = containerRef.current?.querySelectorAll(".quick-chat-btn");
            if (btns?.length) {
                gsap.fromTo(btns, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out", delay: 0.2 });
            }
        });
    }, []);

    return (
        <div ref={containerRef} className="flex flex-wrap items-center justify-center gap-2">
            {QUICK_CHAT_TOPICS.map((topic) => {
                const Icon = topic.icon;
                const isOpen = openId === topic.id;

                return (
                    <div key={topic.id} className="relative">
                        <div className="relative rounded-xl border border-[#333] p-[1px]">
                            <GlowingEffect
                                spread={24}
                                glow
                                disabled={false}
                                proximity={48}
                                inactiveZone={0.3}
                                borderWidth={1}
                            />
                            <button
                                type="button"
                                onClick={() => setOpenId(isOpen ? null : topic.id)}
                                className={cn("quick-chat-btn",
                                    "relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                    "bg-[#1e1e1c] text-[#c1c0b5]/90 border border-transparent",
                                    "hover:bg-[#262624] hover:text-[#c1c0b5]"
                                )}
                            >
                                <Icon className="w-4 h-4 shrink-0 text-[#c1c0b5]/70" />
                                {topic.label}
                            </button>
                        </div>

                        <AnimatePresence>
                            {isOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        aria-hidden
                                        onClick={() => setOpenId(null)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-[#333] bg-[#1e1e1c] shadow-xl overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-[#c1c0b5]/70" />
                                                <span className="text-sm font-semibold text-[#c1c0b5]">
                                                    {topic.label}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setOpenId(null)}
                                                className="p-1 rounded-lg text-[#c1c0b5]/50 hover:text-[#c1c0b5] hover:bg-[#262624]"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <ul className="py-1 max-h-64 overflow-y-auto">
                                            {topic.prompts.map((prompt, i) => (
                                                <li key={i}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onSelectPrompt(prompt);
                                                            setOpenId(null);
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-sm text-[#c1c0b5]/90 hover:bg-[#262624] transition-colors border-b border-[#333]/50 last:border-0"
                                                    >
                                                        {prompt}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
