import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    authDialogOpen: boolean;

    setUser: (user: User | null) => void;
    setIsLoading: (loading: boolean) => void;
    setAuthDialogOpen: (open: boolean) => void;
    signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    authDialogOpen: false,

    setUser: (user) =>
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
        }),

    setIsLoading: (loading) => set({ isLoading: loading }),

    setAuthDialogOpen: (open) => set({ authDialogOpen: open }),

    signOut: () =>
        set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        }),
}));
