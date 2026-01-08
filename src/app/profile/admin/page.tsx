"use client";

import { useTransition } from "react";
import { createPrediction, resolvePrediction, autoResolvePrediction, undoResolvePrediction, getPredictions, clearDatabase } from "@/app/actions";
import { useState, useEffect } from "react";
import { Trash2, Plus, Clock, CheckCircle, XCircle, Wand2, RotateCcw } from 'lucide-react';

export default function AdminPage() {
    const [isPending, startTransition] = useTransition();
    const [predictions, setPredictions] = useState<any[]>([]);

    useEffect(() => {
        if (!sessionStorage.getItem('admin_unlocked')) {
            window.location.href = '/profile';
            return;
        }
        getPredictions().then(setPredictions);
    }, []);

    const handleClear = () => {
        if (confirm("Are you sure? This will delete ALL predictions, votes, and bundles.")) {
            startTransition(async () => {
                const result = await clearDatabase();
                if (result?.error) {
                    alert("Failed to wipe: " + result.error);
                } else {
                    setPredictions([]);
                    alert("Database Wiped Successfully!");
                }
            });
        }
    };

    return (
        <main className="h-full w-full overflow-y-auto bg-black p-6 text-white pb-32 scrollbar-none">
            <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                    <a href="/" className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10">
                        <span className="sr-only">Back</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </a>
                    <h1 className="text-3xl font-black italic tracking-tighter text-brand">ADMIN<span className="text-white">ORACLE</span></h1>
                </div>

                <button
                    onClick={handleClear}
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/20"
                >
                    <Trash2 size={14} />
                    <span>Wipe All Data</span>
                </button>
            </header>

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
                                alert("Prediction Created!");
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
                </section>

                {/* MANAGE SECTION */}
                <section className="space-y-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold">Live Markets</h2>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-black border-2 border-white">{predictions.length}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {predictions.length === 0 && (
                            <div className="text-center py-10 text-zinc-600">
                                <p>No active markets found.</p>
                                <p className="text-sm">Create one to get started.</p>
                            </div>
                        )}
                        {predictions.map((p) => (
                            <div key={p.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 p-5 transition-all hover:border-white/20">
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand">{p.category}</span>
                                        <h3 className="font-bold leading-tight">{p.question}</h3>
                                        <p className="text-xs text-zinc-500">Created: {new Date(p.created_at).toLocaleDateString()}</p>
                                        <p className="text-xs text-zinc-500">Expires: {new Date(p.expires_at).toLocaleString()}</p>
                                    </div>
                                    <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${p.resolved ? 'bg-white/10 text-zinc-400' : 'bg-green-500/10 text-green-500'}`}>
                                        {p.resolved ? p.outcome : 'LIVE'}
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
                                                    if (res?.error) alert(res.error);
                                                    else getPredictions().then(setPredictions);
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
                                                if (res?.error) alert(res.error);
                                                else getPredictions().then(setPredictions);
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
            </div>
        </main>
    );
}
