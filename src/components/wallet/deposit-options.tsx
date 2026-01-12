"use client";

import { useState } from "react";
import { DollarSign, Loader2 } from "lucide-react";

export default function DepositOptions() {
    const [loading, setLoading] = useState<number | null>(null);

    const handleDeposit = async (amount: number) => {
        setLoading(amount);
        try {
            const res = await fetch("/api/stripe/create-checkout-session", {
                method: "POST",
                body: JSON.stringify({ amount: amount * 100, type: 'deposit' }),
            });
            const { url } = await res.json();
            if (url) window.location.href = url;
            else setLoading(null);
        } catch (e) {
            console.error(e);
            setLoading(null);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-zinc-500 font-bold uppercase tracking-wider text-sm">Select Amount</h3>
            <div className="grid grid-cols-2 gap-4">
                {[10, 25, 50, 100].map((amt) => (
                    <button
                        key={amt}
                        onClick={() => handleDeposit(amt)}
                        disabled={loading !== null}
                        className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-zinc-900 border border-white/5 p-6 transition-all hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {loading === amt ? (
                            <Loader2 className="animate-spin text-emerald-500" />
                        ) : (
                            <>
                                <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-full">
                                    <DollarSign size={24} strokeWidth={3} />
                                </div>
                                <span className="text-2xl font-black text-white">${amt}</span>
                            </>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
