"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { SafeImage } from "@/components/ui/safe-image";
import type { HotelResultsData } from "@/lib/types/chat";

interface HotelResultsCardProps {
    data: HotelResultsData;
}

function formatPrice(p: unknown): string {
    if (typeof p === "number") return `$${p}`;
    if (typeof p === "string" && p) return p;
    return "—";
}

export const HotelResultsCard = memo(function HotelResultsCard({ data }: HotelResultsCardProps) {
    const { hotels, search_url } = data;
    if (!hotels?.length) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="my-4 rounded-xl border border-[#333] bg-[#1a1a1a] overflow-hidden shadow-lg"
        >
            <div className="px-4 py-2 border-b border-[#333] text-xs font-medium text-[#c1c0b5]/70 uppercase tracking-wider">
                Hotels
            </div>
            <div className="divide-y divide-[#333]">
                {hotels.map((hotel, idx) => (
                    <a
                        key={idx}
                        href={hotel.link || search_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 px-4 py-4 hover:bg-[#222] transition-colors"
                    >
                        {hotel.image ? (
                            <SafeImage
                                src={hotel.image}
                                alt={hotel.name}
                                className="w-16 h-16 object-cover rounded shrink-0"
                                fallback={<div className="w-16 h-16 rounded bg-[#333] flex items-center justify-center shrink-0 text-[#c1c0b5]/40 text-xs">—</div>}
                            />
                        ) : (
                            <div className="w-16 h-16 rounded bg-[#333] flex items-center justify-center shrink-0 text-[#c1c0b5]/40 text-xs">—</div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-[#f5f5dc]">{hotel.name}</div>
                            {hotel.rating != null && (
                                <div className="text-xs text-[#c1c0b5]">Rating: {String(hotel.rating)}</div>
                            )}
                        </div>
                        <div className="text-sm font-semibold text-emerald-400 shrink-0">
                            {formatPrice(hotel.price ?? hotel.total_price)}
                        </div>
                        <span className="text-sm text-[#c1c0b5] hover:text-[#f5f5dc] underline underline-offset-2 shrink-0">
                            View
                        </span>
                    </a>
                ))}
            </div>
        </motion.div>
    );
});
