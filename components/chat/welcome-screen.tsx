"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { QuickChats } from "./quick-chats";
import type { ReactNode } from "react";

const VISIT_KEY = "mar-visit-count";

function getVisitCount(): number {
    if (typeof window === "undefined") return 0;
    try {
        const v = localStorage.getItem(VISIT_KEY);
        const n = parseInt(v ?? "0", 10);
        localStorage.setItem(VISIT_KEY, String(n + 1));
        return n + 1;
    } catch {
        return 1;
    }
}

function getWelcomeTitle(visitCount: number): string {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;

    // Return-count based (higher priority for power users)
    if (visitCount > 100) return "Still here?";
    if (visitCount > 75) return "Dedicated.";
    if (visitCount > 50) return "You're a regular.";
    if (visitCount > 40) return "Can't stay away.";
    if (visitCount > 30) return "Back for more.";
    if (visitCount > 25) return "Here we go again.";
    if (visitCount > 20) return "Welcome back, again.";
    if (visitCount > 15) return "You know the drill.";
    if (visitCount > 10) return "Back again?";
    if (visitCount > 8) return "Missed me?";
    if (visitCount > 5) return "Back at it!";
    if (visitCount > 4) return "Good to see you.";
    if (visitCount > 3) return "Nice to see you again.";
    if (visitCount > 2) return "Welcome back.";

    // First or second visit
    if (visitCount <= 1) {
        if (hour >= 0 && hour < 5) return "Moonlit chat?";
        if (hour < 6) return "Early riser?";
        if (hour < 12) return "Good morning";
        if (hour < 14) return "Good afternoon";
        if (hour < 17) return "Afternoon.";
        if (hour < 20) return "Good evening";
        if (hour < 23) return "Evening.";
        return "Good evening";
    }

    if (hour >= 0 && hour < 5) return "Moonlit chat?";
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function getWelcomeSubtitle(visitCount: number): string | null {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;

    if (visitCount > 30) return null;
    if (visitCount > 15) return "Pick up where you left off.";
    if (visitCount > 5) return "How can I help?";
    if (visitCount > 1) return null;
    if (hour >= 0 && hour < 5) return "Burning the midnight oil?";
    if (hour < 6) return "Early bird.";
    if (hour < 12) return "Hope you slept well.";
    if (hour < 14) return "Ready for the afternoon?";
    if (hour < 17) return isWeekend ? "Weekend vibes." : "Making progress?";
    if (hour < 20) return "Wind-down mode?";
    if (hour < 23) return "Night owl.";
    return "Still up?";
}

interface WelcomeScreenProps {
    onSelectPrompt: (prompt: string) => void;
    incognitoMode?: boolean;
    children?: ReactNode;
}

export function WelcomeScreen({
    onSelectPrompt,
    incognitoMode = false,
    children,
}: WelcomeScreenProps) {
    const [visitCount, setVisitCount] = useState(1);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const iconRef = useRef<HTMLSpanElement>(null);
    const title = getWelcomeTitle(visitCount);
    const subtitle = getWelcomeSubtitle(visitCount);

    useEffect(() => {
        setVisitCount(getVisitCount());
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        import("gsap").then(({ gsap }) => {
            if (iconRef.current) {
                gsap.fromTo(
                    iconRef.current,
                    { opacity: 0, rotate: -45, scale: 0.6 },
                    { opacity: 1, rotate: 0, scale: 1, duration: 0.8, ease: "power2.out" }
                );
            }
            if (titleRef.current) {
                gsap.fromTo(titleRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.15, ease: "power2.out" });
            }
            if (subtitleRef.current) {
                gsap.fromTo(subtitleRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.35, ease: "power2.out" });
            }
        });
    }, [visitCount]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
            <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-8">
                {/* 1. Time-based welcome */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center"
                >
                    {incognitoMode ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl text-orange-500">✦</span>
                                <h1 className="text-3xl md:text-4xl font-medium text-[#c1c0b5] tracking-tight">
                                    You&apos;re incognito
                                </h1>
                            </div>
                            <p className="text-sm text-[#c1c0b5]/60 max-w-lg text-center">
                                Incognito chats aren&apos;t saved to history or used to train models.{" "}
                                <a href="https://gomarai.com/privacy" className="text-[#c1c0b5]/70 hover:text-[#c1c0b5] hover:underline">
                                    Learn more about how your data is used.
                                </a>
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <span ref={iconRef} className="inline-block text-2xl text-amber-400/90" aria-hidden>✦</span>
                            <h1 ref={titleRef} className="text-4xl md:text-5xl font-medium text-[#f5f5dc] tracking-tight">
                                {title}
                            </h1>
                            {subtitle && (
                                <p ref={subtitleRef} className="text-sm text-[#c1c0b5]/60">
                                    {subtitle}
                                </p>
                            )}
                            <p className="text-lg md:text-xl text-[#c1c0b5]/80 font-medium mt-2">
                                What can I help with?
                            </p>
                            <p className="text-sm text-[#c1c0b5]/50 mt-1">
                                Chat with MAR
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* 2. Message box (passed from parent) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="w-full"
                >
                    {children}
                </motion.div>

                {/* 3. Quick chats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="w-full flex justify-center"
                >
                    <QuickChats onSelectPrompt={onSelectPrompt} />
                </motion.div>

                {/* Footer: terms, privacy, help, report */}
                <footer className="mt-8 flex flex-col items-center gap-3 max-w-lg text-center">
                    <p className="text-xs text-[#c1c0b5]/40">
                        By using MAR you agree to our{" "}
                        <a href="https://gomarai.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#c1c0b5]/60">Terms</a>
                        {" "}and{" "}
                        <a href="https://gomarai.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#c1c0b5]/60">Privacy</a>.
                    </p>
                    <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#c1c0b5]/40">
                        <a href="https://gomarai.com/support" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#c1c0b5]/60">Help</a>
                        <a href="https://gomarai.com/report" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#c1c0b5]/60">Report an issue</a>
                    </nav>
                </footer>
            </div>
        </div>
    );
}
