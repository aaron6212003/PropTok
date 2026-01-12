"use client";

import { useState } from 'react';
import { redeemPromoCode } from '@/app/actions';
import { toast } from 'sonner';
import { Loader2, Gift, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RedeemForm() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        setLoading(true);
        try {
            const res = await redeemPromoCode(code.trim());
            if (res.success) {
                toast.success(`Code Redeemed! Added $${res.value} to your balance.`);
                setCode("");
                router.refresh();
                router.push('/wallet'); // Go back to wallet main view
            } else {
                toast.error(res.error || "Invalid Code");
            }
        } catch (e) {
            toast.error("Network Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20">
                <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 animate-in zoom-in spin-in-3 duration-500">
                    <Gift className="text-white h-8 w-8" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">Promo Code</h2>
                <p className="text-sm text-zinc-400 text-center">Enter your code below to claim free cash.</p>
            </div>

            <form onSubmit={handleRedeem} className="space-y-4">
                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1 mb-2 block">
                        Enter Code
                    </label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. WELCOME50"
                        className="w-full bg-zinc-900 border-2 border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-4 text-center font-black text-xl text-white placeholder:text-zinc-700 uppercase tracking-widest transition-all outline-none"
                    />
                </div>

                <button
                    disabled={!code.trim() || loading}
                    type="submit"
                    className="w-full py-4 rounded-xl bg-white text-black font-black text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                    {loading ? "Verifying..." : "Redeem Code"}
                </button>
            </form>
        </div>
    );
}
