"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Gift } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { redeemPromoCode } from "@/app/actions";

export default function DepositPage() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRedeem = async () => {
        if (!code) return;
        setLoading(true);
        try {
            const result = await redeemPromoCode(code);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Success! $${result.value} added to your wallet.`);
                setCode("");
                router.refresh();
                // Optional: Redirect back to wallet or profile
            }
        } catch (e) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full flex-col bg-black text-white p-6">
            <div className="mb-8 flex items-center gap-4">
                <Link href="/profile" className="rounded-full bg-zinc-900 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-black uppercase tracking-widest">Deposit Funds</h1>
            </div>

            <div className="flex flex-col items-center justify-center flex-1 max-w-md mx-auto w-full">
                <div className="mb-8 rounded-full bg-emerald-500/10 p-6 text-emerald-500 ring-1 ring-emerald-500/20">
                    <Gift size={40} />
                </div>

                <h2 className="mb-2 text-2xl font-bold text-center">Have a Promo Code?</h2>
                <p className="mb-8 text-center text-zinc-500 text-sm">
                    Enter your code below to instantly add funds to your account.
                </p>

                <div className="w-full space-y-4">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE (e.g. WELCOME50)"
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-4 text-center text-lg font-bold tracking-widest text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                    />

                    <button
                        onClick={handleRedeem}
                        disabled={loading || !code}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 font-black uppercase tracking-widest text-black transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none hover:bg-emerald-400"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Redeem Code"}
                    </button>
                </div>

                <p className="mt-8 text-xs text-zinc-600 text-center uppercase tracking-wider">
                    Don't have a code?<br />Contact Support to purchase credits.
                </p>
            </div>
        </div>
    );
}
