"use client";

import { useBetSlip } from "@/lib/context/bet-slip-context";
import { placeBundleWager, submitVote } from "@/app/actions";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BetSlip() {
    const { items, isOpen, setIsOpen, removeFromSlip, clearSlip } = useBetSlip();
    const [wager, setWager] = useState(25);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (items.length === 0) return null;

    // Calculate Odds
    const totalMultiplier = items.reduce((acc, item) => acc * item.multiplier, 1);
    const payout = (wager * totalMultiplier).toFixed(0);

    const handlePlaceBet = async () => {
        setIsSubmitting(true);
        try {
            if (items.length === 1) {
                // Single Bet
                const item = items[0];
                const res = await submitVote(item.predictionId, item.side, wager);
                if (res.error) alert(res.error);
                else {
                    alert("Bet Placed!");
                    clearSlip();
                }
            } else {
                // Bundle
                const legs = items.map(i => ({ id: i.predictionId, side: i.side, multiplier: i.multiplier }));
                const res = await placeBundleWager(legs, wager);
                if (res.error) alert(res.error);
                else {
                    alert("Bundle Placed!");
                    clearSlip();
                }
            }
        } catch (e) {
            console.error(e);
            alert("Error placing bet");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating Bar (Collapsed) */}
            {!isOpen && (
                <div className="fixed bottom-24 right-4 z-40">
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex items-center gap-3 rounded-full border border-white/10 bg-brand py-2.5 pl-3 pr-4 shadow-2xl backdrop-blur-xl transition-transform active:scale-95"
                        onClick={() => setIsOpen(true)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
                                {items.length}
                            </span>
                            <span className="text-[11px] font-black text-black uppercase tracking-wider">
                                {items.length > 1 ? "Parlay" : "Slip"}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 border-l border-black/10 pl-2">
                            <span className="text-xs font-black text-black">{totalMultiplier.toFixed(2)}x</span>
                            <ChevronUp className="text-black h-3.5 w-3.5" />
                        </div>
                    </motion.button>
                </div>
            )}

            {/* Expanded Drawer (Full Slip) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[60] flex h-[85vh] flex-col rounded-t-[32px] bg-zinc-900 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/5 p-6">
                                <div>
                                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Bet Slip</h2>
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{items.length} selections</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={clearSlip}
                                        className="rounded-full bg-white/5 p-2 text-zinc-400 hover:text-destructive"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="rounded-full bg-white/10 p-2 text-white"
                                    >
                                        <ChevronDown size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                                {items.map((item) => (
                                    <div key={item.predictionId} className="relative flex flex-col gap-2 rounded-2xl border border-white/5 bg-black/40 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <p className="text-sm font-bold leading-snug break-words line-clamp-2">{item.question}</p>
                                            <button
                                                onClick={() => removeFromSlip(item.predictionId)}
                                                className="shrink-0 text-zinc-500 hover:text-white"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest",
                                                item.side === 'YES' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                                            )}>
                                                {item.side}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-zinc-400">{item.multiplier}x</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Wager Controls */}
                            <div className="border-t border-white/10 bg-black p-6 pb-10">
                                <div className="mb-6 flex flex-col items-center">
                                    <div className="mb-2 flex items-baseline gap-1">
                                        <span className="text-5xl font-black text-white">${wager}</span>
                                        <span className="text-xs font-bold uppercase text-zinc-500">Wager</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="1000"
                                        value={wager}
                                        onChange={(e) => setWager(Number(e.target.value))}
                                        className="h-4 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-brand"
                                    />

                                    <div className="mt-4 flex w-full gap-2">
                                        {[10, 25, 50, 100].map(amt => (
                                            <button
                                                key={amt}
                                                onClick={() => setWager(amt)}
                                                className="flex-1 rounded-lg bg-zinc-900 py-2 text-xs font-bold hover:bg-zinc-800"
                                            >
                                                ${amt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between rounded-xl bg-zinc-900 p-4 mb-4">
                                    <span className="text-xs font-bold uppercase text-zinc-500">Total Odds</span>
                                    <span className="font-mono font-bold text-white">{totalMultiplier.toFixed(2)}x</span>
                                </div>

                                <button
                                    onClick={handlePlaceBet}
                                    disabled={isSubmitting}
                                    className="w-full rounded-2xl bg-brand py-4 text-xl font-black uppercase tracking-widest text-black shadow-lg shadow-brand/20 transition-transform active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Placing..." : `To Win $${payout}`}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
