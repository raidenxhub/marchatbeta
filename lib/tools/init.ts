/**
 * Registers all tools for both Gemini and OpenAI backends.
 * Import this in AI modules to ensure tools are available.
 */
import { registerTool } from "./registry";
import { weatherToolImplementation } from "./weather";
import { googleSearchTool, googleImageSearchTool } from "./search";
import { webFetchTool } from "./web-fetch";
import { calculatorTool } from "./calculator";
import { sandboxTool } from "./sandbox";
import { flightSearchTool, hotelSearchTool } from "./travel";
import { timeTool } from "./time";
import { createArtifactTool } from "./artifacts";

registerTool(weatherToolImplementation);
registerTool(googleSearchTool);
registerTool(googleImageSearchTool);
registerTool(webFetchTool);
registerTool(calculatorTool);
registerTool(sandboxTool);
registerTool(flightSearchTool);
registerTool(hotelSearchTool);
registerTool(timeTool);
registerTool(createArtifactTool);
