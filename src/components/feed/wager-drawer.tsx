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
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 bg-zinc-900 p-6 shadow-2xl"
                    >
                        <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-zinc-700" />

                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Place your Bet</h2>
                                <p className="text-sm text-zinc-400">Balance: <span className="text-brand font-bold">${currentBankroll.toLocaleString()}</span></p>
                            </div>
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full font-bold",
                                side === 'YES' ? "bg-success text-black" : "bg-destructive text-white"
                            )}>
                                {side}
                            </div>
                        </div>

                        {/* Slider Section */}
                        <div className="mb-8 flex flex-col items-center">
                            <span className="mb-4 text-5xl font-black text-white">${wager}</span>

                            <input
                                type="range"
                                min="1"
                                max="100" // Cap at 100 or bankroll? User asked for 1-100.
                                value={wager}
                                onChange={(e) => setWager(Number(e.target.value))}
                                className="h-4 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-zinc-900"
                            />
                            <div className="mt-2 flex w-full justify-between text-xs font-bold text-zinc-500">
                                <span>$1</span>
                                <span>$50</span>
                                <span>$100</span>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="mb-6 flex items-center justify-between rounded-xl bg-black/50 p-4">
                            <span className="text-zinc-400">Potential Payout</span>
                            <div className="text-right">
                                <span className="block text-2xl font-bold text-success">${potentialPayout}</span>
                                <span className="text-xs text-zinc-500">{multiplier}x Multiplier</span>
                            </div>
                        </div>

                        <button
                            onClick={() => onConfirm(wager)}
                            className="w-full rounded-xl bg-white py-4 text-lg font-bold text-black transition-transform active:scale-95"
                        >
                            Confirm ${wager} Wager
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
