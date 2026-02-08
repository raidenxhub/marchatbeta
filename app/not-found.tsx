import Link from "next/link";
import { Home, Search, Frown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
            <div className="text-center space-y-6 max-w-md">
                {/* Animated 404 */}
                <div className="relative">
                    <h1 className="text-[150px] font-bold mar-gradient-text leading-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Frown className="w-16 h-16 text-gray-300 dark:text-gray-700" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Page Not Found</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Oops! The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="flex gap-3 justify-center">
                    <Button asChild variant="gradient">
                        <Link href="/">
                            <Home className="w-4 h-4 mr-2" />
                            Go Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
