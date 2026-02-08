"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, Copy, Download, FileDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/lib/store/chat-store";
import { toast } from "sonner";

export function ArtifactPanel() {
    const { artifacts, activeArtifactId, setArtifactPanelOpen, setActiveArtifact } = useChatStore();
    const [showExportMenu, setShowExportMenu] = useState(false);

    const artifact = useMemo(
        () => artifacts.find((a) => a.id === activeArtifactId),
        [artifacts, activeArtifactId]
    );

    if (!artifact) return null;

    const handleClose = () => {
        setArtifactPanelOpen(false);
        setActiveArtifact(null);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(artifact.content);
            toast.success("Copied to clipboard");
        } catch {
            toast.error("Could not copy");
        }
    };

    const handleDownload = (format?: "default" | "md" | "html") => {
        try {
            let content = artifact.content;
            let ext = artifact.type === "html" ? "html" : artifact.type === "code" ? "js" : artifact.type === "image" ? "png" : "txt";
            let mime = artifact.type === "html" ? "text/html" : "text/plain";

            if (format === "md") {
                ext = "md";
                mime = "text/markdown";
                if (artifact.type !== "code" && artifact.type !== "document") {
                    content = `# ${artifact.title}\n\n${content}`;
                }
            } else if (format === "html" && artifact.type !== "html") {
                ext = "html";
                mime = "text/html";
                content = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${artifact.title}</title></head>
<body><pre style="font-family:system-ui;padding:1rem;white-space:pre-wrap;">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body>
</html>`;
            }

            const a = document.createElement("a");
            a.download = `${artifact.title || "artifact"}.${ext}`;
            if (artifact.type === "image" && artifact.content.startsWith("data:") && !format) {
                a.href = artifact.content;
            } else {
                a.href = URL.createObjectURL(new Blob([content], { type: mime }));
                a.onclick = () => setTimeout(() => URL.revokeObjectURL(a.href), 100);
            }
            a.click();
            toast.success("Download started");
            setShowExportMenu(false);
        } catch {
            toast.error("Could not download");
        }
    };

    const handlePrintToPdf = () => {
        const w = window.open("", "_blank");
        if (!w) {
            toast.error("Popup blocked");
            return;
        }
        w.document.write(artifact.type === "html"
            ? artifact.content
            : `<!DOCTYPE html><html><head><title>${artifact.title}</title></head><body><pre style="font-family:system-ui;padding:1rem;white-space:pre-wrap;">${artifact.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`);
        w.document.close();
        w.onload = () => {
            w.print();
            w.close();
        };
        setShowExportMenu(false);
    };

    const isImageDataUrl = artifact.type === "image" && (artifact.content.startsWith("data:image/") || artifact.content.startsWith("data:image%"));

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[var(--mar-bg)] border-l border-[var(--mar-fg-muted)]/30 flex flex-col shadow-xl">
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#333] dark:border-[#333] bg-[var(--mar-bg-secondary)] dark:bg-[#1e1e1c]">
                <h2 className="text-sm font-semibold text-[var(--mar-fg)] dark:text-[#c1c0b5] truncate flex-1 min-w-0">{artifact.title}</h2>
                <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--mar-fg-muted)] hover:text-[var(--mar-fg)] dark:text-[#c1c0b5]/60 dark:hover:text-[#c1c0b5]" onClick={handleCopy}>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                    </Button>
                    <div className="relative">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-[var(--mar-fg-muted)] hover:text-[var(--mar-fg)] dark:text-[#c1c0b5]/60 dark:hover:text-[#c1c0b5]" onClick={() => setShowExportMenu((v) => !v)}>
                            <FileDown className="w-4 h-4 mr-1" />
                            Export
                            <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
                        </Button>
                        {showExportMenu && (
                            <>
                                <div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowExportMenu(false)} />
                                <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-lg border border-[#333] bg-[#1e1e1c] py-1 shadow-xl">
                                    <button type="button" className="w-full px-3 py-2 text-left text-sm text-[#c1c0b5]/90 hover:bg-[#262624]" onClick={() => handleDownload()}>
                                        Default
                                    </button>
                                    <button type="button" className="w-full px-3 py-2 text-left text-sm text-[#c1c0b5]/90 hover:bg-[#262624]" onClick={() => handleDownload("md")}>
                                        Markdown
                                    </button>
                                    <button type="button" className="w-full px-3 py-2 text-left text-sm text-[#c1c0b5]/90 hover:bg-[#262624]" onClick={() => handleDownload("html")}>
                                        HTML
                                    </button>
                                    <button type="button" className="w-full px-3 py-2 text-left text-sm text-[#c1c0b5]/90 hover:bg-[#262624]" onClick={handlePrintToPdf}>
                                        Print to PDF
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--mar-fg-muted)] hover:text-[var(--mar-fg)] dark:text-[#c1c0b5]/60 dark:hover:text-[#c1c0b5]" onClick={handleClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                {artifact.type === "html" ? (
                    <iframe
                        title={artifact.title}
                        srcDoc={artifact.content}
                        className="w-full h-full min-h-[600px] rounded-lg border border-[#333] bg-white"
                        sandbox="allow-scripts"
                    />
                ) : artifact.type === "image" && isImageDataUrl ? (
                    <div className="flex justify-center">
                        <img src={artifact.content} alt={artifact.title} className="max-w-full h-auto rounded-lg border border-[#333]" />
                    </div>
                ) : artifact.type === "code" ? (
                    <pre className="p-4 rounded-lg bg-[#0d0d0d] border border-[#333] text-[#c1c0b5] text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                        <code>{artifact.content}</code>
                    </pre>
                ) : ["document", "presentation", "spreadsheet", "chart"].includes(artifact.type) ? (
                    <div className="prose prose-invert max-w-none prose-p:text-[#c1c0b5] prose-headings:text-[#f5f5dc] prose-strong:text-[#f5f5dc] prose-code:text-[#c1c0b5] prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-[#333]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.content}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="prose prose-invert max-w-none prose-p:text-[#c1c0b5] prose-headings:text-[#f5f5dc] prose-strong:text-[#f5f5dc] prose-code:text-[#c1c0b5] prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-[#333]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{artifact.content}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
}
