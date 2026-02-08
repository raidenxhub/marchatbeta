import { SchemaType } from "@google/generative-ai";
import { ToolImplementation } from "./registry";
import type { ArtifactType } from "@/lib/types/chat";

export const createArtifactTool: ToolImplementation = {
    declaration: {
        name: "create_artifact",
        description: "Create an artifact (code, document, HTML, etc.) that the user can view and use. Call this when the user asks you to create, write, or generate something they can open (e.g. a webpage, a script, a document).",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                title: {
                    type: SchemaType.STRING,
                    description: "Short title for the artifact (e.g. 'Homepage', 'API script')",
                },
                type: {
                    type: SchemaType.STRING,
                    description: "One of: code, document, html, image",
                },
                content: {
                    type: SchemaType.STRING,
                    description: "Full content of the artifact (HTML, code, or markdown text)",
                },
            },
            required: ["title", "type", "content"],
        },
    },
    execute: async (args: { title: string; type: string; content: string }) => {
        const resolvedType = ["code", "document", "html", "image"].includes(args.type)
            ? args.type
            : "document";
        return {
            title: args.title?.slice(0, 200) || "Untitled",
            type: resolvedType as ArtifactType,
            content: args.content || "",
        };
    },
};
