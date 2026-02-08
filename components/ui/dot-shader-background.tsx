"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "next-themes";

const BG_DARK = "#262624";
const DOT_DARK = "#c1c0b5";
const BG_LIGHT = "#f5f5f0";
const DOT_LIGHT = "#555555";
const GRID = 52;
const DOT_RADIUS = 0.25;
const BASE_ALPHA = 0.10;
const GLOW_RADIUS = 65;
const GLOW_STRENGTH = 0.25;

function DotCanvas({ isDark }: { isDark: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0.5, y: 0.5 });
    const rafRef = useRef<number>(0);
    const BG = isDark ? BG_DARK : BG_LIGHT;
    const DOT = isDark ? DOT_DARK : DOT_LIGHT;

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
        const w = canvas.width;
        const h = canvas.height;
        const mx = mouseRef.current.x * w;
        const my = mouseRef.current.y * h;
        const bg = isDark ? BG_DARK : BG_LIGHT;
        const dot = isDark ? DOT_DARK : DOT_LIGHT;

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const stepX = w / GRID;
        const stepY = h / GRID;

        for (let i = 0; i <= GRID; i++) {
            for (let j = 0; j <= GRID; j++) {
                const x = (i + 0.5) * stepX;
                const y = (j + 0.5) * stepY;
                const dx = x - mx;
                const dy = y - my;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const glow = Math.max(0, 1 - dist / GLOW_RADIUS) * GLOW_STRENGTH;
                const size = 1 + glow * 2;
                const alpha = Math.min(1, BASE_ALPHA + glow * 0.25);

                ctx.beginPath();
                ctx.arc(x, y, size * DOT_RADIUS * (stepX + stepY) / 40, 0, Math.PI * 2);
                ctx.fillStyle = dot;
                ctx.globalAlpha = Math.min(1, alpha);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        rafRef.current = requestAnimationFrame(draw);
    }, [isDark]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
            const w = window.innerWidth;
            const h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
        };

        const onMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX / window.innerWidth;
            mouseRef.current.y = e.clientY / window.innerHeight;
        };

        resize();
        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", onMove, { passive: true });

        rafRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMove);
            cancelAnimationFrame(rafRef.current);
        };
    }, [draw, isDark]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ display: "block" }}
        />
    );
}

export function DotShaderBackgroundStatic() {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme !== "light";
    useEffect(() => setMounted(true), []);
    if (!mounted) return <div className="absolute inset-0 bg-[#262624]" />;
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <DotCanvas isDark={isDark} />
        </div>
    );
}

export function DotShaderBackground() {
    return <DotShaderBackgroundStatic />;
}
