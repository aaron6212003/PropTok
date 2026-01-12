"use client";

import { useBetSlip } from "@/lib/context/bet-slip-context";
import { Coins, Wallet, ChevronDown, Check, Trophy, Banknote, CreditCard, DollarSign } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { getUserTournamentEntries } from "@/app/actions";

export default function WalletToggle({ cash, chips }: { cash: number, chips: number }) {
    const { currency, setCurrency, tournamentId, setTournamentId } = useBetSlip();
    const [isOpen, setIsOpen] = useState(false);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch Tournaments on mount
    useEffect(() => {
        const loadTournaments = async () => {
            const data = await getUserTournamentEntries();
            setTournaments(data || []);
        };
        loadTournaments();
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectGlobalChips = () => {
        setCurrency('CHIPS');
        setIsOpen(false);
    };

    return (
        <div className="pointer-events-auto relative z-50" ref={containerRef}>
            {/* TRIGGER: Simple Balance Display (No "Wallet" Button look) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 backdrop-blur-md border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group"
            >
                {/* Icon based on Context */}
                {currency === 'CASH' ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                        <DollarSign size={14} strokeWidth={3} />
                    </div>
                ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                        <Trophy size={14} />
                    </div>
                )}

                <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">
                        {currency === 'CASH' ? 'Real Cash' : (tournamentId ? 'Tournament' : 'Balance')}
                    </span>
                    <span className={cn(
                        "text-sm font-black tracking-tight",
                        currency === 'CASH' ? "text-white" : "text-white"
                    )}>
                        {currency === 'CASH' ? `$${cash.toFixed(2)}` : `$${chips.toLocaleString()}`}
                    </span>
                </div>

                <ChevronDown size={14} className={cn("ml-2 text-zinc-600 transition-transform group-hover:text-zinc-400", isOpen && "rotate-180")} />
            </button>

            {/* DASHBOARD DROPDOWN */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-3 w-80 rounded-2xl border border-white/10 bg-[#0A0A0A] p-4 shadow-2xl shadow-black/80 ring-1 ring-white/5 overflow-hidden backdrop-blur-3xl">

                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Wallet Summary</h3>
                        <Link href="/wallet" className="text-[10px] font-bold text-blue-400 hover:text-blue-300">
                            VIEW HISTORY
                        </Link>
                    </div>

                    {/* Section: Real Cash */}
                    <div className="mb-4 rounded-xl bg-zinc-900/50 p-3 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                                    <Banknote size={16} />
                                </div>
                                <span className="text-sm font-bold text-white">Real Cash</span>
                            </div>
                            <span className="text-sm font-bold text-white">${cash.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={() => { setCurrency('CASH'); setIsOpen(false); }}
                            className={cn(
                                "w-full rounded-lg py-1.5 text-xs font-bold transition-colors",
                                currency === 'CASH'
                                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {currency === 'CASH' ? "Selected" : "Select Wallet"}
                        </button>
                    </div>

                    {/* Section: Active Tournaments */}
                    <div className="space-y-2">
                        <h4 className="px-1 text-[10px] font-black uppercase tracking-widest text-zinc-600">Your Tournaments</h4>

                        <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
                            {tournaments.length === 0 && (
                                <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
                                    <Trophy className="mx-auto mb-2 h-5 w-5 text-zinc-700" />
                                    <p className="text-xs text-zinc-500">No active tournaments</p>
                                </div>
                            )}

                            {tournaments.map(t => (
                                <button
                                    key={t.tournament_id}
                                    onClick={() => {
                                        // Update context via link navigation usually, but here we can just close?
                                        // The link wrap is better for navigation
                                    }}
                                    className="w-full"
                                >
                                    <Link
                                        href={`/?tournament=${t.tournament_id}`}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "group flex items-center justify-between rounded-xl border p-3 transition-all",
                                            tournamentId === t.tournament_id
                                                ? "bg-blue-500/10 border-blue-500/50"
                                                : "bg-zinc-900/30 border-white/5 hover:bg-zinc-900/80 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                                                tournamentId === t.tournament_id ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-500 group-hover:text-blue-400"
                                            )}>
                                                <Trophy size={14} />
                                            </div>
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className={cn(
                                                    "text-xs font-bold text-left line-clamp-1",
                                                    tournamentId === t.tournament_id ? "text-white" : "text-zinc-300"
                                                )}>
                                                    {t.tournament?.name}
                                                </span>
                                                <span className="text-[10px] text-zinc-500">
                                                    Rank: #--
                                                </span>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "font-mono text-sm font-bold",
                                            tournamentId === t.tournament_id ? "text-blue-400" : "text-zinc-400"
                                        )}>
                                            ${t.current_stack.toLocaleString()}
                                        </span>
                                    </Link>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="my-4 h-px bg-white/5" />

                    <Link
                        href="/wallet?mode=promo"
                        onClick={() => setIsOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 text-xs font-black uppercase tracking-wide text-black transition-transform active:scale-95 hover:bg-white"
                    >
                        <CreditCard size={14} />
                        Redeem Promo Code
                    </Link>

                </div>
            )}
        </div>
    );
}
