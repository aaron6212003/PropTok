
"use client";

import { useBetSlip } from "@/lib/context/bet-slip-context";
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
    const { items, toggleInSlip } = useBetSlip();

    // Check if this card is in the slip
    const slipItem = items.find(i => i.predictionId === id);
    const selectedSide = slipItem?.side || null;

    const handleAdd = (side: 'YES' | 'NO') => {
        toggleInSlip({
            predictionId: id,
            question,
            side,
            multiplier: side === 'YES' ? yesMultiplier : noMultiplier,
            category
        });
    };

    return (
        <div className={cn(
            "p-4 rounded-xl transition-all duration-300 border",
            selectedSide
                ? "bg-white/[0.05] border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                : "bg-zinc-900 border-white/5 hover:border-white/10"
        )}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className={cn(
                    "font-bold text-sm leading-tight transition-colors",
                    selectedSide ? "text-white" : "text-zinc-300"
                )}>{question}</p>
                <div className="flex gap-2 w-full shrink-0 sm:w-auto mt-3 sm:mt-0">
                    <button
                        onClick={() => handleAdd('YES')}
                        className={cn(
                            "flex-1 min-w-0 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all truncate",
                            selectedSide === 'YES'
                                ? "bg-[#00DC82] text-black shadow-[0_0_15px_rgba(0,220,130,0.4)]"
                                : "bg-black/40 text-[#00DC82] border border-[#00DC82]/20 hover:bg-[#00DC82]/10"
                        )}
                    >
                        YES {yesMultiplier}x
                    </button>
                    <button
                        onClick={() => handleAdd('NO')}
                        className={cn(
                            "flex-1 min-w-0 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all truncate",
                            selectedSide === 'NO'
                                ? "bg-[#FF2A6D] text-white shadow-[0_0_15px_rgba(255,42,109,0.4)]"
                                : "bg-black/40 text-[#FF2A6D] border border-[#FF2A6D]/20 hover:bg-[#FF2A6D]/10"
                        )}
                    >
                        NO {noMultiplier}x
                    </button>
                </div>
            </div>
        </div>
    );
}
