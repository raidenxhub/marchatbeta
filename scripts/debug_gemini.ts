
import { streamChatCompletion } from "../lib/ai/gemini";
import dotenv from "dotenv";
dotenv.config();

async function main() {
    console.log("Starting Debug Stream...");
    try {
        const generator = streamChatCompletion([{ role: "user", content: "Hello, say something." }]);
        for await (const chunk of generator) {
            console.log("Chunk:", chunk);
        }
        console.log("Stream Done");
    } catch (error) {
        console.error("Stream Error:", error);
    }
}

main();
