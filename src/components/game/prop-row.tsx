
"use client";

import { useBetSlip } from "@/lib/context/bet-slip-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PropRowProps {
    id: string;
    question: string;
    yesMultiplier: number;
    noMultiplier: number;
    yesPercent: number;
    category?: string;
}

export default function PropRow({ id, question, yesMultiplier, noMultiplier, yesPercent, category = "Sports" }: PropRowProps) {
    const { addToSlip } = useBetSlip();

    const handleAdd = (side: 'YES' | 'NO') => {
        addToSlip({
            predictionId: id,
            question,
            side,
            multiplier: side === 'YES' ? yesMultiplier : noMultiplier,
            category
        });

    };

    return (
        <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="font-bold text-sm text-zinc-300 leading-tight">{question}</p>
                <div className="flex gap-2 w-full shrink-0 sm:w-auto mt-3 sm:mt-0">
                    <button
                        onClick={() => handleAdd('YES')}
                        className="flex-1 min-w-0 py-2.5 px-3 rounded-xl bg-[#00DC82] text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,220,130,0.2)] hover:shadow-[0_0_25px_rgba(0,220,130,0.4)] active:scale-95 transition-all truncate"
                    >
                        YES {yesMultiplier}x
                    </button>
                    <button
                        onClick={() => handleAdd('NO')}
                        className="flex-1 min-w-0 py-2.5 px-3 rounded-xl bg-[#FF2A6D] text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(255,42,109,0.2)] hover:shadow-[0_0_25px_rgba(255,42,109,0.4)] active:scale-95 transition-all truncate"
                    >
                        NO {noMultiplier}x
                    </button>
                </div>
            </div>
        </div>
    );
}
