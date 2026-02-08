"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-4 px-4 py-6"
        >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#f5f5dc] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#0d0d0d]" />
            </div>

            {/* Typing Dots */}
            <div className="flex items-center gap-1 px-4 py-3 rounded-2xl bg-[#1a1a1a] border border-[#333]">
                <span className="typing-dot bg-[#f5f5dc]/50" />
                <span className="typing-dot bg-[#f5f5dc]/50" />
                <span className="typing-dot bg-[#f5f5dc]/50" />
            </div>
        </motion.div>
    );
}
