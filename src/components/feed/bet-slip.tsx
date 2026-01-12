"use client";

import { useBetSlip } from "@/lib/context/bet-slip-context";
import { placeBundleWager, submitVote, getUserTournamentEntries } from "@/app/actions";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Trash2, X } from "lucide-react";
import { cn, vibrate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BetSlipProps {
    bankroll: number;
}

export default function BetSlip({ bankroll }: BetSlipProps) {
    const { items, isOpen, setIsOpen, removeFromSlip, clearSlip, tournamentId: contextTournamentId } = useBetSlip();
    const [wager, setWager] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myTournaments, setMyTournaments] = useState<any[]>([]);
    const [activeWalletId, setActiveWalletId] = useState<string | "chips">("chips"); // Reverting to 'chips' default
    const router = useRouter();

    // Fetch Tournaments on Load
    useEffect(() => {
        const fetchTournaments = async () => {
            const entries = await getUserTournamentEntries();
            setMyTournaments(entries || []);
            if (contextTournamentId) {
                setActiveWalletId(contextTournamentId);
            }
        };
        fetchTournaments();
    }, [contextTournamentId]);

    // Derived Balance
    const activeBalance = activeWalletId === "chips"
        ? bankroll
        : myTournaments.find(t => t.tournament_id === activeWalletId)?.current_stack || 0;

    // Default wager
    useEffect(() => {
        if (wager === 0 && activeBalance > 0) {
            setWager(Math.min(25, activeBalance));
        }
        if (wager > activeBalance) {
            setWager(activeBalance);
        }
    }, [activeBalance, wager]);

    if (items.length === 0) return null;

    // Odds
    const totalMultiplier = items.reduce((acc, item) => acc * item.multiplier, 1);
    const payout = (wager * totalMultiplier).toFixed(0);

    const handlePlaceBet = async () => {
        vibrate(20);
        setIsSubmitting(true);
        try {
            const targetTournamentId = activeWalletId === "chips" ? undefined : activeWalletId;

            if (items.length === 1) {
                // Single Bet
                const item = items[0];
                const res = await submitVote(item.predictionId, item.side, wager, targetTournamentId);
                if (res.error) toast.error(res.error);
                else {
                    vibrate([10, 50, 10]);
                    toast.success("Bet Placed!");
                    clearSlip();
                    router.refresh();
                }
            } else {
                // Bundle
                const legs = items.map(i => ({ id: i.predictionId, side: i.side, multiplier: i.multiplier }));
                const res = await placeBundleWager(legs, wager, targetTournamentId);
                if (res.error) toast.error(res.error);
                else {
                    vibrate([10, 50, 10]);
                    toast.success("Bundle Placed!");
                    clearSlip();
                    router.refresh();
                }
            }
        } catch (e) {
            console.error(e);
            toast.error("Error placing bet");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating AB (FAB) - Bottom Right */}
            {!isOpen && (
                <div className="fixed bottom-[96px] right-4 z-40">
                    <motion.button
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileTap={{ scale: 0.9 }}
                        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand text-black shadow-2xl shadow-brand/40 transition-transform"
                        onClick={() => setIsOpen(true)}
                    >
                        <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest">Bundle</span>
                            {items.length > 0 && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                                    {items.length}
                                </span>
                            )}
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
                                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Your Bundle</h2>
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
                                <AnimatePresence initial={false}>
                                    {items.map((item) => (
                                        <motion.div
                                            key={item.predictionId}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="relative flex flex-col gap-2 rounded-2xl border border-white/5 bg-black/40 p-4"
                                        >
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
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Wallet Selector & Controls */}
                            <div className="border-t border-white/10 bg-black p-6 pb-10">
                                <div className="mb-6">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pay With</span>
                                        <span className="text-[10px] font-bold text-white">Balance: <span className="text-success">${activeBalance.toLocaleString()}</span></span>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                        {/* Global Chips Option */}
                                        <button
                                            onClick={() => setActiveWalletId("chips")}
                                            className={cn(
                                                "flex flex-col items-start gap-1 rounded-xl border p-3 min-w-[120px] transition-all",
                                                activeWalletId === "chips"
                                                    ? "border-brand bg-brand/10"
                                                    : "border-white/10 bg-zinc-900 hover:bg-zinc-800"
                                            )}
                                        >
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", activeWalletId === "chips" ? "text-brand" : "text-zinc-500")}>Real Cash</span>
                                            <span className="text-sm font-bold text-white">${bankroll.toLocaleString()}</span>
                                        </button>

                                        {/* Tournament Options */}
                                        {myTournaments.map(t => (
                                            <button
                                                key={t.tournament_id}
                                                onClick={() => setActiveWalletId(t.tournament_id)}
                                                className={cn(
                                                    "flex flex-col items-start gap-1 rounded-xl border p-3 min-w-[140px] max-w-[160px] transition-all",
                                                    activeWalletId === t.tournament_id
                                                        ? "border-yellow-500 bg-yellow-500/10"
                                                        : "border-white/10 bg-zinc-900 hover:bg-zinc-800"
                                                )}
                                            >
                                                <span className={cn("text-[10px] font-black uppercase tracking-widest truncate w-full text-left", activeWalletId === t.tournament_id ? "text-yellow-500" : "text-zinc-500")}>
                                                    {t.tournament?.name || "Tournament"}
                                                </span>
                                                <span className="text-sm font-bold text-white">${t.current_stack.toLocaleString()}</span>
                                            </button>
                                        ))}

                                        {myTournaments.length === 0 && (
                                            <div className="flex items-center justify-center rounded-xl border border-dashed border-white/5 bg-transparent px-4">
                                                <span className="text-[10px] text-zinc-600">No Tournaments</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-6 flex flex-col items-center">
                                    <div className="mb-2 flex items-baseline gap-1">
                                        <span className="text-5xl font-black text-white">${wager}</span>
                                        <span className="text-xs font-bold uppercase text-zinc-500">Wager</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={activeBalance}
                                        step={1}
                                        value={wager}
                                        onChange={(e) => setWager(Number(e.target.value))}
                                        className="h-4 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-brand"
                                    />

                                    <div className="mt-4 flex w-full gap-2">
                                        {[10, 25, 50, 100].map(amt => (
                                            <button
                                                key={amt}
                                                disabled={amt > activeBalance}
                                                onClick={() => setWager(amt)}
                                                className={cn(
                                                    "flex-1 rounded-lg py-2 text-xs font-bold transition-all",
                                                    amt > activeBalance
                                                        ? "bg-zinc-900/50 text-zinc-700 cursor-not-allowed"
                                                        : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-95"
                                                )}
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
                                    disabled={isSubmitting || activeBalance <= 0 || wager <= 0}
                                    className="w-full rounded-2xl bg-brand py-4 text-xl font-black uppercase tracking-widest text-black shadow-lg shadow-brand/20 transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale"
                                >
                                    {isSubmitting ? "Placing..." : activeBalance <= 0 ? "Insufficient Funds" : wager <= 0 ? "Set Wager" : `To Win $${payout}`}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
