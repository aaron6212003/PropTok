"use client";

import { useBetSlip } from "@/lib/context/bet-slip-context";
import { ChevronDown, Check, Trophy, Banknote, CreditCard, DollarSign } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { getUserTournamentEntries } from "@/app/actions";

export default function WalletToggle({ cash, chips }: { cash: number, chips: number }) {
    const { currency, setCurrency, tournamentId, setTournamentId } = useBetSlip();
    const [isOpen, setIsOpen] = useState(false);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

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

    return (
        <div className="pointer-events-auto relative z-50" ref={containerRef}>
            {/* TRIGGER: Simple Balance Display */}
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
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors max-w-[100px] truncate block">
                        {currency === 'CASH' ? 'Real Cash' : (
                            tournamentId && tournaments.length > 0
                                ? (tournaments.find(t => t.tournament_id === tournamentId)?.tournament?.name || 'Tournament')
                                : 'Select Wallet'
                        )}
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
                <div className="absolute right-0 top-full mt-3 w-80 rounded-3xl border border-white/10 bg-black/95 p-5 shadow-2xl shadow-black ring-1 ring-white/10 backdrop-blur-3xl">

                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Account Balance</h3>
                    </div>

                    {/* Section: Real Cash */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between rounded-2xl bg-zinc-900/50 p-4 border border-white/5 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                                    <Banknote size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-zinc-400">Cash Balance</span>
                                    <span className="text-lg font-black text-white tracking-tight">${cash.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => { setCurrency('CASH'); setIsOpen(false); }}
                                className={cn(
                                    "rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wide transition-all",
                                    currency === 'CASH'
                                        ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                                        : "bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {currency === 'CASH' ? "Active" : "Select"}
                            </button>
                        </div>

                        <Link
                            href="/wallet?mode=promo"
                            onClick={() => setIsOpen(false)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[10px] font-bold uppercase tracking-wide text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <CreditCard size={12} />
                            Redeem Promo Code
                        </Link>
                    </div>

                    <div className="my-4 h-px bg-white/5" />

                    {/* Section: Active Tournaments */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Active Tournaments</h4>

                        <div className="max-h-[240px] overflow-y-auto space-y-3 pr-1 scrollbar-none">
                            {tournaments.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
                                    <Trophy className="mx-auto mb-3 h-6 w-6 text-zinc-800" />
                                    <p className="text-xs text-zinc-600 font-medium">No active tournaments</p>
                                </div>
                            )}

                            {tournaments.map(t => (
                                <button
                                    key={t.tournament_id}
                                    className="w-full"
                                >
                                    <Link
                                        href={pathname === '/profile' ? `/profile?tournament=${t.tournament_id}` : `/?tournament=${t.tournament_id}`}
                                        onClick={() => { setIsOpen(false); setCurrency('CHIPS'); }}
                                        className={cn(
                                            "group flex items-center justify-between rounded-2xl border p-4 transition-all",
                                            tournamentId === t.tournament_id
                                                ? "bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10"
                                                : "bg-zinc-900/30 border-white/5 hover:bg-zinc-900/80 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                                                tournamentId === t.tournament_id ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-600 group-hover:text-blue-400 group-hover:bg-blue-500/10"
                                            )}>
                                                <Trophy size={18} />
                                            </div>
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className={cn(
                                                    "text-sm font-bold text-left line-clamp-1",
                                                    tournamentId === t.tournament_id ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                                                )}>
                                                    {t.tournament?.name}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                                                    Rank: #--
                                                </span>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "font-mono text-sm font-black tracking-tight",
                                            tournamentId === t.tournament_id ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                                        )}>
                                            ${t.current_stack.toLocaleString()}
                                        </span>
                                    </Link>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
