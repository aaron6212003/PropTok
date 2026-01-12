"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

import { joinTournamentWithBalance } from "@/app/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface JoinButtonProps {
    tournamentId: string;
    entryFeeCents: number;
    isLoggedIn: boolean;
    userBalance?: number;
}

export default function JoinButton({ tournamentId, entryFeeCents, isLoggedIn, userBalance = 0 }: JoinButtonProps) {
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

    const entryFeeDollars = entryFeeCents / 100;
    const canAfford = userBalance >= entryFeeDollars;

    // Formatter
    const fv = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const handleWalletJoin = async () => {
        setLoading(true);
        try {
            const result = await joinTournamentWithBalance(tournamentId);
            if (!result.success) {
                toast.error(result.error);
            } else {
                toast.success("Successfully joined the tournament!");
                // Force reload or redirect? The revalidatePath in action handles data, but we might want to refresh client feedback
            }
        } catch (e: any) {
            toast.error("Failed to join: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    // If affordable, we act as a "Confirm" Dialog Trigger or Direct Action?
    // Let's use a nice confirm dialog.

    if (canAfford) {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <button
                        className="w-full relative flex items-center justify-center gap-2 rounded-xl bg-[#00DC82] py-4 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-[#00DC82]/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:grayscale"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><CreditCard size={18} /> Join for {fv(entryFeeDollars)} </>}
                    </button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Entry</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            This will deduct <strong>{fv(entryFeeDollars)}</strong> from your current balance of <strong>{fv(userBalance)}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            onClick={handleWalletJoin}
                            className="w-full rounded-lg bg-[#00DC82] py-3 text-sm font-bold text-black hover:brightness-110 transition-all"
                        >
                            Confirm & Join
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full relative flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
                {loading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <>
                        <CreditCard size={18} />
                        Deposit & Pay {fv(entryFeeDollars)}
                    </>
                )}
            </button>
            <p className="text-center text-[10px] text-zinc-500">
                Insufficient wallet balance ({fv(userBalance)}). You will be redirected to Stripe.
            </p>
        </div>
    );
}
