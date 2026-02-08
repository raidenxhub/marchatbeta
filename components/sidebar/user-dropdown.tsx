"use client";

import { useSettingsStore } from "@/lib/store/settings-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { createClient } from "@/lib/supabase/client";
import { getTranslation } from "@/lib/data/languages";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
    Settings,
    HelpCircle,
    Globe,
    LogOut,
    LogIn,
    CreditCard,
    Info,
    Shield,
    Lock,
    FileText,
    Bug,
    Flag,
    Beaker,
    ChevronUp,
    ChevronDown,
} from "lucide-react";

export function UserDropdown({ user, compact, onLoginClick }: { user?: any; compact?: boolean; onLoginClick?: () => void }) {
    const { setIsOpen: setSettingsOpen, language, setLanguage, profileName, profileAvatarUrl } = useSettingsStore();
    const signOut = useAuthStore((s) => s.signOut);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        signOut();
    };
    const t = (key: string) => getTranslation(language, key);

    if (!user && onLoginClick) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            onClick={onLoginClick}
                            className={compact
                                ? "h-9 w-9 p-0 rounded-lg text-[#c1c0b5]/70 hover:text-[#c1c0b5] hover:bg-[#262624]"
                                : "h-14 w-full justify-start gap-3 px-3 rounded-lg text-[#c1c0b5]/70 hover:text-[#c1c0b5] hover:bg-[#262624]"
                            }
                        >
                            {compact ? (
                                <LogIn className="w-4 h-4" />
                            ) : (
                                <span className="text-sm font-medium">Login</span>
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Login</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    const displayName = profileName || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
    const avatarUrl = user?.user_metadata?.avatar_url ?? profileAvatarUrl ?? "";
    const email = user?.email ?? "";

    const initials = displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={compact
                        ? "relative h-9 w-9 p-0 rounded-lg text-[var(--mar-fg)] hover:bg-[var(--mar-bg)]"
                        : "relative h-14 w-full justify-start gap-3 px-3 rounded-lg text-[var(--mar-fg)] hover:bg-[var(--mar-bg)]"
                    }
                >
                    <Avatar className={compact ? "h-8 w-8 shrink-0 border border-[var(--mar-fg-muted)]/30" : "h-8 w-8 shrink-0 border border-[var(--mar-fg-muted)]/30"}>
                        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                        <AvatarFallback className="bg-[var(--mar-bg)] text-[var(--mar-fg)] text-sm">{initials}</AvatarFallback>
                    </Avatar>
                    {!compact && (
                    <div className="flex flex-col items-start min-w-0 flex-1 text-left">
                        <span className="text-sm font-medium text-[var(--mar-fg)] truncate w-full">{displayName}</span>
                    </div>
                    )}
                    {!compact && (
                    <div className="flex flex-col shrink-0 text-[var(--mar-fg)]/40">
                        <ChevronUp className="w-3.5 h-3.5" />
                        <ChevronDown className="w-3.5 h-3.5 -mt-0.5" />
                    </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-[var(--mar-bg-secondary)] border-[var(--mar-fg-muted)]/30" align="start" forceMount>
                <DropdownMenuLabel className="font-normal py-3">
                    <div className="flex flex-col space-y-1.5">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground dark:text-[#c1c0b5]/50">Name</p>
                            <p className="text-sm font-medium leading-none text-[var(--mar-fg)] dark:text-[#c1c0b5]">{displayName}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground dark:text-[#c1c0b5]/50">Email</p>
                            <p className="text-xs leading-none text-muted-foreground dark:text-[#c1c0b5]/80 break-all">{email}</p>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#333] dark:bg-[#333]" />

                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{t("settings")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Globe className="mr-2 h-4 w-4" />
                            <span>{t("language")}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            {/* Note: This is a simplified list for the dropdown, 
                  full list is in settings dialog to avoid huge menu */}
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => setLanguage("en")}>English</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("es")}>Español</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("fr")}>Français</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("de")}>Deutsch</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage("zh")}>中文</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                                    More...
                                </DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <a href="https://gomarai.com/contact" target="_blank" rel="noopener noreferrer">
                            <HelpCircle className="mr-2 h-4 w-4" />
                            <span>{t("help")}</span>
                        </a>
                    </DropdownMenuItem>



                </DropdownMenuGroup>

                <DropdownMenuSeparator className="bg-[#333] dark:bg-[#333]" />

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="focus:bg-[var(--mar-bg)] dark:focus:bg-[#333]">
                        <Info className="mr-2 h-4 w-4" />
                        <span>{t("learnMore")}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-56 bg-[var(--mar-bg-secondary)] border-[var(--mar-fg-muted)] dark:bg-[#1e1e1c] dark:border-[#333] py-2 rounded-lg shadow-xl">
                            <p className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground dark:text-[#c1c0b5]/50 font-medium">Learn more</p>
                            <DropdownMenuItem asChild className="focus:bg-[var(--mar-bg)] dark:focus:bg-[#262624]">
                                <a href="https://gomarai.com/api-docs" target="_blank" rel="noopener noreferrer">
                                    <FileText className="mr-2 h-4 w-4" /> API Console
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="focus:bg-[var(--mar-bg)] dark:focus:bg-[#262624]">
                                <a href="https://gomarai.com/company" target="_blank" rel="noopener noreferrer">
                                    <Info className="mr-2 h-4 w-4" /> About MAR
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="focus:bg-[var(--mar-bg)] dark:focus:bg-[#262624]">
                                <a href="https://gomarai.com/terms" target="_blank" rel="noopener noreferrer">
                                    <FileText className="mr-2 h-4 w-4" /> {t("terms")}
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="focus:bg-[var(--mar-bg)] dark:focus:bg-[#262624]">
                                <a href="https://gomarai.com/privacy" target="_blank" rel="noopener noreferrer">
                                    <Shield className="mr-2 h-4 w-4" /> {t("privacy")}
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="focus:bg-[var(--mar-bg)] dark:focus:bg-[#262624]">
                                <a href="https://gomarai.com/bug-bounty" target="_blank" rel="noopener noreferrer">
                                    <Bug className="mr-2 h-4 w-4" /> Bug Bounty
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="focus:bg-[var(--mar-bg)] dark:focus:bg-[#262624]">
                                <a href="https://gomarai.com/report" target="_blank" rel="noopener noreferrer">
                                    <Flag className="mr-2 h-4 w-4" /> Report Issue
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="focus:bg-[var(--mar-bg)] dark:focus:bg-[#262624]">
                                <a href="https://gomarai.com/research" target="_blank" rel="noopener noreferrer">
                                    <Beaker className="mr-2 h-4 w-4" /> Research
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="focus:bg-[var(--mar-bg)] dark:focus:bg-[#262624]">
                                <a href="https://gomarai.com/security" target="_blank" rel="noopener noreferrer">
                                    <Lock className="mr-2 h-4 w-4" /> {t("security")}
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("logout")}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
