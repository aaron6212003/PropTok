"use client";

import { useBetSlip } from "@/lib/context/bet-slip-context";
import { Coins, Wallet, ChevronDown, Check, Trophy } from "lucide-react";
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
        // Clear tournament ID to indicate Global Scope
        // NOTE: We need to expose setTournamentId in context or use router push? 
        // Actually, context usually handles this via URL params or internal state.
        // For now, let's assume switching currency to CHIPS implies Global if no tourney selected.
        // But referencing the user request: "dropdown to select your real cash or tournament money"
        // If they select a tournament, we should probably navigate or set context.
        setIsOpen(false);
    };

    return (
        <div className="pointer-events-auto relative z-50" ref={containerRef}>
            {/* Trigger Button - Shows ACTIVE Wallet */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-black/60 transition-all"
            >
                {currency === 'CASH' ? (
                    <>
                        <Wallet className="h-4 w-4 text-[#00DC82]" />
                        <span className="font-bold text-[#00DC82]">${cash.toFixed(2)}</span>
                    </>
                ) : (
                    <>
                        {tournamentId ? <Trophy className="h-4 w-4 text-yellow-500" /> : <Coins className="h-4 w-4 text-yellow-400" />}
                        <span className="font-bold text-yellow-400">
                            {chips.toLocaleString()}
                        </span>
                    </>
                )}
                <ChevronDown size={14} className={cn("text-zinc-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-xl shadow-black/50 overflow-hidden">

                    {/* Header: Tournaments */}
                    <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Active Tournaments
                    </div>

                    <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 scrollbar-none">

                        {/* List Tournaments ONLY */}
                        {tournaments.map(t => (
                            <Link
                                key={t.tournament_id}
                                href={`/?tournament=${t.tournament_id}`}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                                    (tournamentId === t.tournament_id) ? "bg-yellow-500/10" : "hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-bold text-white line-clamp-1">{t.tournament?.name || "Tournament"}</span>
                                        <span className="text-[10px] text-yellow-500">${t.current_stack.toLocaleString()}</span>
                                    </div>
                                </div>
                                {(tournamentId === t.tournament_id) && <Check size={14} className="text-yellow-500" />}
                            </Link>
                        ))}

                        {tournaments.length === 0 && (
                            <div className="px-3 py-2 text-center text-xs text-zinc-500 italic">
                                No active tournaments
                            </div>
                        )}
                    </div>

                    <div className="my-2 h-px bg-white/5" />

                    {/* Deposit Link */}
                    <Link
                        href="/wallet?mode=promo"
                        onClick={() => setIsOpen(false)}
                        className="flex w-full items-center justify-center rounded-lg bg-[#00DC82]/10 py-2 text-xs font-bold text-[#00DC82] hover:bg-[#00DC82]/20 transition-colors"
                    >
                        Redeem Promo Code
                    </Link>
                </div>
            )}
        </div>
    );
}
