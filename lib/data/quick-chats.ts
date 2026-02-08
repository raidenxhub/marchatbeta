import type { LucideIcon } from "lucide-react";
import { Pencil, GraduationCap, Coffee, Lightbulb, Code, Briefcase } from "lucide-react";

export interface QuickChatTopic {
    id: string;
    label: string;
    icon: LucideIcon;
    prompts: string[];
}

/** Workflow templates for common tasks */
export const WORKFLOW_TEMPLATES = [
    { label: "Meeting notes", prompt: "Turn this into structured meeting notes with action items, decisions, and next steps." },
    { label: "Follow-up email", prompt: "Draft a brief follow-up email summarizing our discussion and proposed next steps." },
    { label: "Status update", prompt: "Turn this into a concise status update (2–3 bullets) suitable for stakeholders." },
    { label: "Executive summary", prompt: "Create a one-paragraph executive summary of this content." },
    { label: "Pros and cons", prompt: "List the pros and cons of this approach for quick decision-making." },
    { label: "Step-by-step guide", prompt: "Convert this into a clear step-by-step guide that anyone can follow." },
];

/** Quick refine actions for assistant responses */
export const REFINE_ACTIONS: { id: string; label: string; prompt: string }[] = [
    { id: "shorter", label: "Make shorter", prompt: "Make this shorter and more concise. Keep only the essential points." },
    { id: "formal", label: "More formal", prompt: "Rewrite this in a more formal, professional tone." },
    { id: "casual", label: "More casual", prompt: "Rewrite this in a more casual, friendly tone." },
    { id: "email", label: "Turn into email", prompt: "Turn this into a professional email I can send as-is." },
    { id: "summarize", label: "Summarize", prompt: "Summarize the key points in 2–3 bullet points." },
    { id: "expand", label: "Expand", prompt: "Expand on this with more detail and examples." },
    { id: "translate", label: "Translate", prompt: "Translate this to {language}. Keep the same tone and formatting." },
];

export const QUICK_CHAT_TOPICS: QuickChatTopic[] = [
    {
        id: "code",
        label: "Code",
        icon: Code,
        prompts: [
            "Help me turn a screenshot into working code",
            "Design UI/UX wireframes",
            "Design logging systems",
            "Design feature flags",
            "Create code snippets",
            "Refactor this code for better performance",
            "Write unit tests for this function",
            "Debug this error and suggest a fix",
        ],
    },
    {
        id: "write",
        label: "Write",
        icon: Pencil,
        prompts: [
            "Develop editorial guidelines",
            "Write executive summaries",
            "Develop storytelling frameworks",
            "Write event descriptions",
            "Help me develop a unique voice for an audience",
        ],
    },
    {
        id: "learn",
        label: "Learn",
        icon: GraduationCap,
        prompts: [
            "Transform these notes into a structured summary",
            "Develop research methodologies",
            "Explain a complex topic simply",
            "Create a study plan",
            "Create good lecture notes",
        ],
    },
    {
        id: "life",
        label: "Life stuff",
        icon: Coffee,
        prompts: [
            "Help me reflect on an experience",
            "Manage household tasks",
            "Organize my living space",
            "Track personal goals",
            "Organize digital files",
        ],
    },
    {
        id: "choice",
        label: "MAR's choice",
        icon: Lightbulb,
        prompts: [
            "Discuss space exploration questions",
            "Consider environmental solutions",
            "Investigate scientific mysteries",
            "Discuss social dynamics",
            "Create a fictional scenario",
        ],
    },
    {
        id: "workflow",
        label: "Workflow",
        icon: Briefcase,
        prompts: [
            "Turn this into structured meeting notes with action items and next steps",
            "Draft a brief follow-up email summarizing our discussion",
            "Create a concise status update (2–3 bullets) for stakeholders",
            "Create a one-paragraph executive summary",
            "List pros and cons for quick decision-making",
            "Convert this into a clear step-by-step guide",
        ],
    },
];
