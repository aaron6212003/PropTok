"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Trophy, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

interface TournamentEntry {
    tournament_id: string;
    current_stack: number;
    tournament: {
        name: string;
        id: string;
    } | any;
}

interface WalletToggleProps {
    bankroll: number;
    entries: TournamentEntry[];
    activeTournamentId: string | null;
}

export default function WalletToggle({ bankroll, entries, activeTournamentId }: WalletToggleProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const activeEntry = entries.find(e => e.tournament_id === activeTournamentId);
    const balance = activeTournamentId ? activeEntry?.current_stack : bankroll;
    const [isPulsing, setIsPulsing] = useState(false);

    useEffect(() => {
        if (balance !== undefined) {
            setIsPulsing(true);
            const timer = setTimeout(() => setIsPulsing(false), 600);
            return () => clearTimeout(timer);
        }
    }, [balance]);

    const handleSwitch = (id: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (id) {
            params.set('tournament', id);
        } else {
            params.delete('tournament');
        }
        router.push(`${window.location.pathname}?${params.toString()}`);
        router.refresh(); // Force re-fetch of server data
        setIsOpen(false);
    };

    return (
        <div className="relative pointer-events-auto">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md transition-all duration-500",
                    activeTournamentId
                        ? "border-brand/40 bg-brand/10 text-brand"
                        : "border-white/10 bg-black/40 text-white",
                    isPulsing && (activeTournamentId ? "border-brand shadow-[0_0_15px_rgba(255,42,109,0.4)]" : "border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]")
                )}
            >
                {activeTournamentId ? <Trophy size={14} /> : <Coins size={14} />}
                <motion.span
                    animate={isPulsing ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    className="text-xs font-black tracking-tight"
                >
                    ${(activeTournamentId ? activeEntry?.current_stack : bankroll)?.toLocaleString()}
                </motion.span>
                {activeTournamentId && <span className="text-[8px] font-black opacity-60 ml-0.5">TRN</span>}
                <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop to close */}
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl"
                        >
                            <div className="p-2">
                                <span className="mb-1 block px-3 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                    Select Wallet
                                </span>

                                {/* Main Wallet */}
                                <button
                                    onClick={() => handleSwitch(null)}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all text-left group",
                                        !activeTournamentId ? "bg-emerald-500/10 border border-emerald-500/20" : "hover:bg-white/5 border border-transparent"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                                            !activeTournamentId ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700"
                                        )}>
                                            <span className="font-serif font-black">$</span>
                                        </div>
                                        <div>
                                            <span className={cn("block text-xs font-black uppercase tracking-wider leading-none", !activeTournamentId ? "text-emerald-400" : "text-zinc-400")}>
                                                Real Cash
                                            </span>
                                            <span className="text-[10px] text-white font-mono opacity-80">${bankroll.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {!activeTournamentId && <Check size={14} className="text-emerald-500" />}
                                </button>

                                {/* Divider */}
                                <div className="my-2 h-px bg-white/5" />

                                <span className="mb-1 block px-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                    Active Tournaments
                                </span>

                                {/* Tournament Entries */}
                                {entries.map((entry) => (
                                    <button
                                        key={entry.tournament_id}
                                        onClick={() => handleSwitch(entry.tournament_id)}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all text-left",
                                            activeTournamentId === entry.tournament_id ? "bg-brand/10 border border-brand/20" : "hover:bg-white/5 border border-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Trophy size={14} className={activeTournamentId === entry.tournament_id ? "text-brand" : "text-zinc-400"} />
                                            <div>
                                                <span className="block text-xs font-bold text-white leading-none truncate max-w-[120px]">
                                                    {entry.tournament?.name}
                                                </span>
                                                <span className="text-[10px] text-zinc-500">T${entry.current_stack.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {activeTournamentId === entry.tournament_id && <Check size={14} className="text-brand" />}
                                    </button>
                                ))}

                                {entries.length === 0 && (
                                    <div className="px-3 py-2 text-[10px] text-zinc-500 italic">
                                        No active tournaments. Deposit cash to join one.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
