"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, XCircle, Coins, ArrowRight, Share2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { acknowledgeResults } from "@/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ResolutionRecapProps {
    results: {
        id: string;
        wager: number;
        multiplier: number;
        question: string;
        won: boolean;
        isBundle: boolean;
    }[];
}

export default function ResolutionRecap({ results }: ResolutionRecapProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPending, setIsPending] = useState(false);
    const [hasAcknowledged, setHasAcknowledged] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check session storage to see if we've already acknowledged this session
        // This prevents the "pop back up" when navigating back to Profile
        const sessionAck = typeof window !== 'undefined' && sessionStorage.getItem('prop_ack_complete');

        if (results.length > 0 && !hasAcknowledged && !sessionAck) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [results, hasAcknowledged]);

    if (results.length === 0 || !isOpen || hasAcknowledged) return null;

    const currentResult = results[currentIndex];
    const winnings = currentResult.wager * currentResult.multiplier;
    const isLast = currentIndex === results.length - 1;

    const handleNext = async () => {
        if (isLast) {
            setIsPending(true);
            try {
                const res = await acknowledgeResults();
                if (res.success) {
                    toast.success("Results acknowledged");

                    // Persist locally for this session to kill flicker/repeat pops
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('prop_ack_complete', 'true');
                    }

                    setHasAcknowledged(true);
                    setIsOpen(false);
                    router.refresh();
                } else {
                    toast.error(res.error || "Failed to acknowledge results");
                }
            } catch (err) {
                toast.error("An unexpected error occurred");
                console.error(err);
            } finally {
                setIsPending(false);
            }
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-24">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleNext}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                />

                {/* Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm overflow-hidden rounded-[40px] border border-white/10 bg-zinc-900 shadow-2xl"
                >
                    {/* Hero Background */}
                    <div className={cn(
                        "absolute inset-0 opacity-20 transition-colors duration-700",
                        currentResult.won ? "bg-success" : "bg-destructive"
                    )} style={{ filter: 'blur(100px)' }} />

                    <div className="relative z-10 flex flex-col items-center p-8 pt-12 text-center">
                        {/* Status Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className={cn(
                                "mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-2xl",
                                currentResult.won
                                    ? "border-success bg-success/20 text-success shadow-success/40"
                                    : "border-destructive bg-destructive/20 text-destructive shadow-destructive/40"
                            )}
                        >
                            {currentResult.won ? <Trophy size={48} /> : <XCircle size={48} />}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                                {currentResult.won ? "You Won!" : "Hard Luck"}
                            </h2>
                            <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                {currentResult.isBundle ? "Parlay Settled" : "Single Bet Settled"}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-8 mb-8 flex flex-col items-center rounded-3xl bg-black/40 p-6 w-full border border-white/5"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-1">
                                {currentResult.won ? "Payout" : "Loss Amount"}
                            </span>
                            <div className="flex items-center gap-2">
                                <Coins className={currentResult.won ? "text-success" : "text-zinc-500"} size={20} />
                                <span className={cn(
                                    "text-5xl font-black tracking-tighter",
                                    currentResult.won ? "text-success" : "text-white"
                                )}>
                                    ${currentResult.won ? Math.floor(winnings) : currentResult.wager}
                                </span>
                            </div>
                        </motion.div>

                        <div className="w-full space-y-4">
                            <div className="text-sm font-medium text-zinc-400 line-clamp-3 px-4">
                                "{currentResult.question}"
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={isPending}
                                className={cn(
                                    "group flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black uppercase tracking-widest transition-all active:scale-95",
                                    currentResult.won
                                        ? "bg-success text-black shadow-lg shadow-success/20"
                                        : "bg-white text-black shadow-lg",
                                    isPending && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <span>{isPending ? "Syncing..." : (isLast ? "Close" : "Next Result")}</span>
                                {!isPending && <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}
                                {isPending && <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />}
                            </button>

                            {currentResult.won && (
                                <button className="flex w-full items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                                    <Share2 size={12} />
                                    <span>Share Win</span>
                                </button>
                            )}
                        </div>

                        {results.length > 1 && (
                            <div className="mt-6 flex gap-1">
                                {results.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-1 transition-all rounded-full",
                                            i === currentIndex ? "w-4 bg-white" : "w-1 bg-zinc-700"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
