
"use client";

import { useBetSlip } from "@/context/bet-slip-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PropRowProps {
    id: string;
    question: string;
    yesMultiplier: number;
    noMultiplier: number;
    yesPercent: number;
}

export default function PropRow({ id, question, yesMultiplier, noMultiplier, yesPercent }: PropRowProps) {
    const { addToSlip } = useBetSlip();

    const handleAdd = (side: 'YES' | 'NO') => {
        addToSlip({
            id,
            question,
            outcome: side,
            wager: 0,
            payoutMultiplier: side === 'YES' ? yesMultiplier : noMultiplier,
            isBundle: false,
            yesPercent
        });
        toast.success(`Added to Slip: ${question} (${side})`);
    };

    return (
        <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="font-bold text-sm text-zinc-300 leading-tight">{question}</p>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => handleAdd('YES')}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-[#00DC82]/10 text-[#00DC82] text-xs font-black border border-[#00DC82]/20 hover:bg-[#00DC82]/20 active:scale-95 transition-all"
                    >
                        YES {yesMultiplier}x
                    </button>
                    <button
                        onClick={() => handleAdd('NO')}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-black border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all"
                    >
                        NO {noMultiplier}x
                    </button>
                </div>
            </div>
        </div>
    );
}
