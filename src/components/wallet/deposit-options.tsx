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

            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500 font-bold">$</div>
                <input
                    type="number"
                    min="5"
                    placeholder="Custom Amount"
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-8 pr-4 text-white font-bold placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const val = Number((e.target as HTMLInputElement).value);
                            if (val >= 5) handleDeposit(val);
                        }
                    }}
                />
                <button
                    onClick={() => {
                        const val = Number((document.querySelector('input[type="number"]') as HTMLInputElement).value);
                        if (val >= 5) handleDeposit(val);
                    }}
                    className="absolute inset-y-2 right-2 px-4 bg-emerald-500 text-black font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors"
                >
                    Deposit
                </button>
            </div>
        </div>
    );
}
