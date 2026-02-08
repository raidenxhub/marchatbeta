import { SchemaType } from "@google/generative-ai";
import { ToolImplementation } from "./registry";
import vm from "vm";

export const sandboxTool: ToolImplementation = {
    declaration: {
        name: "run_javascript",
        description: "Execute JavaScript code in a sandbox. Use this for complex logic, data processing, or algorithms that the calculator cannot handle.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                code: {
                    type: SchemaType.STRING,
                    description: "The JavaScript code to execute. The last expression will be returned."
                }
            },
            required: ["code"]
        }
    },
    execute: async ({ code }) => {
        try {
            const sandbox = {
                console: { log: (...args: any[]) => logs.push(args.join(' ')) },
                Math,
                Date,
                JSON
            };
            const logs: string[] = [];

            const context = vm.createContext(sandbox);
            const script = new vm.Script(code);

            // Timeout after 1 second
            const result = script.runInContext(context, { timeout: 1000 });

            return {
                result: String(result),
                logs: logs
            };
        } catch (e) {
            return { error: e instanceof Error ? e.message : "Execution failed" };
        }
    }
};
