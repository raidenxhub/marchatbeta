import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncSettingsToProfile } from '@/lib/supabase/sync';
import { useAuthStore } from '@/lib/store/auth-store';

export type ModelMode = 'standard' | 'deep-research' | 'reasoner';
export type ThemeMode = 'light' | 'dark' | 'system';
export type DensityMode = 'compact' | 'comfortable' | 'detailed';
export type AccentColor = 'emerald' | 'blue' | 'violet' | 'amber';
export type ChatFont = 'default' | 'sans' | 'system' | 'dyslexic';

interface SettingsState {
    language: string;
    setLanguage: (lang: string) => void;
    modelMode: ModelMode;
    setModelMode: (mode: ModelMode) => void;
    extendedThinking: boolean;
    setExtendedThinking: (value: boolean) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    profileName: string;
    profileAvatarUrl: string | null;
    setProfileName: (name: string) => void;
    setProfileAvatarUrl: (url: string | null) => void;
    whatShouldCallYou: string;
    setWhatShouldCallYou: (v: string) => void;
    workFunction: string;
    setWorkFunction: (v: string) => void;
    personalPreferences: string;
    setPersonalPreferences: (v: string) => void;
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    accentColor: AccentColor;
    setAccentColor: (accent: AccentColor) => void;
    density: DensityMode;
    setDensity: (density: DensityMode) => void;
    reduceMotion: boolean;
    setReduceMotion: (reduce: boolean) => void;
    responseCompletionsNotification: boolean;
    setResponseCompletionsNotification: (v: boolean) => void;
    chatFont: ChatFont;
    setChatFont: (v: ChatFont) => void;
    locationMetadata: boolean;
    setLocationMetadata: (v: boolean) => void;
    helpImproveMAR: boolean;
    setHelpImproveMAR: (v: boolean) => void;
    artifactsEnabled: boolean;
    setArtifactsEnabled: (v: boolean) => void;
    aiPoweredArtifactsEnabled: boolean;
    setAiPoweredArtifactsEnabled: (v: boolean) => void;
    codeExecutionEnabled: boolean;
    setCodeExecutionEnabled: (v: boolean) => void;
    allowNetworkEgress: boolean;
    setAllowNetworkEgress: (v: boolean) => void;
    skills: string[];
    addSkill: (content: string) => void;
    removeSkill: (index: number) => void;
    setSkills: (skills: string[]) => void;
    memoryFacts: string[];
    addMemoryFact: (fact: string) => void;
    removeMemoryFact: (index: number) => void;
    setMemoryFacts: (facts: string[]) => void;
    hasCompletedOnboarding: boolean;
    setHasCompletedOnboarding: (v: boolean) => void;
}

const MAX_AVATAR_SIZE_BYTES = 1024 * 1024; // 1MB

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: 'en',
            setLanguage: (language) => set({ language }),
            modelMode: 'standard',
            setModelMode: (modelMode) => set({ modelMode }),
            extendedThinking: false,
            setExtendedThinking: (extendedThinking) => set({ extendedThinking }),
            isOpen: false,
            setIsOpen: (isOpen) => set({ isOpen }),
            profileName: '',
            profileAvatarUrl: null,
            setProfileName: (profileName) => set({ profileName: (profileName ?? '').trim() }),
            setProfileAvatarUrl: (profileAvatarUrl) => set({ profileAvatarUrl }),
            whatShouldCallYou: '',
            setWhatShouldCallYou: (whatShouldCallYou) => set({ whatShouldCallYou }),
            workFunction: '',
            setWorkFunction: (workFunction) => set({ workFunction }),
            personalPreferences: '',
            setPersonalPreferences: (personalPreferences) => set({ personalPreferences }),
            theme: 'system',
            setTheme: (theme) => set({ theme }),
            accentColor: 'emerald',
            setAccentColor: (accentColor) => set({ accentColor }),
            density: 'comfortable',
            setDensity: (density) => set({ density }),
            reduceMotion: false,
            setReduceMotion: (reduceMotion) => set({ reduceMotion }),
            responseCompletionsNotification: false,
            setResponseCompletionsNotification: (responseCompletionsNotification) => set({ responseCompletionsNotification }),
            chatFont: 'default',
            setChatFont: (chatFont) => set({ chatFont }),
            locationMetadata: true,
            setLocationMetadata: (locationMetadata) => set({ locationMetadata }),
            helpImproveMAR: true,
            setHelpImproveMAR: (helpImproveMAR) => set({ helpImproveMAR }),
            artifactsEnabled: true,
            setArtifactsEnabled: (artifactsEnabled) => set({ artifactsEnabled }),
            aiPoweredArtifactsEnabled: true,
            setAiPoweredArtifactsEnabled: (aiPoweredArtifactsEnabled) => set({ aiPoweredArtifactsEnabled }),
            codeExecutionEnabled: true,
            setCodeExecutionEnabled: (codeExecutionEnabled) => set({ codeExecutionEnabled }),
            allowNetworkEgress: false,
            setAllowNetworkEgress: (allowNetworkEgress) => set({ allowNetworkEgress }),
            skills: [],
            addSkill: (content) =>
                set((s) => ({
                    skills: [...s.skills, content.trim()].filter(Boolean),
                })),
            removeSkill: (index) =>
                set((s) => ({
                    skills: s.skills.filter((_, i) => i !== index),
                })),
            setSkills: (skills) => set({ skills: Array.isArray(skills) ? skills : [] }),
            memoryFacts: [],
            addMemoryFact: (fact) =>
                set((s) => ({
                    memoryFacts: [...s.memoryFacts, fact.trim()].filter(Boolean).slice(-500),
                })),
            removeMemoryFact: (index) =>
                set((s) => ({
                    memoryFacts: s.memoryFacts.filter((_, i) => i !== index),
                })),
            setMemoryFacts: (facts) => set({ memoryFacts: Array.isArray(facts) ? facts.slice(-500) : [] }),
            hasCompletedOnboarding: false,
            setHasCompletedOnboarding: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
        }),
        {
            name: 'mar-settings-storage',
        }
    )
);

// Debounced sync: push settings to Supabase whenever they change
let _settingsSyncTimer: ReturnType<typeof setTimeout> | null = null;
useSettingsStore.subscribe((state) => {
    if (_settingsSyncTimer) clearTimeout(_settingsSyncTimer);
    _settingsSyncTimer = setTimeout(() => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;
        const prefs: Record<string, unknown> = {
            theme: state.theme,
            chatFont: state.chatFont,
            language: state.language,
            modelMode: state.modelMode,
            profileName: state.profileName,
            whatShouldCallYou: state.whatShouldCallYou,
            workFunction: state.workFunction,
            personalPreferences: state.personalPreferences,
            skills: state.skills,
            memoryFacts: state.memoryFacts,
            artifactsEnabled: state.artifactsEnabled,
            codeExecutionEnabled: state.codeExecutionEnabled,
        };
        syncSettingsToProfile(userId, prefs);
    }, 2000);
});

export function readFileAsDataUrl(file: File, maxBytes: number = MAX_AVATAR_SIZE_BYTES): Promise<string> {
    return new Promise((resolve, reject) => {
        if (file.size > maxBytes) {
            reject(new Error('File must be 1MB or smaller'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
