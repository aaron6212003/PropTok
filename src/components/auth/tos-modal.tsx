"use client";

import { useState, useEffect } from "react";
import { acceptTos } from "@/app/actions";
import { ShieldCheck, Lock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function TosModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        checkTosStatus();
    }, []);

    const checkTosStatus = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const { data: profile } = await supabase
            .from("users")
            .select("tos_accepted_at")
            .eq("id", user.id)
            .single();

        if (profile && !profile.tos_accepted_at) {
            setIsOpen(true);
        }
    };

    const handleAccept = async () => {
        setIsLoading(true);

        // Mock IP/Region for now (In prod, use headers or external service)
        const mockIp = "127.0.0.1";
        const mockRegion = "USA-Test";

        const res = await acceptTos(mockIp, mockRegion);

        if (res?.error) {
            toast.error("Failed to accept TOS", { description: res.error });
            setIsLoading(false);
        } else {
            toast.success("Welcome to Real Money Gaming!");
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
            <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <ShieldCheck size={24} />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Legal Compliance</h2>
                    <p className="text-sm text-zinc-400">
                        To access Real Money Gaming features, you must agree to our Terms of Service and verify your location.
                    </p>
                </div>

                <div className="space-y-4 rounded-xl bg-black/50 p-4 border border-white/5">
                    <div className="flex items-start gap-3">
                        <Lock size={16} className="mt-1 text-zinc-500" />
                        <p className="text-xs text-zinc-400">
                            I verify that I am at least 18 years of age and not located in a restricted jurisdiction (WA, NV, ID, MT).
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin size={16} className="mt-1 text-zinc-500" />
                        <p className="text-xs text-zinc-400">
                            I consent to location verification checks and acknowledge that VPN usage is prohibited.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleAccept}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-brand py-4 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-brand/20 transition-transform active:scale-95 disabled:opacity-50"
                >
                    {isLoading ? "Verifying..." : "I Agree & Continue"}
                </button>
            </div>
        </div>
    );
}
