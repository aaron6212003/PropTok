"use client";

import { useState } from 'react';
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

    const handleSwitch = (id: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (id) {
            params.set('tournament', id);
        } else {
            params.delete('tournament');
        }
        router.push(`/?${params.toString()}`);
        setIsOpen(false);
    };

    return (
        <div className="relative pointer-events-auto">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md transition-all",
                    activeTournamentId
                        ? "border-brand/40 bg-brand/10 text-brand"
                        : "border-white/10 bg-black/40 text-white"
                )}
            >
                {activeTournamentId ? <Trophy size={14} /> : <Coins size={14} />}
                <span className="text-xs font-black tracking-tight">
                    ${(activeTournamentId ? activeEntry?.current_stack : bankroll)?.toLocaleString()}
                </span>
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
                                        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all text-left",
                                        !activeTournamentId ? "bg-white/10" : "hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Coins size={14} className={!activeTournamentId ? "text-brand" : "text-zinc-400"} />
                                        <div>
                                            <span className="block text-xs font-bold text-white leading-none">Prop Cash</span>
                                            <span className="text-[10px] text-zinc-500">${bankroll.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {!activeTournamentId && <Check size={14} className="text-brand" />}
                                </button>

                                {/* Tournament Entries */}
                                {entries.map((entry) => (
                                    <button
                                        key={entry.tournament_id}
                                        onClick={() => handleSwitch(entry.tournament_id)}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all text-left",
                                            activeTournamentId === entry.tournament_id ? "bg-brand/10" : "hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Trophy size={14} className={activeTournamentId === entry.tournament_id ? "text-brand" : "text-zinc-400"} />
                                            <div>
                                                <span className="block text-xs font-bold text-white leading-none truncate max-w-[120px]">
                                                    {entry.tournament?.name}
                                                </span>
                                                <span className="text-[10px] text-zinc-500">${entry.current_stack.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {activeTournamentId === entry.tournament_id && <Check size={14} className="text-brand" />}
                                    </button>
                                ))}

                                {entries.length === 0 && (
                                    <div className="px-3 py-2 text-[10px] text-zinc-500 italic">
                                        No active tournaments
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
