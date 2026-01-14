
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
    expiresAt?: string;
}

export default function PropRow({ id, question, yesMultiplier, noMultiplier, category = "Sports", expiresAt }: PropRowProps) {
    const { items, toggleInSlip } = useBetSlip();

    const slipItem = items.find(i => i.predictionId === id);
    const selectedSide = slipItem?.side || null;

    // Check expiration
    const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

    const handleAdd = (side: 'YES' | 'NO') => {
        if (isExpired) return;
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
                : "bg-zinc-900/50 border-white/5 hover:border-white/10",
            isExpired && "opacity-60 grayscale pointer-events-none"
        )}>
            <div className="flex-1 pr-2">
                <p className={cn(
                    "font-bold text-[11px] leading-tight transition-colors",
                    selectedSide ? "text-white" : "text-zinc-400"
                )} title={question}>{displayQuestion}</p>
                {isExpired && (
                    <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest border border-red-500/20 animate-pulse">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                        Live • Suspended
                    </span>
                )}
            </div>

            <div className="flex gap-1.5 shrink-0">
                <button
                    onClick={() => handleAdd('YES')}
                    disabled={isExpired}
                    className={cn(
                        "w-20 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all truncate",
                        selectedSide === 'YES'
                            ? "bg-[#00DC82] text-black shadow-[0_0_10px_rgba(0,220,130,0.4)]"
                            : "bg-zinc-800 text-[#00DC82] border border-[#00DC82]/10 hover:bg-[#00DC82]/20",
                        isExpired && "bg-zinc-800/50 text-zinc-600 border-zinc-800 cursor-not-allowed hover:bg-zinc-800/50"
                    )}
                >
                    {yesMultiplier}x
                </button>
                <button
                    onClick={() => handleAdd('NO')}
                    disabled={isExpired}
                    className={cn(
                        "w-20 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all truncate",
                        selectedSide === 'NO'
                            ? "bg-[#FF2A6D] text-white shadow-[0_0_10px_rgba(255,42,109,0.4)]"
                            : "bg-zinc-800 text-[#FF2A6D] border border-[#FF2A6D]/10 hover:bg-[#FF2A6D]/20",
                        isExpired && "bg-zinc-800/50 text-zinc-600 border-zinc-800 cursor-not-allowed hover:bg-zinc-800/50"
                    )}
                >
                    {noMultiplier}x
                </button>
            </div>
        </div>
    );
}
