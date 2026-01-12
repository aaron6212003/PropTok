"use client";

import { useState } from "react";
import { requestWithdrawal } from "@/app/actions";
import { toast } from "sonner";
import { Landmark, Loader2 } from "lucide-react";

export default function WithdrawButton({ currentBalance }: { currentBalance: number }) {
    const [loading, setLoading] = useState(false);

    const handleWithdraw = async () => {
        if (currentBalance <= 0) {
            toast.error("Nothing to withdraw!");
            return;
        }

        if (!confirm(`Are you sure you want to withdraw $${currentBalance.toFixed(2)}? (Simulated)`)) return;

        setLoading(true);
        try {
            const res = await requestWithdrawal(currentBalance);
            if (res.success) {
                toast.success("Cash out successful!", {
                    description: `Sent $${currentBalance.toFixed(2)} to your bank account.`
                });
            } else {
                toast.error(res.error || "Withdrawal failed");
            }
        } catch (e) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleWithdraw}
            disabled={loading || currentBalance <= 0}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
        >
            {loading ? (
                <Loader2 className="animate-spin" size={20} />
            ) : (
                <Landmark size={20} />
            )}
            {loading ? "Processing..." : "Withdraw Winnings"}
        </button>
    );
}
