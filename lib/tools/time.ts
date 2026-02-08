import { SchemaType } from "@google/generative-ai";
import { ToolImplementation } from "./registry";

export const timeTool: ToolImplementation = {
    declaration: {
        name: "get_world_time",
        description: "Get the current time for a specific timezone or location.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                timezone: {
                    type: SchemaType.STRING,
                    description: "The IANA timezone identifier (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo'). If not known, ask the user or infer from location."
                }
            },
            required: ["timezone"]
        }
    },
    execute: async ({ timezone }) => {
        try {
            const time = new Date().toLocaleString("en-US", {
                timeZone: timezone,
                dateStyle: "full",
                timeStyle: "long"
            });
            return { time, timezone };
        } catch (e) {
            return { error: `Invalid timezone: ${timezone}` };
        }
    }
};
