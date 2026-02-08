import { SchemaType } from "@google/generative-ai";
import { ToolImplementation } from "./registry";

export const calculatorTool: ToolImplementation = {
    declaration: {
        name: "calculator",
        description: "Evaluate mathematical expressions. Use this for ANY math calculation.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                expression: {
                    type: SchemaType.STRING,
                    description: "The mathematical expression to evaluate (e.g., '2 + 2', 'sqrt(144)')"
                }
            },
            required: ["expression"]
        }
    },
    execute: async ({ expression }) => {
        try {
            // Basic safety check - only allow math chars
            if (!/^[0-9+\-*/().\s%^sqrtcosinTanlogEPI,]+$/i.test(expression)) {
                return { error: "Invalid characters in expression" };
            }
            // Use Function constructor for evaluation (sandboxed-ish locally)
            // In a real prod env, use a math parser library like mathjs
            const result = new Function(`return (${expression})`)();
            return { result: result.toString() };
        } catch (e) {
            return { error: "Failed to evaluate expression" };
        }
    }
};
