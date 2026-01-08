"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, Layers } from "lucide-react";

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
    const isBundle = bet.isBundle || !!bet.legs;
    const isResolved = isBundle ? bet.status !== 'PENDING' : bet.predictions?.resolved;
    const isWin = isBundle ? bet.status === 'WON' : (isResolved && bet.side === bet.predictions?.outcome);
    const isLoss = isResolved && !isWin;

    const multiplier = isBundle ? bet.total_multiplier : bet.payout_multiplier;
    const potentialPayout = bet.wager * (multiplier || 1);

    return (
        <div className="group relative flex flex-col gap-3 rounded-2xl border border-white/5 bg-zinc-900/50 p-4 transition-all hover:bg-zinc-900">
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
            </div>

            <h4 className="line-clamp-2 text-sm font-bold leading-snug">
                {isBundle
                    ? `${bet.legs?.length}-Leg Multiplier`
                    : bet.predictions?.question}
            </h4>

            {isBundle && bet.legs && (
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
                        ${bet.wager} {!isBundle && `on ${bet.side}`}
                    </span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {isResolved && isWin ? "Won" : "Potential"}
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
    );
}
