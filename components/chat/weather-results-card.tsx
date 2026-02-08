"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { WeatherResultsData } from "@/lib/types/chat";

interface WeatherResultsCardProps {
    data: WeatherResultsData;
}

export const WeatherResultsCard = memo(function WeatherResultsCard({ data }: WeatherResultsCardProps) {
    const { current, forecast_summary, daily_forecast } = data;
    if (!current) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="my-4 rounded-xl border border-[#333] bg-[#1a1a1a] overflow-hidden shadow-lg"
        >
            <div className="px-4 py-2 border-b border-[#333] text-xs font-medium text-[#c1c0b5]/70 uppercase tracking-wider">
                Weather
            </div>
            <div className="divide-y divide-[#333]">
                {/* Current */}
                <div className="px-4 py-4 flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-semibold text-emerald-400">{current.temperature}</span>
                        <span className="text-sm text-[#c1c0b5]">{current.condition}</span>
                    </div>
                    <div className="text-sm text-[#c1c0b5]">Wind: {current.wind}</div>
                    <div className="text-sm text-[#c1c0b5]">Day: {current.isDay}</div>
                </div>
                {/* Forecast summary */}
                {forecast_summary && (forecast_summary.average_temp_next_24h || forecast_summary.max_precipitation_probability) && (
                    <div className="px-4 py-3 flex flex-wrap gap-4 text-sm text-[#c1c0b5]">
                        {forecast_summary.average_temp_next_24h && (
                            <span>24h avg: {forecast_summary.average_temp_next_24h}</span>
                        )}
                        {forecast_summary.max_precipitation_probability != null && (
                            <span>Max precip: {forecast_summary.max_precipitation_probability}</span>
                        )}
                    </div>
                )}
                {/* Daily forecast table */}
                {daily_forecast && daily_forecast.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#333] text-left text-[#c1c0b5]/70">
                                    <th className="px-4 py-2 font-medium">Date</th>
                                    <th className="px-4 py-2 font-medium">High</th>
                                    <th className="px-4 py-2 font-medium">Low</th>
                                    <th className="px-4 py-2 font-medium">Condition</th>
                                </tr>
                            </thead>
                            <tbody>
                                {daily_forecast.map((day, idx) => (
                                    <tr key={idx} className="border-b border-[#333]/50 hover:bg-[#222]">
                                        <td className="px-4 py-3 text-[#c1c0b5]">{day.date}</td>
                                        <td className="px-4 py-3 text-emerald-400 font-medium">{day.max_temp}</td>
                                        <td className="px-4 py-3 text-[#c1c0b5]">{day.min_temp}</td>
                                        <td className="px-4 py-3 text-[#c1c0b5]">{day.condition}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
});
