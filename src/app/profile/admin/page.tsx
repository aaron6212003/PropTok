"use client";

import { useTransition } from "react";
import { createPrediction, resolvePrediction, getPredictions, clearDatabase } from "@/app/actions";
import { useState, useEffect } from "react";
import { Trash2, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function AdminPage() {
    const [isPending, startTransition] = useTransition();
    const [predictions, setPredictions] = useState<any[]>([]);

    useEffect(() => {
        getPredictions().then(setPredictions);
    }, []);

    const handleClear = () => {
        if (confirm("Are you sure? This will delete ALL predictions, votes, and bundles.")) {
            startTransition(async () => {
                await clearDatabase();
                setPredictions([]);
                alert("Database Wiped!");
            });
        }
    };

    return (
        <main className="min-h-screen bg-black p-6 text-white pb-32">
            <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
                <h1 className="text-3xl font-black italic tracking-tighter text-brand">ADMIN<span className="text-white">ORACLE</span></h1>

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

                            {/* Oracle Config (Collapsed/Secondary) */}
                            <details className="group rounded-xl border border-white/5 bg-white/5">
                                <summary className="cursor-pointer p-4 text-xs font-bold uppercase tracking-widest text-zinc-500 group-open:text-brand">
                                    Advanced: Auto-Resolution
                                </summary>
                                <div className="grid grid-cols-2 gap-4 p-4 pt-0">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500">Asset ID / Slug</label>
                                        <input name="oracle_id" className="w-full rounded-lg bg-black px-3 py-2 text-xs text-white border border-white/10" placeholder="bitcoin" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500">Oracle Type</label>
                                        <select name="oracle_type" className="w-full rounded-lg bg-black px-3 py-2 text-xs text-white border border-white/10">
                                            <option value="">Manual Resolution</option>
                                            <option value="crypto_price_gt">Price &gt; Target</option>
                                            <option value="sports_winner">Game Winner</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500">Target Value</label>
                                        <input name="target_value" type="number" step="any" className="w-full rounded-lg bg-black px-3 py-2 text-xs text-white border border-white/10" placeholder="100000" />
                                    </div>
                                </div>
                            </details>

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
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                            <Clock size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Live Markets</h2>
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
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => startTransition(async () => {
                                                if (confirm(`Resolve "${p.question}" as YES?`)) {
                                                    await resolvePrediction(p.id, 'YES');
                                                    getPredictions().then(setPredictions);
                                                }
                                            })}
                                            className="group flex items-center justify-center gap-2 rounded-xl bg-success/10 py-3 text-xs font-black uppercase tracking-widest text-success transition-all hover:bg-success/20"
                                        >
                                            <CheckCircle size={14} />
                                            Resolve Yes
                                        </button>
                                        <button
                                            onClick={() => startTransition(async () => {
                                                if (confirm(`Resolve "${p.question}" as NO?`)) {
                                                    await resolvePrediction(p.id, 'NO');
                                                    getPredictions().then(setPredictions);
                                                }
                                            })}
                                            className="group flex items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-xs font-black uppercase tracking-widest text-destructive transition-all hover:bg-destructive/20"
                                        >
                                            <XCircle size={14} />
                                            Resolve No
                                        </button>
                                    </div>
                                )}

                                {p.resolved && (
                                    <div className="flex w-full items-center justify-center rounded-xl bg-white/5 py-3 text-xs font-bold text-zinc-500">
                                        Market Closed
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
