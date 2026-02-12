"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2 } from "lucide-react";

// Actual brand logos from Simple Icons (https://simpleicons.org)
const EMAIL_PROVIDERS: { name: string; url: string; icon: string }[] = [
    { name: "Gmail", url: "https://mail.google.com", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg" },
    { name: "Yahoo Mail", url: "https://mail.yahoo.com", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/yahoo.svg" },
    { name: "Outlook", url: "https://outlook.live.com", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/microsoftoutlook.svg" },
    { name: "iCloud Mail", url: "https://icloud.com/mail", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/icloud.svg" },
    { name: "Proton Mail", url: "https://mail.proton.me", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/protonmail.svg" },
    { name: "AOL Mail", url: "https://mail.aol.com", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/aol.svg" },
];

import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

interface AuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type AuthMode = "choose" | "email_sent";

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
    const [mode, setMode] = useState<AuthMode>("choose");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const supabase = createClient();

    const handleOAuthLogin = async (provider: "google") => {
        setIsLoading(true);
        try {
            const appUrl = typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
                ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
                : window.location.origin;
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${appUrl}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Sign in failed");
            setIsLoading(false);
        }
    };

    const sendMagicLink = async () => {
        const res = await fetch("/api/auth/send-magic-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send email");
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email?.trim()) return;

        setIsLoading(true);
        try {
            await sendMagicLink();
            setMode("email_sent");
            toast.success("Check your email for the sign-in link");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to send email");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email?.trim()) return;
        setIsLoading(true);
        try {
            await sendMagicLink();
            toast.success("Email sent again");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to resend");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setEmail("");
        setMode("choose");
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) resetForm();
            }}
        >
            <DialogContent className="sm:max-w-md bg-[#1e1e1c] border-[#333] text-[#c1c0b5]">
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 flex items-center justify-center gap-2">
                        <span className="text-3xl text-amber-400/90">✦</span>
                        <span className="text-xl font-normal italic text-white" style={{ fontFamily: '"Times New Roman", Times, serif' }}>MAR Chat</span>
                    </div>
                    <DialogTitle className="text-2xl text-[#f5f5dc]">
                        {mode === "choose" ? "Sign in to continue" : "Check your email"}
                    </DialogTitle>
                    <DialogDescription className="text-[#c1c0b5]/70">
                        {mode === "choose"
                            ? "Sign in to save your chats and access your account"
                            : `We sent a sign-in link to ${email}`}
                    </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {mode === "choose" ? (
                        <motion.div
                            key="choose"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <Button
                                variant="outline"
                                onClick={() => handleOAuthLogin("google")}
                                disabled={isLoading}
                                className="w-full h-11 bg-[#262624] border-[#333] text-[#c1c0b5] hover:bg-[#333] hover:text-[#f5f5dc] disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden />
                                ) : (
                                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                )}
                                Continue with Google
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator className="bg-[#333]" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[#1e1e1c] px-2 text-[#c1c0b5]/50">OR</span>
                                </div>
                            </div>

                            <form onSubmit={handleMagicLink} className="space-y-4">
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    className="h-11 bg-[#262624] border-[#333] text-[#c1c0b5] placeholder:text-[#c1c0b5]/40"
                                    required
                                />
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-11 bg-[#f5f5dc] text-[#262624] hover:bg-[#e0dfd4] disabled:opacity-70"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4 mr-2" />
                                            Continue with email
                                        </>
                                    )}
                                </Button>
                            </form>

                            <p className="text-xs text-center text-[#c1c0b5]/50">
                                By continuing, you acknowledge MAR&apos;s{" "}
                                <a href="https://gomarai.com/terms" target="_blank" rel="noopener noreferrer" className="text-[#c1c0b5]/70 hover:underline">
                                    Terms of Service
                                </a>
                                {" "}&{" "}
                                <a href="https://gomarai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#c1c0b5]/70 hover:underline">
                                    Privacy Policy
                                </a>
                                . Having issues?{" "}
                                <a href="https://gomarai.com/contact" target="_blank" rel="noopener noreferrer" className="text-[#c1c0b5]/70 hover:underline">
                                    Contact Support
                                </a>
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="email_sent"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-5"
                        >
                            <p className="text-sm text-[#c1c0b5]/90 text-center">
                                We sent a sign-in link to <strong className="text-[#f5f5dc]">{email}</strong>
                            </p>
                            <p className="text-sm text-[#c1c0b5]/80 text-center">
                                Click the link in the email to sign in.
                            </p>

                            <div>
                                <p className="text-xs text-[#c1c0b5]/60 mb-2 text-center">Open your email</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {EMAIL_PROVIDERS.map((p) => (
                                        <a
                                            key={p.name}
                                            href={p.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={`Open ${p.name}`}
                                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#333] bg-[#262624] hover:bg-[#333] transition-colors p-2"
                                        >
                                            <img src={p.icon} alt={p.name} className="w-5 h-5" />
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-[#333]">
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={isLoading}
                                    className="flex w-full items-center justify-center gap-2 text-sm text-[#c1c0b5]/70 hover:text-[#f5f5dc] hover:underline disabled:opacity-60"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                                    ) : null}
                                    Not seeing the email? Try sending again
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("choose")}
                                    className="w-full text-sm text-[#c1c0b5]/70 hover:text-[#f5f5dc] hover:underline text-center"
                                >
                                    Use a different email
                                </button>
                            </div>
                            <p className="text-xs text-center text-[#c1c0b5]/50 pt-1">
                                <a href="https://gomarai.com/contact" target="_blank" rel="noopener noreferrer" className="text-[#c1c0b5]/70 hover:underline">
                                    Contact Support
                                </a>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
