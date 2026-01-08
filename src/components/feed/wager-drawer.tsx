"use client";
// Wager Drawer Components

import { useState } from "react";
// import { Drawer, ... } from "@/components/ui/drawer"; // Removed unused import
// Actually, I'll build a custom mobile-friendly drawer using Framer Motion or simple fixed positioning to allow for full control 
// since I don't know if 'vaul' is installed. I'll make it a simple overlay.

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Coins, X } from "lucide-react";

interface WagerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
    side: "YES" | "NO";
    multiplier: number; // Dynamic multiplier from market odds
    currentBankroll?: number; // Optional passed in, or fetched
}

export function WagerDrawer({ isOpen, onClose, onConfirm, side, multiplier, currentBankroll = 1000 }: WagerDrawerProps) {
    const [wager, setWager] = useState(25); // Default to 25

    // Calculate potential payout using the dynamic multiplier
    const potentialPayout = (wager * multiplier).toFixed(0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 32, stiffness: 350 }}
                        className="fixed bottom-0 left-0 right-0 z-[100] rounded-t-[40px] border-t border-white/10 bg-zinc-900/95 p-8 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
                        style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom))" }}
                    >
                        <div className="mx-auto mb-8 h-1.5 w-16 rounded-full bg-zinc-800" />

                        <div className="mb-10 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">Place Bet</h2>
                                <div className="mt-1 flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Live Balance:</span>
                                    <span className="text-sm font-bold text-brand">${currentBankroll.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className={cn(
                                "flex h-14 w-14 items-center justify-center rounded-2xl font-black text-sm uppercase shadow-2xl rotate-3",
                                side === 'YES' ? "bg-success text-black" : "bg-destructive text-white"
                            )}>
                                {side}
                            </div>
                        </div>

                        {/* Slider Section */}
                        <div className="mb-10 flex flex-col items-center">
                            <div className="mb-6 flex items-baseline gap-1">
                                <span className="text-7xl font-black tracking-tighter text-white">${wager}</span>
                                <span className="text-sm font-bold text-zinc-600 uppercase">Stake</span>
                            </div>

                            <input
                                type="range"
                                min="1"
                                max={currentBankroll > 0 ? currentBankroll : 100}
                                value={wager}
                                onChange={(e) => setWager(Number(e.target.value))}
                                className="h-6 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-brand transition-all hover:accent-brand/80"
                            />
                            <div className="mt-4 flex w-full justify-between px-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                                <span>Min</span>
                                <span className="text-brand/40">${Math.floor(currentBankroll / 2)}</span>
                                <span>Max</span>
                            </div>
                        </div>

                        {/* Quick Bets */}
                        <div className="mb-10 grid grid-cols-3 gap-4">
                            {[0.25, 0.5, 1].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setWager(Math.floor(currentBankroll * p))}
                                    className="rounded-2xl border border-white/5 bg-white/5 py-4 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/10 active:scale-90 active:bg-brand active:text-white"
                                >
                                    {p === 1 ? "Max" : `${p * 100}%`}
                                </button>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="mb-10 flex items-center justify-between rounded-[32px] border border-white/5 bg-black/40 p-6 backdrop-blur-3xl shadow-inner">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">To Win</span>
                                <span className="text-sm font-bold text-zinc-400">{multiplier}x Multiplier</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-4xl font-black text-success tracking-tighter shadow-success/20 drop-shadow-lg">${potentialPayout}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Incl. Stake</span>
                            </div>
                        </div>

                        <button
                            onClick={() => onConfirm(wager)}
                            disabled={wager <= 0 || wager > currentBankroll}
                            className="group relative w-full overflow-hidden rounded-[24px] bg-white py-6 text-xl font-black uppercase tracking-[0.3em] text-black shadow-[0_20px_40px_rgba(255,255,255,0.15)] transition-all active:scale-[0.97] disabled:opacity-10"
                        >
                            <span className="relative z-10">Lock in ${wager}</span>
                            <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-black/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
