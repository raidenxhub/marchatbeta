import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMagicLinkEmailHtml, getMagicLinkEmailText } from "@/lib/email/magic-link-template";

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = typeof body.email === "string" ? body.email.trim() : "";

        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { error: "Valid email is required" },
                { status: 400 }
            );
        }

        const resendFrom = process.env.RESEND_FROM_EMAIL;
        if (!process.env.RESEND_API_KEY || !resendFrom) {
            console.error("RESEND_API_KEY or RESEND_FROM_EMAIL not configured");
            return NextResponse.json(
                { error: "Email service not configured" },
                { status: 500 }
            );
        }

        const supabase = createAdminClient();
        const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        const redirectTo = `${origin}/auth/callback`;

        const { data, error } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: { redirectTo },
        });

        if (error) {
            console.error("Supabase generateLink error:", error);
            return NextResponse.json(
                { error: error.message || "Failed to generate sign-in link" },
                { status: 400 }
            );
        }

        const hashedToken = data.properties?.hashed_token;
        const actionLink = data.properties?.action_link;
        const signInUrl = hashedToken
            ? `${origin}/auth/callback?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink`
            : actionLink;
        if (!signInUrl) {
            return NextResponse.json(
                { error: "Failed to generate sign-in link" },
                { status: 500 }
            );
        }

        const { error: sendError } = await resend.emails.send({
            from: resendFrom,
            to: email,
            subject: "Sign in to MAR Chat",
            html: getMagicLinkEmailHtml({ signInUrl }),
            text: getMagicLinkEmailText({ signInUrl }),
        });

        if (sendError) {
            console.error("Resend send error:", sendError);
            return NextResponse.json(
                { error: sendError.message || "Failed to send email" },
                { status: 500 }
            );
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("send-magic-link error:", err);
        return NextResponse.json(
            { error: "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
