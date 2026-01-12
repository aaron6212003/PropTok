"use client";

import { useTransition, useState, useEffect } from "react";
import {
    createPrediction,
    resolvePrediction,
    autoResolvePrediction,
    undoResolvePrediction,
    getPredictions,
    clearDatabase,
    adminResetTournament,
    getAllTournaments,
    deletePrediction,
    getUpcomingGames
} from "@/app/actions";
import { Terminal, Users, Trophy, Settings, ShieldAlert, BadgeDollarSign, Trash2, Plus, GripVertical, RotateCcw, Wand2, Zap, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CreatePromoCodeForm from "./create-promo-code";

export default function AdminPage() {
    const [isPending, startTransition] = useTransition();
    const [predictions, setPredictions] = useState<any[]>([]);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [games, setGames] = useState<any[]>([]);
    const [adminSelectedLeague, setAdminSelectedLeague] = useState("All");
    const [adminSelectedGameIds, setAdminSelectedGameIds] = useState<string[]>([]);


    useEffect(() => {
        if (!sessionStorage.getItem('admin_unlocked')) {
            window.location.href = '/profile';
            return;
        }
        getPredictions().then(probs => {
            // Filter out resolved props to reduce clutter as requested
            setPredictions(probs.filter((p: any) => !p.resolved));
        });
        getAllTournaments().then(res => setTournaments(res.data || []));
        getUpcomingGames().then(setGames);
    }, []);

    const handleClear = () => {
        if (confirm("Are you sure? This will delete ALL predictions, votes, and bundles.")) {
            startTransition(async () => {
                const result = await clearDatabase();
                if (result?.error) {
                    toast.error("Failed to wipe: " + result.error);
                } else {
                    setPredictions([]);
                    toast.success("Database Wiped Successfully!");
                }
            });
        }
    };

    return (
        <main className="h-full w-full overflow-y-auto bg-black p-4 sm:p-6 text-white pb-32 scrollbar-none">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                    <a href="/" className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10">
                        <span className="sr-only">Back</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </a>
                    <h1 className="text-3xl font-black italic tracking-tighter text-brand">ADMIN<span className="text-white">ORACLE</span></h1>
                </div>

                <div className="flex gap-2 relative">
                    {/* CUSTOM MULTI-SELECT DROPDOWN */}
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                        >
                            <span>Select Tournaments to Delete</span>
                            <ChevronDown size={14} className={`text-zinc-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* ABSOLUTE DROPDOWN MENU */}
                        {dropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-xl z-[9999]">
                                <div className="mb-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                    {tournaments.length} Tournaments Found
                                </div>
                                {tournaments.length === 0 && <div className="p-2 text-xs text-zinc-500">No tournaments found.</div>}
                                {tournaments.map(t => (
                                    <label key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0">
                                        <input type="checkbox" name="t_select" value={t.id} className="accent-brand h-4 w-4" />
                                        <div className="overflow-hidden">
                                            <div className="truncate text-xs font-bold text-white">{t.name}</div>
                                            <div className="truncate text-[10px] text-zinc-500">{t.status} | {new Date(t.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* DELETE ACTION BUTTON */}
                    <button
                        onClick={async () => {
                            const selected = Array.from(document.querySelectorAll('input[name="t_select"]:checked'))
                                .map((cb: any) => cb.value);

                            if (selected.length === 0) return toast.error("Select tournaments from the list first");

                            if (confirm(`DELETE ${selected.length} TOURNAMENTS? This cannot be undone and will remove them from all users.`)) {
                                const { deleteTournaments, getAllTournaments } = await import('@/app/actions');
                                const res = await deleteTournaments(selected);
                                if (res?.error) toast.error(res.error);
                                else {
                                    toast.success(`Deleted ${selected.length} Tournaments`);
                                    getAllTournaments().then(res => setTournaments(res.data || []));
                                    // Reset checkboxes
                                    document.querySelectorAll('input[name="t_select"]:checked').forEach((cb: any) => cb.checked = false);
                                    // Hide menu (optional, simplistic DOM manipulation)
                                    document.querySelector('.group > div.absolute')?.classList.add('hidden');
                                }
                            }
                        }}
                        className="flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-destructive hover:bg-destructive/20 transition-colors"
                    >
                        <Trash2 size={14} />
                        <span>Delete Selected</span>
                    </button>

                    <div className="h-8 w-[1px] bg-white/10 mx-2" />



                    <button
                        onClick={handleClear}
                        disabled={isPending}
                        className="flex w-fit items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/20"
                    >
                        <Trash2 size={14} />
                        <span>Wipe All Data</span>
                    </button>
                </div>
            </header>

            {/* --- PROMO CODE GENERATOR --- */}
            <section className="mb-8">
                <CreatePromoCodeForm />
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* CREATE SECTION */}
                <section className="space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                                <Plus size={20} />
                            </div>
                            <h2 className="text-xl font-bold">Create Prediction</h2>
                        </div>

                        <form
                            action={async (formData) => {
                                await createPrediction(formData);
                                getPredictions().then(setPredictions);
                                toast.success("Prediction Created!");
                            }}
                            className="space-y-5"
                        >
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Question / Prop</label>
                                <input
                                    name="question"
                                    className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm font-bold text-white placeholder:text-zinc-700 focus:border-brand focus:outline-none"
                                    placeholder="e.g. Will the Lakers win by 10+?"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Category</label>
                                    <select name="category" className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm font-bold text-white focus:border-brand focus:outline-none">
                                        <optgroup label="Sports">
                                            <option>NFL</option>
                                            <option>NBA</option>
                                            <option>MLB</option>
                                            <option>NHL</option>
                                            <option>UFC</option>
                                            <option>Tennis</option>
                                            <option>Golf</option>
                                            <option>Soccer</option>
                                        </optgroup>
                                        <optgroup label="Crypto">
                                            <option>Bitcoin</option>
                                            <option>Ethereum</option>
                                            <option>Solana</option>
                                        </optgroup>
                                        <option>Pop Culture</option>
                                        <option>Politics</option>
                                        <option>Tech</option>
                                        <option>Weather</option>
                                        <option>Celebs</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Resolution Time</label>
                                    <input
                                        name="expires_at"
                                        type="datetime-local"
                                        className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm font-bold text-white focus:border-brand focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description (Optional)</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm text-zinc-400 placeholder:text-zinc-800 focus:border-brand focus:outline-none"
                                    placeholder="Add context, odds, or game details..."
                                />
                            </div>

                            <div className="space-y-4 rounded-xl border border-white/10 bg-black p-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Impled Probability</label>
                                    <span className="text-brand font-mono font-bold text-sm">50% YES</span>
                                </div>
                                <input
                                    name="initial_percent"
                                    type="range"
                                    min="1"
                                    max="99"
                                    defaultValue="50"
                                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand"
                                    onInput={(e) => {
                                        const val = (e.target as HTMLInputElement).value;
                                        const span = (e.target as HTMLInputElement).previousElementSibling?.lastElementChild;
                                        if (span) span.textContent = `${val}% YES`;
                                    }}
                                />
                                <div className="flex justify-between text-[10px] uppercase font-black text-zinc-600 tracking-widest">
                                    <span>Underdog</span>
                                    <span>Even</span>
                                    <span>Favorite</span>
                                </div>
                            </div>

                            <button
                                disabled={isPending}
                                type="submit"
                                className="w-full rounded-xl bg-brand py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand/80 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isPending ? "Creating..." : "Launch Market"}
                            </button>
                        </form>
                    </div>

                    {/* FEATURED TOURNAMENT CREATOR */}
                    <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                                <Trophy size={20} />
                            </div>
                            <h2 className="text-xl font-bold">Create Featured Event</h2>
                        </div>

                        <form
                            action={async (formData) => {
                                const { createFeaturedTournament } = await import('@/app/actions'); // Dynamic import
                                const res = await createFeaturedTournament(formData);
                                if (res?.error) toast.error(res.error);
                                else {
                                    toast.success("Featured Tournament Live!");
                                    getAllTournaments().then(res => setTournaments(res.data || []));
                                }
                            }}
                            className="space-y-4"
                        >
                            <input
                                name="name"
                                className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm font-bold text-white placeholder:text-zinc-700 focus:border-emerald-500 focus:outline-none"
                                placeholder="Tournament Name"
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    name="entry_fee"
                                    type="number"
                                    className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm font-bold text-white placeholder:text-zinc-700 focus:border-emerald-500 focus:outline-none"
                                    placeholder="Entry Fee ($)"
                                    required
                                />
                                <div className="relative">
                                    <input
                                        name="starting_stack"
                                        type="number"
                                        className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm font-bold text-white placeholder:text-zinc-700 focus:border-emerald-500 focus:outline-none"
                                        placeholder="Start Stack"
                                        defaultValue={1000}
                                        required
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-zinc-600 tracking-wider">Tournament $</span>
                                </div>
                            </div>
                            <input
                                name="max_players"
                                type="number"
                                className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm font-bold text-white placeholder:text-zinc-700 focus:border-emerald-500 focus:outline-none"
                                placeholder="Max Players (Leave empty for Unlimited)"
                            />
                            <div className="space-y-4">
                                <div className="relative">
                                    <select
                                        name="allowed_leagues"
                                        value={adminSelectedLeague}
                                        onChange={(e) => {
                                            setAdminSelectedLeague(e.target.value);
                                            setAdminSelectedGameIds([]); // Clear games when league changes
                                        }}
                                        className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm font-bold text-white focus:border-emerald-500 focus:outline-none appearance-none"
                                    >
                                        <option value="All">All Leagues</option>
                                        <option value="NFL">NFL Only</option>
                                        <option value="NBA">NBA Only</option>
                                        <option value="NHL">NHL Only</option>
                                        <option value="Soccer">Soccer Only</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        Restrict to Matchups
                                        {adminSelectedGameIds.length > 0 && <span className="ml-2 text-emerald-500">({adminSelectedGameIds.length} Selected)</span>}
                                    </label>
                                    <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto p-2 border border-white/5 rounded-xl bg-black scrollbar-none">
                                        {games
                                            .filter(g => adminSelectedLeague === 'All' || g.category === adminSelectedLeague)
                                            .map(g => {
                                                const isSelected = adminSelectedGameIds.includes(g.id);
                                                return (
                                                    <button
                                                        key={g.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setAdminSelectedGameIds(prev =>
                                                                prev.includes(g.id)
                                                                    ? prev.filter(id => id !== g.id)
                                                                    : [...prev, g.id]
                                                            );
                                                        }}
                                                        className={cn(
                                                            "flex items-center gap-2 p-2 rounded-lg border transition-all text-left",
                                                            isSelected
                                                                ? "bg-emerald-500/10 border-emerald-500/50"
                                                                : "bg-white/5 border-transparent hover:bg-white/10"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "h-3 w-3 rounded border flex items-center justify-center transition-colors",
                                                            isSelected ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                                                        )} />
                                                        <span className={cn("text-[10px] font-bold truncate", isSelected ? "text-white" : "text-zinc-500")}>{g.label}</span>
                                                    </button>
                                                );
                                            })
                                        }
                                        {games.filter(g => adminSelectedLeague === 'All' || g.category === adminSelectedLeague).length === 0 && (
                                            <p className="py-4 text-center text-[10px] text-zinc-600">No matchups found.</p>
                                        )}
                                    </div>
                                    <input type="hidden" name="allowed_game_ids" value={adminSelectedGameIds.join(',')} disabled={adminSelectedGameIds.length === 0} />
                                </div>
                            </div>
                            <textarea
                                name="description"
                                rows={2}
                                className="w-full rounded-xl border border-white/10 bg-black p-3 text-sm text-zinc-400 placeholder:text-zinc-800 focus:border-emerald-500 focus:outline-none"
                                placeholder="Description..."
                            />
                            <button
                                type="submit"
                                className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition-all"
                            >
                                Launch Event
                            </button>
                        </form>
                    </div>
                </section>

                {/* MANAGE SECTION */}
                <section className="space-y-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold">Live Markets</h2>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-black border-2 border-white">{predictions.length}</span>
                        </div>
                    </div>

                    {/* Last Sync: 2026-01-09T00:50:00 - Animation Removed for Stability */}
                    <div className="space-y-4">
                        {predictions.length === 0 && (
                            <div className="text-center py-10 text-zinc-600">
                                <p>No active markets found.</p>
                                <p className="text-sm">Create one to get started.</p>
                            </div>
                        )}
                        {predictions.map((p) => (
                            <div
                                key={p.id}
                                className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 p-5 transition-all hover:border-white/20"
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand">{p.category}</span>
                                        <h3 className="font-bold leading-tight">{p.question}</h3>
                                        <p className="text-xs text-zinc-500">Created: {new Date(p.created_at).toLocaleDateString()}</p>
                                        <p className="text-xs text-zinc-500">Expires: {new Date(p.expires_at).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${p.resolved ? 'bg-white/10 text-zinc-400' : 'bg-green-500/10 text-green-500'}`}>
                                            {p.resolved ? p.outcome : 'LIVE'}
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (confirm(`DELETE "${p.question}"? This will delete all associated votes and cannot be undone.`)) {
                                                    // Optimistic Update
                                                    setPredictions(prev => prev.filter(pred => pred.id !== p.id));
                                                    toast.success("Prop Deleted", { icon: "💨" });

                                                    const res = await deletePrediction(p.id);
                                                    if (res?.error) {
                                                        toast.error(res.error);
                                                        // Revert if failed
                                                        getPredictions().then(setPredictions);
                                                    }
                                                }
                                            }}
                                            className="rounded-full bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 transition-colors"
                                            title="Delete Prop"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {!p.resolved && (
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            onClick={() => startTransition(async () => {
                                                if (confirm(`Resolve "${p.question}" as YES?`)) {
                                                    await resolvePrediction(p.id, 'YES');
                                                    getPredictions().then(setPredictions);
                                                }
                                            })}
                                            className="group flex flex-col items-center justify-center gap-1 rounded-xl bg-success/20 py-4 text-[10px] font-black uppercase tracking-widest text-success hover:bg-success/30"
                                        >
                                            <CheckCircle size={16} />
                                            <span>YES</span>
                                        </button>

                                        <button
                                            onClick={() => startTransition(async () => {
                                                if (confirm(`Attempt to auto-resolve "${p.question}" using oracle data?`)) {
                                                    const res = await autoResolvePrediction(p.id);
                                                    if (res?.error) toast.error(res.error);
                                                    else {
                                                        toast.success("Market Auto-Resolved!");
                                                        getPredictions().then(setPredictions);
                                                    }
                                                }
                                            })}
                                            className="group flex flex-col items-center justify-center gap-1 rounded-xl bg-brand/20 py-4 text-[10px] font-black uppercase tracking-widest text-brand hover:bg-brand/30 border border-brand/20"
                                        >
                                            <Wand2 size={16} className="animate-pulse" />
                                            <span>Auto</span>
                                        </button>

                                        <button
                                            onClick={() => startTransition(async () => {
                                                if (confirm(`Resolve "${p.question}" as NO?`)) {
                                                    await resolvePrediction(p.id, 'NO');
                                                    getPredictions().then(setPredictions);
                                                }
                                            })}
                                            className="group flex flex-col items-center justify-center gap-1 rounded-xl bg-destructive/20 py-4 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/30"
                                        >
                                            <XCircle size={16} />
                                            <span>NO</span>
                                        </button>
                                    </div>
                                )}

                                {p.resolved && (
                                    <button
                                        onClick={() => startTransition(async () => {
                                            if (confirm(`UNDO resolution for "${p.question}"? This will revert ALL payouts and bankrolls.`)) {
                                                const res = await undoResolvePrediction(p.id);
                                                if (res?.error) toast.error(res.error);
                                                else {
                                                    toast.success("Resolution Reverted");
                                                    getPredictions().then(setPredictions);
                                                }
                                            }
                                        })}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-xs font-bold text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                        <RotateCcw size={14} />
                                        <span>Undo Resolution</span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div >
        </main >
    );
}
