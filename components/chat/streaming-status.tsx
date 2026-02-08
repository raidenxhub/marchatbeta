"use client";

import { memo } from "react";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { cn } from "@/lib/utils";

interface StreamingStatusProps {
    isStreaming: boolean;
    hasContent: boolean;
    reasoning: string;
    flightCount: number;
    hotelCount: number;
    hasWeather: boolean;
}

const TOOL_LABELS: Record<string, string> = {
    "Using google_search…": "Searching the web…",
    "Using search_flights…": "Searching for flights…",
    "Using search_hotels…": "Searching for hotels…",
    "Using get_current_weather…": "Fetching weather…",
    "Using create_artifact…": "Creating artifact…",
};

function getStatusLabel(
    reasoning: string,
    flightCount: number,
    hotelCount: number,
    hasWeather: boolean,
    hasContent: boolean
): string {
    if (hasContent) return "Writing…";
    if (flightCount > 0) return `Found ${flightCount} flight${flightCount !== 1 ? "s" : ""}`;
    if (hotelCount > 0) return `Found ${hotelCount} hotel${hotelCount !== 1 ? "s" : ""}`;
    if (hasWeather) return "Weather loaded";
    for (const [key, label] of Object.entries(TOOL_LABELS)) {
        if (reasoning.includes(key)) return label;
    }
    if (reasoning.trim()) return "Searching…";
    return "Thinking…";
}

export const StreamingStatus = memo(function StreamingStatus({
    isStreaming,
    hasContent,
    reasoning,
    flightCount,
    hotelCount,
    hasWeather,
}: StreamingStatusProps) {
    if (!isStreaming) return null;

    const label = getStatusLabel(reasoning, flightCount, hotelCount, hasWeather, hasContent);

    return (
        <div
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#c1c0b5]/70"
            role="status"
            aria-live="polite"
            aria-label={`Status: ${label}`}
        >
            <span className={cn("inline-block h-1.5 w-1.5 rounded-full bg-emerald-500/80", hasContent && "animate-pulse")} />
            <TextShimmer duration={1.5} spread={1} className="text-sm font-medium">
                {label}
            </TextShimmer>
        </div>
    );
});
