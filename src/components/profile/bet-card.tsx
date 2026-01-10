"use client";
// Last Sync: 2026-01-09T00:33:00

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, Layers, ChevronDown, ChevronUp, Trophy, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { hideBet } from "@/app/actions";
import { toast } from "sonner";

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
        tournament?: {
            name: string;
        };
    };
}

export default function BetCard({ bet }: BetCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

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

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this bet from your history?")) return;

        setIsDeleting(true);
        // Trigger "Poof" animation immediately
        setIsVisible(false);

        try {
            const res = await hideBet(bet.id, isBundle);
            if (res.success) {
                toast.success("Bet Deleted", { icon: "💨" });
            } else {
                // Revert on failure
                toast.error(res.error || "Failed to delete");
                setIsVisible(true);
                setIsDeleting(false);
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
            setIsVisible(true);
            setIsDeleting(false);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{
                        opacity: 0,
                        scale: 0.5,
                        filter: "blur(10px)",
                        transition: { duration: 0.3 }
                    }}
                    className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5"
                >
                    <div
                        className={cn(
                            "flex flex-col gap-3 p-4 transition-colors cursor-pointer",
                            isExpanded ? "bg-zinc-800/50" : "hover:bg-zinc-800/30"
                        )}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
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
                                {bet.tournament?.name && (
                                    <div className="flex items-center gap-1 rounded bg-orange-500/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-orange-500">
                                        <Trophy size={10} /> {bet.tournament.name}
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

                                {isResolved && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all hover:scale-110 active:scale-90"
                                        title="Delete Bet"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <h4 className="line-clamp-2 text-sm font-bold leading-snug pr-8">
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
                                                // const legLost = legResolved && !legWon; // Unused variable

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
                </motion.div>
            )}
        </AnimatePresence>
    );
}
