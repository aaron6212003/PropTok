"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BetCardProps {
    bet: {
        id: string;
        created_at: string;
        wager: number;
        side?: string;
        payout_multiplier?: number;
        total_multiplier?: number;
        status?: string;
        predictions?: any;
        legs?: any[];
        isBundle?: boolean;
    };
}

export default function BetCard({ bet }: BetCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isBundle = bet.isBundle || !!bet.legs;

    // Determine status for Bundles more robustly
    let status = bet.status || 'PENDING';
    if (isBundle && status === 'PENDING' && bet.legs && bet.legs.length > 0) {
        const hasLoss = bet.legs.some(l => l.prediction?.resolved && l.side !== l.prediction?.outcome);
        const allWon = bet.legs.every(l => l.prediction?.resolved && l.side === l.prediction?.outcome);
        if (hasLoss) status = 'LOST';
        else if (allWon) status = 'WON';
    }

    const isResolved = isBundle ? status !== 'PENDING' : bet.predictions?.resolved;
    const isWin = isBundle ? status === 'WON' : (isResolved && bet.side === bet.predictions?.outcome);
    const isLoss = isResolved && !isWin;

    const multiplier = isBundle ? bet.total_multiplier : bet.payout_multiplier;
    const potentialPayout = bet.wager * (multiplier || 1);

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
                "group relative flex flex-col gap-3 rounded-2xl border transition-all cursor-pointer",
                isExpanded ? "border-white/20 bg-zinc-900 shadow-2xl" : "border-white/5 bg-zinc-900/50 hover:bg-zinc-900"
            )}
        >
            <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            {new Date(bet.created_at).toLocaleDateString()}
                        </span>
                        {isBundle && (
                            <div className="flex items-center gap-1 rounded bg-brand/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-brand">
                                <Layers size={10} /> PARLAY
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {isResolved ? (
                            isWin ? (
                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-success">
                                    <CheckCircle2 size={12} /> WON
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-destructive">
                                    <XCircle size={12} /> LOST
                                </div>
                            )
                        ) : (
                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand animate-pulse">
                                <Clock size={12} /> PENDING
                            </div>
                        )}
                        {isExpanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                    </div>
                </div>

                <h4 className="line-clamp-2 text-sm font-bold leading-snug">
                    {isBundle
                        ? `${bet.legs?.length}-Leg Multiplier`
                        : bet.predictions?.question}
                </h4>

                {isBundle && bet.legs && !isExpanded && (
                    <div className="flex flex-wrap gap-1">
                        {bet.legs.map((leg: any, idx: number) => {
                            const legResolved = leg.prediction?.resolved;
                            const legWon = legResolved && leg.side === leg.prediction?.outcome;
                            return (
                                <div key={idx} className={cn(
                                    "h-1 w-6 rounded-full",
                                    !legResolved ? "bg-zinc-700" : legWon ? "bg-success" : "bg-destructive"
                                )} title={leg.prediction?.question} />
                            );
                        })}
                    </div>
                )}

                <div className="flex items-center justify-between rounded-xl bg-black/40 p-3">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            {isBundle ? "Total Stake" : "Wager"}
                        </span>
                        <span className="text-sm font-bold">
                            ${bet.wager} {!isBundle && <span className="text-zinc-400">on</span>} {!isBundle && <span className={cn("px-1.5 py-0.5 rounded text-[10px] ml-1", bet.side === 'YES' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>{bet.side}</span>}
                        </span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            {isResolved && isWin ? "Payout" : "Potential"}
                        </span>
                        <span className={cn(
                            "text-sm font-black",
                            isWin ? "text-success" : isLoss ? "text-zinc-500 line-through" : "text-white"
                        )}>
                            ${potentialPayout.toFixed(0)}
                        </span>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/5"
                    >
                        <div className="p-4 bg-black/20 space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">My Selections</span>
                            <div className="space-y-3">
                                {isBundle ? (
                                    bet.legs?.map((leg: any, idx: number) => {
                                        const legResolved = leg.prediction?.resolved;
                                        const legWon = legResolved && leg.side === leg.prediction?.outcome;
                                        const legLost = legResolved && !legWon;

                                        return (
                                            <div key={idx} className="flex flex-col gap-2 rounded-xl bg-white/5 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-xs font-bold leading-relaxed flex-1">{leg.prediction?.question}</p>
                                                    {!legResolved ? (
                                                        <Clock size={14} className="text-zinc-600 shrink-0" />
                                                    ) : legWon ? (
                                                        <CheckCircle2 size={14} className="text-success shrink-0" />
                                                    ) : (
                                                        <XCircle size={14} className="text-destructive shrink-0" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 italic">Picked:</span>
                                                    <span className={cn(
                                                        "rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                                                        leg.side === 'YES' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                                                    )}>
                                                        {leg.side}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold text-zinc-500 ml-auto">{leg.multiplier}x</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex flex-col gap-2 rounded-xl bg-white/5 p-3">
                                        <p className="text-xs font-bold leading-relaxed">{bet.predictions?.question}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 italic">Picked:</span>
                                            <span className={cn(
                                                "rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                                                bet.side === 'YES' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                                            )}>
                                                {bet.side}
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-zinc-500 ml-auto">{bet.payout_multiplier}x</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
