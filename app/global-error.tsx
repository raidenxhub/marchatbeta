"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global error:", error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
                    <div className="text-center space-y-6 max-w-md">
                        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">Something went wrong</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                We encountered an unexpected error. Please try again.
                            </p>
                            {error.digest && (
                                <p className="text-xs text-gray-400 font-mono">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 justify-center">
                            <Button onClick={reset} variant="gradient">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/">
                                    <Home className="w-4 h-4 mr-2" />
                                    Go Home
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
