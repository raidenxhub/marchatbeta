import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const configured = !!process.env.OPENAI_API_KEY;
        if (!configured) {
            return NextResponse.json({
                status: "error",
                openai: { configured: false, working: false },
                timestamp: new Date().toISOString(),
                version: "1.0.0",
            });
        }
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: "Say OK" }],
                max_tokens: 5,
            }),
        });
        const working = res.ok;
        return NextResponse.json({
            status: working ? "ok" : "degraded",
            openai: { configured: true, working },
            timestamp: new Date().toISOString(),
            version: "1.0.0",
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
                version: "1.0.0",
            },
            { status: 500 }
        );
    }
}
