"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        const handleCallback = async () => {
            const supabase = createClient();
            const code = searchParams.get("code");
            const error = searchParams.get("error");
            const errorDescription = searchParams.get("error_description");
            const hash = typeof window !== "undefined" ? window.location.hash : "";

            if (error) {
                console.error("Auth callback error:", error, errorDescription);
                setStatus("error");
                router.replace(`/auth/error?error=${encodeURIComponent(error)}`);
                return;
            }

            const tokenHash = searchParams.get("token_hash");
            const type = searchParams.get("type");

            if (tokenHash && type === "magiclink") {
                const { error: verifyError } = await supabase.auth.verifyOtp({
                    type: "magiclink",
                    token_hash: tokenHash,
                });
                if (!verifyError) {
                    setStatus("success");
                    window.location.href = "/";
                    return;
                }
                console.error("verifyOtp error:", verifyError);
                setStatus("error");
                router.replace("/auth/error");
                return;
            }

            if (code) {
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) {
                    console.error("Exchange error:", exchangeError);
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        setStatus("success");
                        window.location.href = "/";
                        return;
                    }
                    setStatus("error");
                    router.replace("/auth/error");
                    return;
                }
                setStatus("success");
                window.location.href = "/";
                return;
            }

            if (hash && hash.includes("access_token")) {
                try {
                    const params = new URLSearchParams(hash.replace(/^#/, ""));
                    const accessToken = params.get("access_token");
                    const refreshToken = params.get("refresh_token");
                    if (accessToken && refreshToken) {
                        const { error: setError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                        if (!setError) {
                            window.history.replaceState(null, "", window.location.pathname);
                            setStatus("success");
                            window.location.href = "/";
                            return;
                        }
                    }
                } catch (e) {
                    console.error("Hash parse error:", e);
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setStatus("success");
                window.location.href = "/";
                return;
            }
            const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
            if (refreshedSession) {
                setStatus("success");
                window.location.href = "/";
                return;
            }

            setStatus("error");
            router.replace("/auth/error");
        };

        handleCallback();
    }, [router, searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#1e1e1c]">
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-3xl text-amber-400/90">✦</span>
                    <span className="text-xl font-normal italic text-white" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                        MAR Chat
                    </span>
                </div>
                {status === "loading" && (
                    <>
                        <div className="w-8 h-8 border-2 border-[#333] border-t-amber-400/90 rounded-full animate-spin mx-auto" />
                        <p className="mt-4 text-[#c1c0b5]/80">Signing you in...</p>
                    </>
                )}
                {status === "success" && (
                    <p className="text-[#c1c0b5]/80">Redirecting...</p>
                )}
            </div>
        </div>
    );
}
