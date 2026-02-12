import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { ToolImplementation } from "./registry";

interface WeatherData {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    windDirection: number;
    isDay: number;
    time: string;
}

interface HourlyForecast {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
}

interface OpenMeteoResponse {
    current: {
        temperature_2m: number;
        weather_code: number;
        wind_speed_10m: number;
        wind_direction_10m: number;
        is_day: number;
        time: string;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        precipitation_probability: number[];
        weather_code: number[];
    };
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        weather_code: number[];
    };
}

// Map WMO weather codes to human-readable descriptions
const WEATHER_CODES: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
};

export const weatherToolImplementation: ToolImplementation = {
    declaration: {
        name: "get_current_weather",
        description: "Get the current weather and forecast for a specific location. Use this when the user asks for weather info.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                latitude: {
                    type: SchemaType.NUMBER,
                    description: "Latitude of the location",
                },
                longitude: {
                    type: SchemaType.NUMBER,
                    description: "Longitude of the location",
                },
            },
            required: ["latitude", "longitude"],
        },
    },
    execute: async ({ latitude, longitude }) => {
        const result = await getCurrentWeather(latitude, longitude);
        return JSON.parse(result); // The original function returned a string, but our registry expects an object
    }
};

export async function getCurrentWeather(latitude: number, longitude: number): Promise<string> {
    try {
        const params = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            current: "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day",
            hourly: "temperature_2m,precipitation_probability,weather_code",
            daily: "temperature_2m_max,temperature_2m_min,weather_code",
            timezone: "auto",
        });

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Weather API returned status: ${response.status}`);
        }

        const data = await response.json();

        // Format current weather
        const current = data.current;
        const weatherDesc = WEATHER_CODES[current.weather_code] || "Unknown";

        // Format forecast (next 24 hours summary)
        const hourly = data.hourly;
        const next24Hours = hourly.time.slice(0, 24).map((t: string, i: number) => ({
            time: t,
            temp: hourly.temperature_2m[i],
            precip: hourly.precipitation_probability[i],
            code: hourly.weather_code[i]
        }));

        // Calculate some basic forecast stats
        const avgTemp = next24Hours.reduce((acc: number, curr: { temp: number }) => acc + curr.temp, 0) / next24Hours.length;
        const maxPrecip = Math.max(...next24Hours.map((h: { precip: number }) => h.precip));

        const result = {
            current: {
                temperature: `${current.temperature_2m}°C`,
                condition: weatherDesc,
                wind: `${current.wind_speed_10m} km/h`,
                isDay: current.is_day ? "Yes" : "No",
            },
            forecast_summary: {
                average_temp_next_24h: `${avgTemp.toFixed(1)}°C`,
                max_precipitation_probability: `${maxPrecip}%`,
            },
            daily_forecast: data.daily.time.slice(0, 3).map((t: string, i: number) => ({
                date: t,
                max_temp: `${data.daily.temperature_2m_max[i]}°C`,
                min_temp: `${data.daily.temperature_2m_min[i]}°C`,
                condition: WEATHER_CODES[data.daily.weather_code[i]] || "Unknown",
            }))
        };

        return JSON.stringify(result);
    } catch (error) {
        console.error("Error fetching weather:", error);
        return JSON.stringify({ error: "Failed to fetch weather data" });
    }
}
