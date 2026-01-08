"use client";

import { useTransition } from "react";
import { createPrediction, resolvePrediction, getPredictions } from "../actions";
import { useState, useEffect } from "react";

export default function AdminPage() {
    const [isPending, startTransition] = useTransition();
    const [predictions, setPredictions] = useState<any[]>([]);

    useEffect(() => {
        getPredictions().then(setPredictions);
    }, []);

    return (
        <main className="min-h-screen bg-black p-8 text-white">
            <h1 className="mb-8 text-3xl font-bold text-brand">Admin Oracle</h1>

            {/* Create Section */}
            <section className="mb-12 rounded-2xl border border-white/10 bg-zinc-900 p-6">
                <h2 className="mb-4 text-xl font-bold">Create Prediction</h2>
                <form
                    action={async (formData) => {
                        await createPrediction(formData);
                        // Refresh list
                        getPredictions().then(setPredictions);
                        alert("Created!");
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm text-zinc-400">Question</label>
                        <input
                            name="question"
                            className="w-full rounded bg-black p-2 text-white border border-white/20"
                            placeholder="Will..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400">Category</label>
                        <select name="category" className="w-full rounded bg-black p-2 text-white border border-white/20">
                            <option>Sports</option>
                            <option>Crypto</option>
                            <option>Tech</option>
                            <option>Pop Culture</option>
                            <option>Weather</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400">Description</label>
                        <input
                            name="description"
                            className="w-full rounded bg-black p-2 text-white border border-white/20"
                            placeholder="Optional context..."
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="col-span-3 text-sm font-bold text-brand">🤖 Auto-Resolve (Oracle)</div>
                        <div>
                            <label className="block text-xs text-zinc-400">Asset ID (e.g. bitcoin)</label>
                            <input name="oracle_id" className="w-full rounded bg-black p-2 text-xs text-white border border-white/20" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400">Type</label>
                            <select name="oracle_type" className="w-full rounded bg-black p-2 text-xs text-white border border-white/20">
                                <option value="">None</option>
                                <option value="crypto_price_gt">Price &gt; Target</option>
                                <option value="sports_winner">Game Winner</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400">Target Value (Number)</label>
                            <input name="target_value" type="number" step="any" className="w-full rounded bg-black p-2 text-xs text-white border border-white/20" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400">Target Slug (Team)</label>
                            <input name="target_slug" className="w-full rounded bg-black p-2 text-xs text-white border border-white/20 placeholder:text-zinc-700" placeholder="e.g. steelers" />
                        </div>
                    </div>

                    <button
                        disabled={isPending}
                        type="submit"
                        className="rounded bg-brand px-4 py-2 font-bold text-white hover:bg-brand/80"
                    >
                        {isPending ? "Creating..." : "Launch Prediction"}
                    </button>
                </form>
            </section>

            {/* Resolve Section */}
            <section>
                <h2 className="mb-4 text-xl font-bold">Active Markets</h2>
                <div className="space-y-4">
                    {predictions.map((p) => (
                        <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900 p-4">
                            <div>
                                <p className="font-bold">{p.question}</p>
                                <p className="text-xs text-zinc-500">{p.resolved ? `Resolved: ${p.outcome}` : "Live"}</p>
                                <p className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</p>
                            </div>

                            {!p.resolved && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startTransition(async () => {
                                            await resolvePrediction(p.id, 'YES');
                                            getPredictions().then(setPredictions);
                                        })}
                                        className="rounded bg-success/20 px-3 py-1 text-sm text-success hover:bg-success/30"
                                    >
                                        Resolve YES
                                    </button>
                                    <button
                                        onClick={() => startTransition(async () => {
                                            await resolvePrediction(p.id, 'NO');
                                            getPredictions().then(setPredictions);
                                        })}
                                        className="rounded bg-destructive/20 px-3 py-1 text-sm text-destructive hover:bg-destructive/30"
                                    >
                                        Resolve NO
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
