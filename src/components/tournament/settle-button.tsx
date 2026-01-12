"use client";

import { settleTournament } from "@/app/actions";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Trophy } from "lucide-react";

export default function SettleButton({ tournamentId }: { tournamentId: string }) {
    const [isSettling, setIsSettling] = useState(false);
    const [isDone, setIsDone] = useState(false);

    async function handleSettle() {
        if (!confirm("Are you sure? This will calculate payouts based on current stacks and distribute REAL CASH to winners.")) return;

        setIsSettling(true);
        try {
            const res = await settleTournament(tournamentId);
            if (res.success) {
                toast.success("Tournament Settled Successfully!");
                setIsDone(true);
            } else {
                toast.error(res.error || "Failed to settle tournament");
            }
        } catch (e) {
            toast.error("An error occurred");
        } finally {
            setIsSettling(false);
        }
    }

    if (isDone) {
        return (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/20 text-emerald-500 font-bold uppercase tracking-widest text-center justify-center">
                <CheckCircle2 size={16} />
                Settled
            </div>
        );
    }

    return (
        <button
            onClick={handleSettle}
            disabled={isSettling}
            className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
        >
            {isSettling ? (
                <Loader2 className="animate-spin" size={18} />
            ) : (
                <Trophy size={18} className="text-brand" />
            )}
            {isSettling ? "Settling..." : "Settle Tournament"}
        </button>
    );
}
