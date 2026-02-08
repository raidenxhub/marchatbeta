"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/store/auth-store";
import { useSettingsStore } from "@/lib/store/settings-store";

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { setUser, setIsLoading } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const supabase = createClient();

        // Get initial session
        const getInitialSession = async () => {
            try {
                const {
                    data: { user },
                    error,
                } = await supabase.auth.getUser();

                if (error) {
                    console.error("Auth error:", error);
                    setUser(null);
                } else {
                    setUser(user);
                    if (user) {
                        const { profileName, setProfileName, setProfileAvatarUrl } = useSettingsStore.getState();
                        const md = user.user_metadata || {};
                        const authName =
                            md.full_name ||
                            md.name ||
                            [md.given_name, md.family_name].filter(Boolean).join(" ") ||
                            user.email?.split("@")[0] ||
                            "";
                        if (authName && (!profileName || profileName === "Guest User")) setProfileName(authName);
                        const avatar = user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;
                        if (avatar) setProfileAvatarUrl(avatar);
                    }
                }
            } catch (error) {
                console.error("Failed to get session:", error);
                setUser(null);
            }
        };

        getInitialSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user ?? null;
            setUser(user);
            if (user) {
                const { profileName, setProfileName, setProfileAvatarUrl } = useSettingsStore.getState();
                const md = user.user_metadata || {};
                const authName =
                    md.full_name ||
                    md.name ||
                    [md.given_name, md.family_name].filter(Boolean).join(" ") ||
                    user.email?.split("@")[0] ||
                    "";
                if (authName && !profileName) setProfileName(authName);
                const avatar = user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;
                if (avatar) setProfileAvatarUrl(avatar);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [setUser, setIsLoading]);

    if (!mounted) {
        return null;
    }

    return <>{children}</>;
}
