"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createPromoCode } from "@/app/actions";
import { Plus, Ticket } from "lucide-react";

export default function CreatePromoCodeForm() {
    const [code, setCode] = useState("");
    const [amount, setAmount] = useState(50);
    const [maxUses, setMaxUses] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!code) return;
        setLoading(true);
        try {
            const result = await createPromoCode(code, Number(amount), Number(maxUses));
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Code ${code} Created! Value: $${amount}`);
                setCode("");
            }
        } catch (e) {
            toast.error("Failed to create code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-indigo-500/10 p-2 text-indigo-500">
                    <Ticket size={20} />
                </div>
                <h2 className="text-lg font-bold">Generate Promo Code</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Code Name</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="e.g. SUMMER25"
                        className="w-full rounded-xl border border-white/10 bg-black px-4 py-2 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none uppercase"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Value ($)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black px-4 py-2 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Max Uses</label>
                    <input
                        type="number"
                        value={maxUses}
                        onChange={(e) => setMaxUses(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black px-4 py-2 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none"
                    />
                </div>
            </div>

            <button
                onClick={handleCreate}
                disabled={loading || !code}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
            >
                <Plus size={16} />
                {loading ? "Creating..." : "Create Code"}
            </button>
        </div>
    );
}
