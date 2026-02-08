"use client";

import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-[#1e1e1c]">
            <div className="text-center space-y-6 max-w-md">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-3xl text-amber-400/90">✦</span>
                    <span className="text-xl font-normal italic text-white" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                        MAR Chat
                    </span>
                </div>
                <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-[#f5f5dc]">Authentication Error</h1>
                    <p className="text-[#c1c0b5]/80">
                        There was a problem signing you in. This could be because the link
                        expired or was already used. Please try signing in again.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild className="bg-[#f5f5dc] text-[#262624] hover:bg-[#e0dfd4]">
                        <Link href="/">
                            <Home className="w-4 h-4 mr-2" />
                            Return Home
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-[#333] text-[#c1c0b5] hover:bg-[#262624]">
                        <Link href="/auth/retry">Try Again</Link>
                    </Button>
                </div>
                <p className="text-xs text-[#c1c0b5]/50">
                    Having issues?{" "}
                    <a href="https://gomarai.com/contact" target="_blank" rel="noopener noreferrer" className="text-[#c1c0b5]/70 hover:underline">
                        Contact Support
                    </a>
                </p>
            </div>
        </div>
    );
}
