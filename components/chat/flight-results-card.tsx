"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { SafeImage } from "@/components/ui/safe-image";
import type { FlightResultsData } from "@/lib/types/chat";

interface FlightResultsCardProps {
    data: FlightResultsData;
}

function formatPrice(price: string | number): string {
    if (typeof price === "number") return `$${price}`;
    if (typeof price === "string" && /^\d+$/.test(price)) return `$${price}`;
    return String(price);
}

export const FlightResultsCard = memo(function FlightResultsCard({ data }: FlightResultsCardProps) {
    const { flights, search_url } = data;
    if (!flights?.length) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="my-4 rounded-xl border border-[#333] bg-[#1a1a1a] overflow-hidden shadow-lg"
        >
            <div className="px-4 py-2 border-b border-[#333] text-xs font-medium text-[#c1c0b5]/70 uppercase tracking-wider">
                Flights
            </div>
            <div className="divide-y divide-[#333]">
                {flights.map((flight, idx) => (
                    <a
                        key={idx}
                        href={search_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 px-4 py-4 hover:bg-[#222] transition-colors"
                    >
                        {/* Airline logo + name */}
                        <div className="flex items-center gap-3 min-w-[140px] shrink-0">
                            {flight.airline_logo ? (
                                <SafeImage
                                    src={flight.airline_logo}
                                    alt={flight.airline ?? "Airline"}
                                    className="w-10 h-10 object-contain rounded shrink-0"
                                    fallback={
                                        <div className="w-10 h-10 rounded bg-[#333] flex items-center justify-center text-xs font-medium text-[#c1c0b5] shrink-0">
                                            {flight.airline?.slice(0, 2) || "—"}
                                        </div>
                                    }
                                />
                            ) : (
                                <div className="w-10 h-10 rounded bg-[#333] flex items-center justify-center text-xs font-medium text-[#c1c0b5] shrink-0">
                                    {flight.airline?.slice(0, 2) || "—"}
                                </div>
                            )}
                            <span className="text-sm font-medium text-[#f5f5dc]">{flight.airline || "Unknown"}</span>
                        </div>

                        {/* Departure time */}
                        <div className="min-w-[100px] text-sm text-[#c1c0b5]">
                            {flight.departure ?? "—"}
                        </div>

                        {/* Arrival time */}
                        <div className="min-w-[100px] text-sm text-[#c1c0b5]">
                            {flight.arrival ?? "—"}
                        </div>

                        {/* Duration */}
                        <div className="min-w-[70px] text-sm text-[#c1c0b5]">
                            {flight.duration}
                        </div>

                        {/* Price - green */}
                        <div className="min-w-[60px] text-sm font-semibold text-emerald-400">
                            {formatPrice(flight.price)}
                        </div>

                        {/* Book link */}
                        <span className="ml-auto text-sm text-[#c1c0b5] hover:text-[#f5f5dc] underline underline-offset-2">
                            Book Here
                        </span>
                    </a>
                ))}
            </div>
        </motion.div>
    );
});
