"use client";

import { useState } from "react";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    fallback?: React.ReactNode;
}

export function SafeImage({ src, alt, fallback, className, ...props }: SafeImageProps) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return fallback ?? (
            <div className={className} style={{ background: "#333", display: "flex", alignItems: "center", justifyContent: "center", color: "#c1c0b5", fontSize: "0.75rem" }}>
                —
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt ?? ""}
            referrerPolicy="no-referrer"
            loading="eager"
            onError={() => setFailed(true)}
            className={className}
            {...props}
        />
    );
}
