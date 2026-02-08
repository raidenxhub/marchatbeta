import { SchemaType } from "@google/generative-ai";
import { ToolImplementation } from "./registry";

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

function parseDate(val: unknown): string | null {
    if (!val || typeof val !== "string") return null;
    const s = val.trim();
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return s;
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    return null;
}

export const flightSearchTool: ToolImplementation = {
    declaration: {
        name: "search_flights",
        description: "Search for flights. Returns options displayed as cards. Do NOT type out airlines, times, or prices—only add 1–2 sentences like 'These are the available flights for your dates. Do you have any preference?'",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                departure_id: {
                    type: SchemaType.STRING,
                    description: "Departure airport code (e.g., SFO, JFK, LHR)",
                },
                arrival_id: {
                    type: SchemaType.STRING,
                    description: "Arrival airport code (e.g., LAX, CDG, HND)",
                },
                outbound_date: {
                    type: SchemaType.STRING,
                    description: "Date of departure in YYYY-MM-DD format (e.g. 2026-02-12). Required for accurate results.",
                },
                return_date: {
                    type: SchemaType.STRING,
                    description: "Date of return in YYYY-MM-DD format (e.g. 2026-02-19). Required for round-trip.",
                },
            },
            required: ["departure_id", "arrival_id"],
        },
    },
    execute: async (args: { departure_id: string; arrival_id: string; outbound_date?: string; return_date?: string }) => {
        if (!SERPAPI_KEY) return { error: "SERPAPI_API_KEY not configured" };

        try {
            const outbound = parseDate(args.outbound_date) || new Date(Date.now() + 86400000).toISOString().split("T")[0];
            const returnDate = args.return_date ? parseDate(args.return_date) : null;

            const params = new URLSearchParams({
                engine: "google_flights",
                departure_id: String(args.departure_id || "").trim().toUpperCase(),
                arrival_id: String(args.arrival_id || "").trim().toUpperCase(),
                outbound_date: outbound,
                currency: "USD",
                hl: "en",
                gl: "us",
                deep_search: "true",
                api_key: SERPAPI_KEY,
            });
            if (returnDate) {
                params.append("return_date", returnDate);
                params.append("type", "1"); // Round trip
            } else {
                params.append("type", "2"); // One-way (no return date required)
            }

            console.log(`[Flight Tool] Searching: ${params.toString()}`);

            const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
            if (!response.ok) {
                return { error: `SerpAPI error: ${response.status} ${response.statusText}` };
            }
            const data = await response.json();

            if (data.error) {
                return { error: typeof data.error === "string" ? data.error : "Search failed" };
            }

            if (data.search_metadata?.status === "Error") {
                return { error: "Flight search temporarily unavailable. Please try again in a moment." };
            }

            const rawFlights =
                Array.isArray(data.best_flights) && data.best_flights.length > 0
                    ? data.best_flights
                    : Array.isArray(data.other_flights)
                    ? data.other_flights
                    : [];
            const searchUrl = data.search_metadata?.google_flights_url || "https://www.google.com/travel/flights";

            const best_flights = rawFlights.slice(0, 5).map((flight: Record<string, unknown>) => {
                const segments = Array.isArray(flight.flights) ? flight.flights : [];
                const first = segments[0] as Record<string, unknown> | undefined;
                const last = segments[segments.length - 1] as Record<string, unknown> | undefined;
                const depAirport = first?.departure_airport as Record<string, unknown> | undefined;
                const arrAirport = last?.arrival_airport as Record<string, unknown> | undefined;
                const totalMins = typeof flight.total_duration === "number" ? flight.total_duration : 0;

                return {
                    airline: first?.airline ?? flight.airline ?? "Unknown",
                    airline_logo: first?.airline_logo ?? flight.airline_logo ?? null,
                    departure: depAirport?.time ?? null,
                    arrival: arrAirport?.time ?? null,
                    duration: totalMins ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m` : "—",
                    price: flight.price ?? "—",
                    link: searchUrl,
                    booking_token: flight.departure_token ?? null,
                };
            });

            if (best_flights.length === 0) {
                return {
                    error: "No flights found for this route/date. Try different dates or check airport codes (e.g. DMM, FRA).",
                    search_url: searchUrl,
                };
            }

            return {
                flights: best_flights,
                search_url: searchUrl,
                note: "Display logos as images using the airline_logo URL. Link the 'Book' text to the provided search_url.",
            };
        } catch (error) {
            console.error("[Flight Tool] Error:", error);
            return { error: error instanceof Error ? error.message : "Failed to search flights" };
        }
    }
};

export const hotelSearchTool: ToolImplementation = {
    declaration: {
        name: "search_hotels",
        description: "Search for hotels. Returns options displayed as cards. Do NOT type out hotel names, prices, or details—only add 1–2 sentences like 'Here are some hotel options for your dates. Do you have any preference?'",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                q: {
                    type: SchemaType.STRING,
                    description: "City or location to search for hotels (e.g., 'Hotels in Paris')",
                },
                check_in_date: {
                    type: SchemaType.STRING,
                    description: "Check-in date (YYYY-MM-DD)",
                },
                check_out_date: {
                    type: SchemaType.STRING,
                    description: "Check-out date (YYYY-MM-DD)",
                },
            },
            required: ["q"],
        },
    },
    execute: async (args: { q: string; check_in_date?: string; check_out_date?: string }) => {
        if (!SERPAPI_KEY) return { error: "SERPAPI_API_KEY not configured" };

        try {
            const params = new URLSearchParams({
                engine: "google_hotels",
                q: String(args.q || "").trim() || "hotels",
                check_in_date: args.check_in_date || new Date(Date.now() + 86400000).toISOString().split("T")[0],
                check_out_date: args.check_out_date || new Date(Date.now() + 172800000).toISOString().split("T")[0],
                currency: "USD",
                hl: "en",
                gl: "us",
                api_key: SERPAPI_KEY,
            });

            console.log(`[Hotel Tool] Searching: ${params.toString()}`);

            const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
            if (!response.ok) {
                return { error: `SerpAPI error: ${response.status} ${response.statusText}` };
            }
            const data = await response.json();

            if (data.error) {
                return { error: typeof data.error === "string" ? data.error : "Search failed" };
            }

            if (data.search_metadata?.status === "Error") {
                return { error: "Hotel search temporarily unavailable. Please try again." };
            }

            const rawProperties = Array.isArray(data.properties) ? data.properties : [];
            const searchUrl = data.search_metadata?.google_hotels_url || "https://www.google.com/travel/hotels";

            const hotels = rawProperties.slice(0, 5).map((hotel: Record<string, unknown>) => {
                const images = Array.isArray(hotel.images) ? hotel.images : [];
                const img0 = images[0] as Record<string, unknown> | undefined;
                const ratePerNight = hotel.rate_per_night as Record<string, unknown> | undefined;
                const totalRate = hotel.total_rate as Record<string, unknown> | undefined;
                const amenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];

                return {
                    name: hotel.name ?? "Unknown",
                    description: hotel.description ?? "",
                    image: img0?.original_image ?? img0?.thumbnail ?? null,
                    rating: hotel.overall_rating ?? hotel.extracted_hotel_class ?? null,
                    price: ratePerNight?.lowest ?? ratePerNight?.extracted_lowest ?? null,
                    total_price: totalRate?.lowest ?? totalRate?.extracted_lowest ?? null,
                    amenities: amenities.slice(0, 3).join(", ") || null,
                    link: hotel.link ?? null,
                    gps: hotel.gps_coordinates ?? null,
                };
            });

            return {
                hotels,
                search_url: searchUrl,
            };
        } catch (error) {
            console.error("[Hotel Tool] Error:", error);
            return { error: error instanceof Error ? error.message : "Failed to search hotels" };
        }
    }
};
