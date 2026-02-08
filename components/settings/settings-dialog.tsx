"use client";

import { useState, useRef } from "react";
import { ChevronDown, ChevronRight, Copy, Shield, Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useChatStore } from "@/lib/store/chat-store";
import {
    useSettingsStore,
    readFileAsDataUrl,
    type ThemeMode,
    type ChatFont,
} from "@/lib/store/settings-store";
import { LANGUAGES, getTranslation } from "@/lib/data/languages";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/store/auth-store";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const WORK_FUNCTIONS = [
    "Engineering",
    "Product",
    "Design",
    "Research",
    "Marketing",
    "Sales",
    "Support",
    "Operations",
    "Other",
];

function Collapsible({
    title,
    defaultOpen = false,
    children,
}: {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-[#333] last:border-0">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-3 text-left text-sm font-medium text-[#c1c0b5]"
            >
                {title}
                {open ? (
                    <ChevronDown className="w-4 h-4 text-[#c1c0b5]/60" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-[#c1c0b5]/60" />
                )}
            </button>
            {open && <div className="pb-4 text-sm text-[#c1c0b5]/70">{children}</div>}
        </div>
    );
}

export function SettingsDialog() {
    const {
        isOpen,
        setIsOpen,
        language,
        setLanguage,
        profileName,
        profileAvatarUrl,
        setProfileName,
        setProfileAvatarUrl,
        whatShouldCallYou,
        setWhatShouldCallYou,
        workFunction,
        setWorkFunction,
        personalPreferences,
        setPersonalPreferences,
        theme,
        setTheme,
        responseCompletionsNotification,
        setResponseCompletionsNotification,
        chatFont,
        setChatFont,
        locationMetadata,
        setLocationMetadata,
        helpImproveMAR,
        setHelpImproveMAR,
        artifactsEnabled,
        setArtifactsEnabled,
        aiPoweredArtifactsEnabled,
        setAiPoweredArtifactsEnabled,
        codeExecutionEnabled,
        setCodeExecutionEnabled,
        allowNetworkEgress,
        setAllowNetworkEgress,
        skills,
        addSkill,
        removeSkill,
        memoryFacts,
        addMemoryFact,
        removeMemoryFact,
    } = useSettingsStore();
    const { conversations, messages, reset, deleteConversation, updateConversation } = useChatStore();
    const user = useAuthStore((s) => s.user);
    const signOut = useAuthStore((s) => s.signOut);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<"general" | "account" | "privacy" | "capabilities">("general");
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [newSkillText, setNewSkillText] = useState("");
    const [newMemoryFact, setNewMemoryFact] = useState("");

    const t = (key: string) => getTranslation(language, key);
    const orgId = user?.id ?? "—";
    const email = user?.email ?? "—";

    const handleExportData = () => {
        const data = JSON.stringify(
            { conversations, messages, exportedAt: new Date().toISOString(), version: "1.0.0" },
            null,
            2
        );
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mar-chat-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Data exported successfully");
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch("/api/auth/delete-account", { method: "POST", credentials: "include" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete account");
            reset();
            signOut();
            setIsOpen(false);
            setDeleteConfirmOpen(false);
            toast.success("Account permanently deleted.");
            window.location.href = "/";
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete account");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLogoutAll = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        signOut();
        setIsOpen(false);
        toast.success("Logged out");
    };

    const copyOrgId = () => {
        if (orgId && orgId !== "—") {
            navigator.clipboard.writeText(orgId);
            toast.success("Copied");
        }
    };

    const navItems: { id: typeof activeTab; label: string }[] = [
        { id: "general", label: "General" },
        { id: "account", label: "Account" },
        { id: "privacy", label: "Privacy" },
        { id: "capabilities", label: "Capabilities" },
    ];

    // Gate: settings require login
    if (!user) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-sm p-8 border-[#333] bg-[#1e1e1c]">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <span className="text-3xl text-amber-400/90">✦</span>
                        <h2 className="text-lg font-semibold text-[#f5f5dc]">Sign in to access settings</h2>
                        <p className="text-sm text-[#c1c0b5]/70">Your settings, preferences, and data are tied to your account.</p>
                        <Button className="w-full mt-2" onClick={() => { setIsOpen(false); }}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[720px] lg:max-w-[900px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border-[#333] bg-[#1e1e1c]">
                <div className="flex flex-1 min-h-0">
                    {/* Left nav */}
                    <nav className="w-48 shrink-0 border-r border-[#333] py-4 px-2 bg-[#1a1a18]">
                        <p className="px-3 text-xs font-medium text-[#c1c0b5]/50 uppercase tracking-wider mb-2">
                            Settings
                        </p>
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                                    activeTab === item.id
                                        ? "bg-[#262624] text-[#c1c0b5]"
                                        : "text-[#c1c0b5]/80 hover:bg-[#262624]/50 hover:text-[#c1c0b5]"
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Content */}
                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            {activeTab === "general" && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-lg font-semibold text-[#f5f5dc] mb-4">Profile</h2>
                                        <div className="flex items-start gap-4">
                                            <Avatar className="w-14 h-14 border-2 border-[#333]">
                                                <AvatarImage src={profileAvatarUrl ?? undefined} alt={profileName} />
                                                <AvatarFallback className="bg-[#262624] text-[#c1c0b5] text-lg">
                                                    {(profileName || user?.user_metadata?.full_name || user?.email || "U").slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-4">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/gif"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const f = e.target.files?.[0];
                                                        if (!f) return;
                                                        try {
                                                            const dataUrl = await readFileAsDataUrl(f);
                                                            setProfileAvatarUrl(dataUrl);
                                                            toast.success("Photo uploaded");
                                                        } catch {
                                                            toast.error("Upload failed");
                                                        }
                                                        e.target.value = "";
                                                    }}
                                                />
                                                <div>
                                                    <Label className="text-sm text-[#c1c0b5]">Full name</Label>
                                                    <Input
                                                        value={profileName}
                                                        onChange={(e) => setProfileName(e.target.value)}
                                                        className="mt-1 bg-[#262624] border-[#333] text-[#c1c0b5]"
                                                        placeholder={user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Your name"}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-[#333] hover:bg-[#262624]"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        Upload
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:bg-red-500/10"
                                                        onClick={() => {
                                                            setProfileAvatarUrl(null);
                                                            toast.success("Photo removed");
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-6 space-y-2">
                                            <Label className="text-sm text-[#c1c0b5]">What should MAR call you?</Label>
                                            <Input
                                                value={whatShouldCallYou}
                                                onChange={(e) => setWhatShouldCallYou(e.target.value)}
                                                className="bg-[#262624] border-[#333] text-[#c1c0b5]"
                                                placeholder="e.g. Alex"
                                            />
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            <Label className="text-sm text-[#c1c0b5]">What best describes your work?</Label>
                                            <Select value={workFunction || "none"} onValueChange={(v) => setWorkFunction(v === "none" ? "" : v)}>
                                                <SelectTrigger className="bg-[#262624] border-[#333] text-[#c1c0b5]">
                                                    <SelectValue placeholder="Select your work function" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#262624] border-[#333]">
                                                    <SelectItem value="none" className="text-[#c1c0b5]">Select your work function</SelectItem>
                                                    {WORK_FUNCTIONS.map((wf) => (
                                                        <SelectItem key={wf} value={wf} className="text-[#c1c0b5]">
                                                            {wf}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            <Label className="text-sm text-[#c1c0b5]">
                                                What personal preferences should MAR consider in responses?
                                            </Label>
                                            <p className="text-xs text-[#c1c0b5]/50">
                                                Your preferences will apply to all conversations, within MAR's guidelines.
                                            </p>
                                            <textarea
                                                value={personalPreferences}
                                                onChange={(e) => setPersonalPreferences(e.target.value)}
                                                placeholder="e.g. I primarily code in Python (not a coding beginner)"
                                                className="w-full min-h-[80px] rounded-md border border-[#333] bg-[#262624] px-3 py-2 text-sm text-[#c1c0b5] placeholder:text-[#c1c0b5]/40 focus:outline-none focus:ring-1 focus:ring-[#333]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-semibold text-[#f5f5dc] mb-4">Notifications</h2>
                                        <div className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="text-sm font-medium text-[#c1c0b5]">Response completions</p>
                                                <p className="text-xs text-[#c1c0b5]/60 mt-0.5">
                                                    Get notified when MAR has finished a response. Most useful for long-running tasks.
                                                </p>
                                            </div>
                                            <Switch
                                                checked={responseCompletionsNotification}
                                                onCheckedChange={setResponseCompletionsNotification}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-semibold text-[#f5f5dc] mb-4">Appearance</h2>
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-sm text-[#c1c0b5]">Color mode</Label>
                                                <div className="flex gap-2 mt-2">
                                                    {(["light", "system", "dark"] as ThemeMode[]).map((t) => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            onClick={() => setTheme(t)}
                                                            className={cn(
                                                                "flex-1 py-2 px-3 rounded-lg border text-sm capitalize",
                                                                theme === t
                                                                    ? "border-blue-500 bg-blue-500/10 text-[#c1c0b5]"
                                                                    : "border-[#333] bg-[#262624] text-[#c1c0b5]/70 hover:border-[#444]"
                                                            )}
                                                        >
                                                            {t === "system" ? "Auto" : t}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-[#c1c0b5]">Chat font</Label>
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {(["default", "sans", "system", "dyslexic"] as ChatFont[]).map((f) => (
                                                        <button
                                                            key={f}
                                                            type="button"
                                                            onClick={() => setChatFont(f)}
                                                            className={cn(
                                                                "py-2 px-4 rounded-lg border text-sm capitalize",
                                                                chatFont === f
                                                                    ? "border-blue-500 bg-blue-500/10 text-[#c1c0b5]"
                                                                    : "border-[#333] bg-[#262624] text-[#c1c0b5]/70 hover:border-[#444]"
                                                            )}
                                                        >
                                                            {f === "default" ? "Default" : f === "sans" ? "Sans" : f === "system" ? "System" : "Dyslexic friendly"}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "account" && (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-semibold text-[#f5f5dc]">Account</h2>
                                    {user?.email && (
                                        <div className="py-3 border-b border-[#333]">
                                            <p className="text-sm text-[#c1c0b5]/60 mb-1">Email</p>
                                            <p className="text-sm text-[#c1c0b5]">{user.email}</p>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between py-3 border-b border-[#333]">
                                        <p className="text-sm text-[#c1c0b5]">Log out of all devices</p>
                                        <Button variant="outline" size="sm" className="border-[#333] hover:bg-[#262624]" onClick={handleLogoutAll}>
                                            Log out
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between py-3 border-b border-[#333]">
                                        <p className="text-sm text-[#c1c0b5]">Delete your account</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                                            disabled={isDeleting}
                                            onClick={() => setDeleteConfirmOpen(true)}
                                        >
                                            {isDeleting ? "Deleting..." : "Delete account"}
                                        </Button>
                                    </div>
                                    <ConfirmDialog
                                        open={deleteConfirmOpen}
                                        onOpenChange={setDeleteConfirmOpen}
                                        title="Delete account permanently?"
                                        description="This will permanently delete your account and all associated data. This action cannot be undone."
                                        confirmLabel={isDeleting ? "Deleting..." : "Delete account"}
                                        variant="destructive"
                                        loading={isDeleting}
                                        onConfirm={handleDeleteAccount}
                                    />
                                    <div className="flex items-center justify-between py-3 border-b border-[#333]">
                                        <p className="text-sm text-[#c1c0b5]">Organization ID</p>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                readOnly
                                                value={orgId}
                                                className="w-64 bg-[#262624] border-[#333] text-[#c1c0b5] text-xs font-mono"
                                            />
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyOrgId}>
                                                <Copy className="w-4 h-4 text-[#c1c0b5]" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <h3 className="text-sm font-medium text-[#c1c0b5] mb-2">Active sessions</h3>
                                        <div className="rounded-lg border border-[#333] overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-[#262624]">
                                                        <th className="text-left py-2 px-3 text-[#c1c0b5]/70 font-medium">Device</th>
                                                        <th className="text-left py-2 px-3 text-[#c1c0b5]/70 font-medium">Created</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-t border-[#333]">
                                                        <td className="py-2 px-3 text-[#c1c0b5]">
                                                            {typeof navigator !== "undefined" ? `${navigator.userAgent.split(" ").slice(-2).join(" ")} (Current)` : "Current session"}
                                                        </td>
                                                        <td className="py-2 px-3 text-[#c1c0b5]/70">
                                                            {new Date().toLocaleString()}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "privacy" && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-[#c1c0b5]" />
                                        <h2 className="text-lg font-semibold text-[#f5f5dc]">Privacy</h2>
                                    </div>
                                    <p className="text-sm text-[#c1c0b5]/80">
                                        MAR believes in transparent data practices. Learn how your information is protected when using MAR products, and visit our{" "}
                                        <a href="https://gomarai.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                            Terms of Service
                                        </a>{" "}
                                        and{" "}
                                        <a href="https://gomarai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                            Privacy Policy
                                        </a>{" "}
                                        for more details.
                                    </p>

                                    <Collapsible title="How we protect your data" defaultOpen>
                                        <ul className="list-disc list-inside space-y-1 text-[#c1c0b5]/80">
                                            <li>You have control over your conversation data and can change your preferences any time in your Privacy Settings.</li>
                                            <li>MAR deletes your data promptly when requested, except for safety violations or conversations you&apos;ve shared.</li>
                                            <li>MAR doesn&apos;t sell your data to third parties.</li>
                                        </ul>
                                    </Collapsible>
                                    <Collapsible title="How we use your data">
                                        <ul className="list-disc list-inside space-y-1 text-[#c1c0b5]/80">
                                            <li>With your permission, we may use your chats to train and improve our AI models.</li>
                                            <li>MAR may use your email for account verification and communications.</li>
                                            <li>MAR may conduct aggregated, anonymized analysis of data.</li>
                                        </ul>
                                    </Collapsible>

                                    <div>
                                        <h3 className="text-sm font-medium text-[#c1c0b5] mb-3">Privacy settings</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-sm text-[#c1c0b5]">Export data</span>
                                                <Button variant="outline" size="sm" className="border-[#333] hover:bg-[#262624]" onClick={handleExportData}>
                                                    Export data
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <div>
                                                    <p className="text-sm text-[#c1c0b5]">Archive all chats</p>
                                                    <p className="text-xs text-[#c1c0b5]/60">Move all chats to archived.</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-[#333] hover:bg-[#262624]"
                                                    onClick={() => {
                                                        conversations.forEach((c) => updateConversation(c.id, { isArchived: true }));
                                                        toast.success("All chats archived");
                                                    }}
                                                    disabled={conversations.filter((c) => !c.isArchived).length === 0}
                                                >
                                                    Archive all
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <div>
                                                    <p className="text-sm text-[#c1c0b5]">Delete all chats</p>
                                                    <p className="text-xs text-[#c1c0b5]/60">Permanently delete all conversations and messages.</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                                                    onClick={() => {
                                                        const toDelete = [...conversations];
                                                        toDelete.forEach((c) => deleteConversation(c.id));
                                                        toast.success("All chats deleted");
                                                    }}
                                                    disabled={conversations.length === 0}
                                                >
                                                    Delete all
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <div>
                                                    <p className="text-sm text-[#c1c0b5]">Location metadata</p>
                                                    <p className="text-xs text-[#c1c0b5]/60">
                                                        Allow MAR to use coarse location metadata (city/region) to improve product experiences.{" "}
                                                        <a href="https://gomarai.com/privacy" className="text-blue-400 hover:underline">Learn more</a>.
                                                    </p>
                                                </div>
                                                <Switch checked={locationMetadata} onCheckedChange={setLocationMetadata} />
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <div>
                                                    <p className="text-sm text-[#c1c0b5]">Help improve MAR</p>
                                                    <p className="text-xs text-[#c1c0b5]/60">
                                                        Allow the use of your chats to train and improve MAR AI models.{" "}
                                                        <a href="https://gomarai.com/privacy" className="text-blue-400 hover:underline">Learn more</a>.
                                                    </p>
                                                </div>
                                                <Switch checked={helpImproveMAR} onCheckedChange={setHelpImproveMAR} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "capabilities" && (
                                <div className="space-y-8">
                                    <h2 className="text-lg font-semibold text-[#f5f5dc]">Capabilities</h2>

                                    <div className="flex items-start justify-between py-4 border-b border-[#333]">
                                        <div>
                                            <p className="text-sm font-medium text-[#c1c0b5]">Artifacts</p>
                                            <p className="text-xs text-[#c1c0b5]/60 mt-1">
                                                Ask MAR to generate content like code snippets, text documents, or website designs, and MAR will create an Artifact that appears in a dedicated window alongside your conversation.
                                            </p>
                                        </div>
                                        <Switch checked={artifactsEnabled} onCheckedChange={setArtifactsEnabled} />
                                    </div>
                                    <div className="flex items-start justify-between py-4 border-b border-[#333]">
                                        <div>
                                            <p className="text-sm font-medium text-[#c1c0b5]">AI-powered artifacts</p>
                                            <p className="text-xs text-[#c1c0b5]/60 mt-1">
                                                Create apps, prototypes, and interactive documents that use MAR inside the artifact.
                                            </p>
                                        </div>
                                        <Switch checked={aiPoweredArtifactsEnabled} onCheckedChange={setAiPoweredArtifactsEnabled} />
                                    </div>
                                    <div className="flex items-start justify-between py-4 border-b border-[#333]">
                                        <div>
                                            <p className="text-sm font-medium text-[#c1c0b5]">Code execution and file creation</p>
                                            <p className="text-xs text-[#c1c0b5]/60 mt-1">
                                                MAR can execute code and create and edit docs, spreadsheets, presentations, and data reports.
                                            </p>
                                        </div>
                                        <Switch checked={codeExecutionEnabled} onCheckedChange={setCodeExecutionEnabled} />
                                    </div>
                                    <div className="flex items-start justify-between py-4 border-b border-[#333]">
                                        <div>
                                            <p className="text-sm font-medium text-[#c1c0b5]">Allow network egress</p>
                                            <p className="text-xs text-[#c1c0b5]/60 mt-1">
                                                Allow MAR to access common package managers. Monitor chats closely as this comes with{" "}
                                                <a href="https://gomarai.com/security" className="text-blue-400 hover:underline">security risks</a>.
                                            </p>
                                        </div>
                                        <Switch checked={allowNetworkEgress} onCheckedChange={setAllowNetworkEgress} />
                                    </div>
                                    <div className="pt-4">
                                        <p className="text-sm font-medium text-[#c1c0b5] mb-2">Skills</p>
                                        <p className="text-xs text-[#c1c0b5]/60 mb-3">
                                            Repeatable, customizable instructions that MAR can follow in any chat.{" "}
                                            <a href="https://gomarai.com" className="text-blue-400 hover:underline">Learn more</a>.
                                        </p>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add skill (e.g. Always respond in Python)"
                                                value={newSkillText}
                                                onChange={(e) => setNewSkillText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        if (newSkillText.trim()) {
                                                            addSkill(newSkillText);
                                                            setNewSkillText("");
                                                            toast.success("Skill added");
                                                        }
                                                    }
                                                }}
                                                className="flex-1 bg-[#262624] border-[#333] text-[#c1c0b5]"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-[#333] hover:bg-[#262624]"
                                                onClick={() => {
                                                    if (newSkillText.trim()) {
                                                        addSkill(newSkillText);
                                                        setNewSkillText("");
                                                        toast.success("Skill added");
                                                    }
                                                }}
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Add
                                            </Button>
                                        </div>
                                        {skills.length > 0 ? (
                                            <ul className="mt-3 space-y-2">
                                                {skills.map((s, i) => (
                                                    <li
                                                        key={i}
                                                        className="flex items-center justify-between gap-2 rounded-lg border border-[#333] bg-[#262624] px-3 py-2 text-sm text-[#c1c0b5]"
                                                    >
                                                        <span className="flex-1 truncate">{s}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-red-500 hover:bg-red-500/10"
                                                            onClick={() => removeSkill(i)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-[#c1c0b5]/50 mt-3">No skills added by you yet</p>
                                        )}

                                        <Collapsible title="Things MAR should remember" defaultOpen={false}>
                                            <p className="text-[#c1c0b5]/70 mb-3">Facts MAR will use across all conversations.</p>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Add fact (e.g. I work from home on Fridays)"
                                                    value={newMemoryFact}
                                                    onChange={(e) => setNewMemoryFact(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            if (newMemoryFact.trim()) {
                                                                addMemoryFact(newMemoryFact);
                                                                setNewMemoryFact("");
                                                                toast.success("Fact saved");
                                                            }
                                                        }
                                                    }}
                                                    className="flex-1 bg-[#262624] border-[#333] text-[#c1c0b5]"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-[#333] hover:bg-[#262624]"
                                                    onClick={() => {
                                                        if (newMemoryFact.trim()) {
                                                            addMemoryFact(newMemoryFact);
                                                            setNewMemoryFact("");
                                                            toast.success("Fact saved");
                                                        }
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Add
                                                </Button>
                                            </div>
                                            {memoryFacts.length > 0 ? (
                                                <ul className="mt-3 space-y-2">
                                                    {memoryFacts.map((f, i) => (
                                                        <li
                                                            key={i}
                                                            className="flex items-center justify-between gap-2 rounded-lg border border-[#333] bg-[#262624] px-3 py-2 text-sm text-[#c1c0b5]"
                                                        >
                                                            <span className="flex-1 truncate">{f}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-red-500 hover:bg-red-500/10"
                                                                onClick={() => removeMemoryFact(i)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-[#c1c0b5]/50 mt-3">No facts added yet</p>
                                            )}
                                        </Collapsible>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
