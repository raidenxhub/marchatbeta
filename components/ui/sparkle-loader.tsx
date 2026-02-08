"use client";

import { cn } from "@/lib/utils";

interface SparkleLoaderProps {
    className?: string;
    size?: "sm" | "md";
    /** When false, shows only the ✦ icon (no spinner) - for completed states */
    animate?: boolean;
}

/** MAR sparkle (✦) with optional spinning circle - for loading vs completed states */
export function SparkleLoader({ className, size = "md", animate = true }: SparkleLoaderProps) {
    const dim = size === "sm" ? 48 : 64;
    const strokeW = size === "sm" ? 2.5 : 3;
    const r = (dim - strokeW) / 2 - 2;

    return (
        <div className={cn("relative inline-flex items-center justify-center shrink-0", className)} style={{ minWidth: dim, minHeight: dim }}>
            {animate ? (
                <div
                    className="absolute inset-0 flex items-center justify-center animate-sparkle-spin"
                    aria-hidden
                >
                    <svg
                        width={dim}
                        height={dim}
                        viewBox={`0 0 ${dim} ${dim}`}
                        className="text-[#c1c0b5]/60"
                    >
                        <circle
                            cx={dim / 2}
                            cy={dim / 2}
                            r={r}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={strokeW}
                            strokeOpacity={0.6}
                            strokeDasharray={`${r * 2.2} ${r * 5}`}
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            ) : null}
            <span
                className={cn(
                    "relative z-10 text-amber-400/90",
                    size === "sm" ? "text-2xl" : "text-3xl"
                )}
                aria-hidden
            >
                ✦
            </span>
        </div>
    );
}
