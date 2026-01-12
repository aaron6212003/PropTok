
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

export default function PropRow({ id, question, yesMultiplier, noMultiplier, category = "Sports" }: PropRowProps) {
    const { items, toggleInSlip } = useBetSlip();

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

    // Clean up the question for display
    // "Will LeBron James record Over 25.5 PLAYER POINTS?" -> "Over 25.5 PLAYER POINTS"
    let displayQuestion = question;

    // 1. Remove "Will [Any Name] record" prefix
    displayQuestion = displayQuestion.replace(/Will .* record\s+/i, '');

    // 2. Remove trailing question mark
    displayQuestion = displayQuestion.replace(/\?$/, '');

    // 3. Keep everything else (Line + Stat)

    return (
        <div className={cn(
            "flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 border mb-1",
            selectedSide
                ? "bg-white/[0.08] border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                : "bg-zinc-900/50 border-white/5 hover:border-white/10"
        )}>
            <p className={cn(
                "font-bold text-[11px] leading-tight transition-colors pr-2 flex-1",
                selectedSide ? "text-white" : "text-zinc-400"
            )} title={question}>{displayQuestion}</p>

            <div className="flex gap-1.5 shrink-0">
                <button
                    onClick={() => handleAdd('YES')}
                    className={cn(
                        "w-20 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all truncate",
                        selectedSide === 'YES'
                            ? "bg-[#00DC82] text-black shadow-[0_0_10px_rgba(0,220,130,0.4)]"
                            : "bg-zinc-800 text-[#00DC82] border border-[#00DC82]/10 hover:bg-[#00DC82]/20"
                    )}
                >
                    {yesMultiplier}x
                </button>
                <button
                    onClick={() => handleAdd('NO')}
                    className={cn(
                        "w-20 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all truncate",
                        selectedSide === 'NO'
                            ? "bg-[#FF2A6D] text-white shadow-[0_0_10px_rgba(255,42,109,0.4)]"
                            : "bg-zinc-800 text-[#FF2A6D] border border-[#FF2A6D]/10 hover:bg-[#FF2A6D]/20"
                    )}
                >
                    {noMultiplier}x
                </button>
            </div>
        </div>
    );
}
