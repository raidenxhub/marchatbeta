"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";

export default function AuthRetryPage() {
    const router = useRouter();
    const setAuthDialogOpen = useAuthStore((s) => s.setAuthDialogOpen);

    useEffect(() => {
        setAuthDialogOpen(true);
        router.replace("/");
    }, [router, setAuthDialogOpen]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#1e1e1c]">
            <div className="text-center">
                <span className="text-3xl text-amber-400/90 animate-pulse">✦</span>
                <p className="mt-4 text-[#c1c0b5]/80">Opening sign in...</p>
            </div>
        </div>
    );
}
