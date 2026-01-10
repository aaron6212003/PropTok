"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Lock, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import BottomNavBar from "@/components/layout/bottom-nav";

const DEPOSIT_OPTIONS = [
    { value: 10, label: "$10.00", bonus: null },
    { value: 25, label: "$25.00", bonus: null },
    { value: 50, label: "$50.00", bonus: "Most Popular" },
    { value: 100, label: "$100.00", bonus: "Best Value" },
];

export default function DepositPage() {
    const router = useRouter();
    const [selectedAmount, setSelectedAmount] = useState<number>(50);
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: selectedAmount }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Checkout failed");
            if (!data.url) throw new Error("No checkout URL returned");

            // Redirect to Stripe
            window.location.href = data.url;
        } catch (error: any) {
            console.error(error);
            toast.error("Payment Error", { description: error.message });
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white pb-32">
            <header className="p-6 border-b border-white/10">
                <Link href="/wallet" className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white">
                    <ArrowLeft size={16} />
                    Back to Wallet
                </Link>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase">Add Funds</h1>
                <p className="text-sm text-zinc-400 mt-1">Securely deposit cash to your wallet.</p>
            </header>

            <div className="p-6 space-y-8 max-w-md mx-auto">
                {/* Amount Selection */}
                <section>
                    <label className="mb-4 block text-xs font-black uppercase tracking-widest text-zinc-500">Select Amount</label>
                    <div className="grid grid-cols-2 gap-4">
                        {DEPOSIT_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setSelectedAmount(option.value)}
                                className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl border-2 p-6 transition-all active:scale-95 ${selectedAmount === option.value
                                        ? "border-brand bg-brand/10 text-brand"
                                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
                                    }`}
                            >
                                {option.bonus && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black shadow-lg">
                                        {option.bonus}
                                    </span>
                                )}
                                <span className="text-2xl font-black tracking-tight">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Summary & Action */}
                <section className="rounded-3xl border border-white/10 bg-zinc-900 p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <span className="text-sm text-zinc-400">Processing Fee</span>
                        <span className="font-bold text-white">Free</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-white">Total Charge</span>
                        <span className="text-3xl font-black text-brand">${selectedAmount.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={isLoading}
                        className="w-full py-4 bg-brand text-black font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Lock size={18} />
                                <span>Pay with Stripe</span>
                            </>
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                        <ShieldCheck size={14} />
                        <span>256-bit SSL Secure Payment</span>
                    </div>
                </section>
            </div>

            <nav className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </nav>
        </main>
    );
}
