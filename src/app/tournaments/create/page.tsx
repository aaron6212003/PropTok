"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, DollarSign, Calendar, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createTournament, getUpcomingGames } from "@/app/actions";
import { useEffect } from "react";

export default function CreateTournamentPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entryFee, setEntryFee] = useState(20);
    const [maxPlayers, setMaxPlayers] = useState(10); // Default to 10
    const [rakePercent, setRakePercent] = useState(10); // Standard House Take (5% creator + 5% platform)
    const [payoutStructure, setPayoutStructure] = useState("top3"); // Default
    const [games, setGames] = useState<any[]>([]);
    const [selectedLeague, setSelectedLeague] = useState("All");
    const [selectedGame, setSelectedGame] = useState("All");

    useEffect(() => {
        getUpcomingGames().then(setGames);
    }, []);

    // Prize Pool Calculation
    // Assuming 10 players for the preview
    const estPrizePool = (entryFee * 10) * ((100 - rakePercent) / 100);

    return (
        <main className="min-h-screen bg-black text-white pb-32">
            <header className="p-6 border-b border-white/10">
                <Link href="/tournaments" className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white">
                    <ArrowLeft size={16} />
                    Back
                </Link>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase">Host Tournament</h1>
                <p className="text-sm text-zinc-400 mt-1">Create your own arena. You invite the players.</p>
            </header>

            <form
                action={async (formData) => {
                    setIsSubmitting(true);
                    const res = await createTournament(formData);
                    if (res?.error) {
                        toast.error(res.error);
                        setIsSubmitting(false);
                    } else {
                        toast.success("Tournament Created!", {
                            description: "Redirecting to lobby..."
                        });
                        router.push(`/tournaments/${res.id}`);
                    }
                }}
                className="p-6 space-y-8"
            >
                {/* Basic Info */}
                <section className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Tournament Name</label>
                        <input
                            name="name"
                            required
                            placeholder="e.g. Sunday NFL Clash"
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 text-lg font-bold text-white placeholder:text-zinc-700 focus:border-brand focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Trash talk goes here..."
                            className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 text-sm text-zinc-300 placeholder:text-zinc-700 focus:border-brand focus:outline-none resize-none"
                        />
                    </div>

                    {/* RESTRICTIONS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Restriction (League)</label>
                            <select
                                name="allowed_leagues"
                                value={selectedLeague}
                                onChange={(e) => setSelectedLeague(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 text-sm font-bold text-white focus:border-brand focus:outline-none appearance-none"
                            >
                                <option value="All">All Leagues</option>
                                <option value="NFL">NFL Only</option>
                                <option value="NBA">NBA Only</option>
                                <option value="MLB">MLB Only</option>
                                <option value="NHL">NHL Only</option>
                                <option value="Soccer">Soccer Only</option>
                            </select>
                            <input type="hidden" name="allowed_leagues" value={selectedLeague === 'All' ? '' : selectedLeague} disabled={selectedLeague === 'All'} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Restriction (Matchup)</label>
                            <select
                                name="allowed_game_ids"
                                value={selectedGame}
                                onChange={(e) => setSelectedGame(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-zinc-900 p-4 text-sm font-bold text-white focus:border-brand focus:outline-none appearance-none disabled:opacity-50"
                            >
                                <option value="All">All Games</option>
                                {games
                                    .filter(g => selectedLeague === 'All' || g.category === selectedLeague)
                                    .map(g => (
                                        <option key={g.id} value={g.id}>{g.label}</option>
                                    ))
                                }
                            </select>
                            <input type="hidden" name="allowed_game_ids" value={selectedGame === 'All' ? '' : selectedGame} disabled={selectedGame === 'All'} />
                        </div>
                    </div>
                </section>

                {/* Money Settings */}
                <section className="rounded-3xl border border-brand/20 bg-brand/5 p-6 space-y-6">
                    <div className="flex items-center gap-2 text-brand mb-2">
                        <DollarSign size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Stakes & Payouts</span>
                    </div>

                    <div className="space-y-6">
                        {/* Entry Fee */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold text-white">Entry Fee</label>
                                <span className="font-mono font-bold text-brand">${entryFee}</span>
                            </div>
                            <input
                                name="entry_fee"
                                type="range"
                                min="0"
                                max="500"
                                step="5"
                                value={entryFee}
                                onChange={(e) => setEntryFee(Number(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-full appearance-none accent-brand cursor-pointer"
                            />
                        </div>

                        {/* Player Limit */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold text-white">Max Players</label>
                                <span className="font-mono font-bold text-white">
                                    {maxPlayers === 101 ? "Unlimited" : maxPlayers}
                                </span>
                            </div>
                            <input
                                name="max_players"
                                type="range"
                                min="2"
                                max="101"
                                step="1"
                                value={maxPlayers}
                                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                                className="w-full h-2 bg-zinc-800 rounded-full appearance-none accent-brand cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                                <span>Heads Up (2)</span>
                                <span>No Limit</span>
                            </div>
                        </div>

                        {/* Payout Structure Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-white flex items-center gap-2">
                                <Trophy size={14} className="text-brand" />
                                Payout Structure
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: "winner", name: "Winner Takes All", desc: "100% to 1st place", value: { "1": 100 } },
                                    { id: "top3", name: "Top 3 Split", desc: "70% / 20% / 10%", value: { "1": 70, "2": 20, "3": 10 } },
                                    { id: "fifty", name: "Top Heavy", desc: "50% / 30% / 20%", value: { "1": 50, "2": 30, "3": 20 } },
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setPayoutStructure(p.id)}
                                        className={cn(
                                            "flex flex-col items-start p-4 rounded-xl border transition-all text-left",
                                            payoutStructure === p.id
                                                ? "bg-brand/10 border-brand shadow-lg shadow-brand/10"
                                                : "bg-black/40 border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className={cn("text-sm font-bold", payoutStructure === p.id ? "text-white" : "text-zinc-400")}>{p.name}</span>
                                            {payoutStructure === p.id && <div className="h-2 w-2 rounded-full bg-brand" />}
                                        </div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{p.desc}</span>
                                        <input type="hidden" name="payout_structure" value={JSON.stringify(p.value)} disabled={payoutStructure !== p.id} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary Box */}
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Service Fees</span>
                                    <span className="text-xs text-zinc-300">5% Platform + 5% You (Creator)</span>
                                </div>
                                <span className="font-mono font-bold text-zinc-400">10% Total</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400 font-bold">Total Pot</span>
                                <span className="font-mono font-bold text-white">
                                    ${(entryFee * (maxPlayers > 100 ? 10 : maxPlayers)).toLocaleString()}
                                    {maxPlayers > 100 && <span className="text-[10px] text-zinc-500 ml-1">(est.)</span>}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400 font-bold italic">Winner Payout Pool</span>
                                <span className="font-mono font-bold text-brand italic">
                                    ${((entryFee * (maxPlayers > 100 ? 10 : maxPlayers)) * 0.9).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl shadow-xl shadow-white/10 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    <span>{isSubmitting ? "Creating Arena..." : "Create Tournament"}</span>
                </button>
            </form>
        </main>
    )
}
