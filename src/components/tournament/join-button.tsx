"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

interface JoinButtonProps {
    tournamentId: string;
    entryFeeCents: number;
    isLoggedIn: boolean;
}

export default function JoinButton({ tournamentId, entryFeeCents, isLoggedIn }: JoinButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleJoin = async () => {
        if (!isLoggedIn) {
            router.push("/login");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/stripe/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tournamentId }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to initiate payment");
            }

            const { url } = await res.json();
            if (url) {
                window.location.href = url;
            } else {
                throw new Error("No payment URL returned");
            }
        } catch (e: any) {
            toast.error(e.message);
            setLoading(false);
        }
    };

    const feeFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(entryFeeCents / 100);

    return (
        <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full relative flex items-center justify-center gap-2 rounded-xl bg-[#00DC82] py-4 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-[#00DC82]/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:grayscale"
        >
            {loading ? (
                <Loader2 className="animate-spin" />
            ) : (
                <>
                    <CreditCard size={18} />
                    Pay {feeFormatted} Entry
                </>
            )}
        </button>
    );
}
