"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/lib/store/settings-store";

interface OnboardingDialogProps {
    open: boolean;
    onComplete: () => void;
}

export function OnboardingDialog({ open, onComplete }: OnboardingDialogProps) {
    const [step, setStep] = useState(0);
    const { setWhatShouldCallYou, setProfileName, whatShouldCallYou, profileName } = useSettingsStore();
    const [name, setName] = useState("");
    useEffect(() => {
        if (open) setName(whatShouldCallYou || profileName || "");
    }, [open, whatShouldCallYou, profileName]);

    const handleFinish = () => {
        const displayName = name.trim();
        if (displayName) {
            setWhatShouldCallYou(displayName);
            setProfileName(displayName);
        }
        onComplete();
    };

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-md bg-[#1e1e1c] border-[#333] text-[#c1c0b5]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 flex items-center justify-center gap-2">
                        <span className="text-3xl text-amber-400/90">✦</span>
                        <span className="text-xl font-normal italic text-white" style={{ fontFamily: '"Times New Roman", Times, serif' }}>MAR Chat</span>
                    </div>
                    <DialogTitle className="text-2xl text-[#f5f5dc]">
                        {step === 0 ? "Welcome to MAR Chat" : "One more thing"}
                    </DialogTitle>
                    <DialogDescription className="text-[#c1c0b5]/70">
                        {step === 0
                            ? "We're committed to 100% free AI forever for everyone."
                            : "What should MAR call you?"}
                    </DialogDescription>
                </DialogHeader>

                {step === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="rounded-lg border border-[#333] bg-[#262624] p-4 space-y-2 text-sm text-[#c1c0b5]/90">
                            <p className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400/90 shrink-0" /><strong>100% free AI</strong> — No subscriptions, no paywalls</p>
                            <p className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400/90 shrink-0" /><strong>Forever for everyone</strong> — Accessible to all</p>
                            <p className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400/90 shrink-0" /><strong>Privacy-first</strong> — Your data stays yours</p>
                            <p className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-400/90 shrink-0" /><strong>Open & transparent</strong> — No hidden limits</p>
                        </div>
                        <Button
                            className="w-full bg-[#f5f5dc] text-[#262624] hover:bg-[#e0dfd4]"
                            onClick={() => setStep(1)}
                        >
                            Continue
                        </Button>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div>
                            <Label className="text-sm text-[#c1c0b5]">What should MAR call you?</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Alex"
                                className="mt-2 bg-[#262624] border-[#333] text-[#c1c0b5]"
                                onKeyDown={(e) => e.key === "Enter" && handleFinish()}
                            />
                        </div>
                        <Button
                            className="w-full bg-[#f5f5dc] text-[#262624] hover:bg-[#e0dfd4]"
                            onClick={handleFinish}
                        >
                            Get started
                        </Button>
                    </motion.div>
                )}
            </DialogContent>
        </Dialog>
    );
}
