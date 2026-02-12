/**
 * Process attachments for the last user message: build OpenAI-compatible content
 * (text + image_url parts, with document text extracted and appended).
 * Only these image types are sent as image_url (OpenAI requirement); all other
 * files (SVG, PDF, Word, etc.) are handled as documents with text or placeholder.
 */

/** Image MIMEs that OpenAI accepts (png, jpeg, gif, webp). Other image types (e.g. SVG) are treated as documents. */
const OPENAI_IMAGE_MIMES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
]);

function isSupportedImageForApi(mime?: string): boolean {
    if (!mime) return false;
    return OPENAI_IMAGE_MIMES.has(mime.toLowerCase());
}

/** MIME patterns for which we try to extract UTF-8 text (XML, JSON, text, CSV, SVG, etc.). */
function isTextExtractableMime(mime?: string): boolean {
    if (!mime) return true;
    const m = mime.toLowerCase();
    return (
        m.startsWith("text/") ||
        m.includes("json") ||
        m.includes("xml") ||
        m.includes("csv") ||
        m === "application/xml" ||
        m === "application/json"
    );
}

/** Extract plain text from base64 data URL when MIME indicates text/XML/JSON/SVG etc. */
function extractTextFromDataUrl(dataUrl: string, mime?: string): string | null {
    try {
        const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
        const buf = Buffer.from(base64, "base64");
        const str = buf.toString("utf-8");
        if (isTextExtractableMime(mime)) return str;
        return null;
    } catch {
        return null;
    }
}

export interface AttachmentInput {
    type: "image" | "document";
    dataUrl: string;
    name: string;
    mimeType?: string;
}

export type OpenAIContentPart =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } };

/**
 * Build OpenAI user message content: string or array of text + image_url parts.
 * Documents (PDF, text) are extracted and appended to the text.
 */
export async function buildMultimodalContent(
    userText: string,
    attachments: AttachmentInput[] | undefined
): Promise<string | OpenAIContentPart[]> {
    if (!attachments?.length) return userText;

    let text = userText.trim();
    const parts: OpenAIContentPart[] = [];

    for (const a of attachments) {
        const mime = (a.mimeType || "").toLowerCase();
        // Only send as image_url if OpenAI supports this format (png, jpeg, gif, webp). SVG and other image types go to document path.
        if (isSupportedImageForApi(mime)) {
            parts.push({
                type: "image_url",
                image_url: { url: a.dataUrl },
            });
            continue;
        }
        // All other files: documents (PDF, Word, SVG, etc.) — extract text when possible, else placeholder
        if (mime === "application/pdf") {
            text += `\n\n[Attached: ${a.name} (PDF)]`;
        } else if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mime === "application/msword") {
            text += `\n\n[Attached: ${a.name} (Word document)]`;
        } else {
            const docText = extractTextFromDataUrl(a.dataUrl, mime);
            if (docText) text += `\n\n[Document: ${a.name}]\n${docText.slice(0, 30000)}`;
            else text += `\n\n[Attached file: ${a.name}]`;
        }
    }

    if (parts.length === 0) return text;
    return [{ type: "text", text }, ...parts];
}
