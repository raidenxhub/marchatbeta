"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useSettingsStore } from "@/lib/store/settings-store";

/** Syncs settings store theme/density/reduceMotion/chatFont to DOM and next-themes. */
export function ThemeSync() {
    const { theme, density, reduceMotion, accentColor, chatFont } = useSettingsStore();
    const { setTheme } = useTheme();

    useEffect(() => {
        setTheme(theme === "system" ? "system" : theme);
    }, [theme, setTheme]);

    useEffect(() => {
        document.documentElement.dataset.density = density;
    }, [density]);

    useEffect(() => {
        document.documentElement.dataset.reduceMotion = reduceMotion ? "true" : "false";
    }, [reduceMotion]);

    useEffect(() => {
        document.documentElement.dataset.accent = accentColor;
    }, [accentColor]);

    useEffect(() => {
        document.documentElement.dataset.chatFont = chatFont;
    }, [chatFont]);

    return null;
}
