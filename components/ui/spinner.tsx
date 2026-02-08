"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg";
}

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4 border-2",
        md: "w-8 h-8 border-2",
        lg: "w-12 h-12 border-3",
    };

    return (
        <div
            className={cn(
                "rounded-full border-sky-500 border-t-transparent animate-spin",
                sizeClasses[size],
                className
            )}
            {...props}
        />
    );
}
