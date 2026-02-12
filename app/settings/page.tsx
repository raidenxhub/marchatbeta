"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    User,
    Palette,
    Shield,
    Bell,
    Database,
    Keyboard,
    HelpCircle,
    Moon,
    Sun,
    Monitor,
    Trash2,
    Download,
    LogOut,
    Briefcase,
    Smile,
    Settings as SettingsIcon,
    BookOpen,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useChatStore } from "@/lib/store/chat-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data", icon: Database },
    { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
    { id: "help", label: "Help", icon: HelpCircle },
];

export default function SettingsPage() {
    const router = useRouter();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace("/");
        }
    }, [isAuthenticated, router]);
    const [activeTab, setActiveTab] = useState("appearance");
    const { theme, setTheme } = useTheme();
    const { preferences, setPreferences, reset, conversations, messages } = useChatStore();

    const handleExportData = () => {
        const data = {
            conversations,
            messages,
            preferences,
            exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mar-chat-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Data exported successfully!");
    };

    const handleClearData = () => {
        if (confirm("Are you sure you want to delete all your data? This cannot be undone.")) {
            reset();
            toast.success("All data cleared");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-30 h-16 px-4 flex items-center gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
                <Button variant="ghost" size="icon" asChild className="rounded-xl">
                    <Link href="/">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Settings</h1>
            </header>

            <div className="max-w-6xl mx-auto p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 shrink-0">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                                        activeTab === tab.id
                                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                                    )}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Content */}
                    <main className="flex-1">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === "appearance" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Appearance</CardTitle>
                                        <CardDescription>
                                            Customize how MAR Chat looks on your device
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Theme */}
                                        <div>
                                            <h3 className="text-sm font-medium mb-3">Theme</h3>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { value: "light", label: "Light", icon: Sun },
                                                    { value: "dark", label: "Dark", icon: Moon },
                                                    { value: "system", label: "System", icon: Monitor },
                                                ].map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => setTheme(option.value)}
                                                        className={cn(
                                                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                                            theme === option.value
                                                                ? "border-sky-500 bg-sky-500/10"
                                                                : "border-transparent bg-gray-100 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                                                        )}
                                                    >
                                                        <option.icon className="w-6 h-6" />
                                                        <span className="text-sm font-medium">{option.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Persona */}
                                        <div>
                                            <h3 className="text-sm font-medium mb-3">AI Persona</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {[
                                                    { value: "professional", label: "Professional", Icon: Briefcase },
                                                    { value: "casual", label: "Casual", Icon: Smile },
                                                    { value: "technical", label: "Technical", Icon: SettingsIcon },
                                                    { value: "creative", label: "Creative", Icon: Palette },
                                                    { value: "educational", label: "Educational", Icon: BookOpen },
                                                ].map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() =>
                                                            setPreferences({ persona: option.value as "professional" | "casual" | "technical" | "creative" | "educational" })
                                                        }
                                                        className={cn(
                                                            "flex items-center gap-2 p-3 rounded-xl border-2 transition-all",
                                                            preferences.persona === option.value
                                                                ? "border-sky-500 bg-sky-500/10"
                                                                : "border-transparent bg-gray-100 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                                                        )}
                                                    >
                                                        <option.Icon className="w-5 h-5 shrink-0" />
                                                        <span className="text-sm font-medium">{option.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === "data" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Data Management</CardTitle>
                                        <CardDescription>
                                            Export or delete your chat data
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Export */}
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                                            <div>
                                                <h3 className="font-medium">Export Data</h3>
                                                <p className="text-sm text-gray-500">
                                                    Download all your conversations and settings
                                                </p>
                                            </div>
                                            <Button onClick={handleExportData}>
                                                <Download className="w-4 h-4 mr-2" />
                                                Export
                                            </Button>
                                        </div>

                                        <Separator />

                                        {/* Clear Data */}
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                                            <div>
                                                <h3 className="font-medium text-red-600 dark:text-red-400">
                                                    Delete All Data
                                                </h3>
                                                <p className="text-sm text-red-500">
                                                    This will permanently delete all your conversations
                                                </p>
                                            </div>
                                            <Button variant="destructive" onClick={handleClearData}>
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === "shortcuts" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Keyboard Shortcuts</CardTitle>
                                        <CardDescription>
                                            Navigate MAR Chat faster with these shortcuts
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {[
                                                { keys: ["Enter"], action: "Send message" },
                                                { keys: ["Shift", "Enter"], action: "New line" },
                                                { keys: ["Ctrl", "N"], action: "New chat" },
                                                { keys: ["Ctrl", "B"], action: "Toggle sidebar" },
                                                { keys: ["Ctrl", "/"], action: "Focus input" },
                                                { keys: ["Esc"], action: "Stop generation" },
                                            ].map((shortcut) => (
                                                <div
                                                    key={shortcut.action}
                                                    className="flex items-center justify-between py-2"
                                                >
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        {shortcut.action}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {shortcut.keys.map((key) => (
                                                            <kbd
                                                                key={key}
                                                                className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono"
                                                            >
                                                                {key}
                                                            </kbd>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === "help" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Help & Support</CardTitle>
                                        <CardDescription>
                                            Get help with MAR Chat
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <a
                                            href="https://github.com/gomarai/mar-chat"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <span className="font-medium">GitHub Repository</span>
                                            <span className="text-sky-500">→</span>
                                        </a>
                                        <a
                                            href="https://gomarai.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <span className="font-medium">MAR AI Website</span>
                                            <span className="text-sky-500">→</span>
                                        </a>
                                        <a
                                            href="mailto:support@gomarai.com"
                                            className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <span className="font-medium">Contact Support</span>
                                            <span className="text-sky-500">→</span>
                                        </a>
                                    </CardContent>
                                </Card>
                            )}

                            {activeTab === "account" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Account Settings</CardTitle>
                                        <CardDescription>
                                            Manage your personal information and preferences
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500">
                                                    <User className="w-8 h-8" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium">Profile Photo</h3>
                                                    <p className="text-sm text-gray-500 mb-2">JPG, GIF or PNG. 1MB max.</p>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm">Upload</Button>
                                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">Remove</Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">Full Name</label>
                                                    <input
                                                        className="flex h-10 w-full rounded-md border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                        defaultValue="Guest User"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">Email Address</label>
                                                    <input
                                                        className="flex h-10 w-full rounded-md border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                        defaultValue="guest@gomarai.com"
                                                        disabled
                                                    />
                                                    <p className="text-[10px] text-gray-500">Email cannot be changed for guest accounts.</p>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2 pt-4">
                                                <Button variant="outline">Cancel</Button>
                                                <Button onClick={() => toast.success("Profile updated successfully!")}>Save Changes</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Placeholder for other tabs */}
                            {["privacy", "notifications"].includes(activeTab) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="capitalize">{activeTab}</CardTitle>
                                        <CardDescription>
                                            {activeTab === "privacy"
                                                ? "Control your privacy preferences"
                                                : "Configure notification settings"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-12 text-gray-500">
                                            <p>Coming soon</p>
                                            <p className="text-sm mt-2">
                                                Sign in to access these settings
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    </main>
                </div>
            </div>
        </div>
    );
}
