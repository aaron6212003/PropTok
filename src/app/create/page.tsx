"use client";

import { useState, useEffect } from 'react';
import BottomNavBar from '@/components/layout/bottom-nav';
import { getPredictions } from '../actions';
import { cn } from '@/lib/utils';
import { Plus, X, ArrowRight, Zap } from 'lucide-react';

export default function CreateBundlePage() {
    const [predictions, setPredictions] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        getPredictions().then(setPredictions);
    }, []);

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else if (selectedIds.length < 5) {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const selectedCount = selectedIds.length;
    // Mock calculation of multiplier
    const currentMultiplier = (1.9 ** (selectedCount || 1)).toFixed(2);

    return (
        <main className="relative flex h-full w-full flex-col overflow-y-auto bg-black pb-32 text-white">
            <div className="p-6">
                <h1 className="text-3xl font-bold tracking-tight">Create Bundle</h1>
                <p className="mt-2 text-zinc-400">Combine up to 5 predictions to boost your streak potential.</p>

                {/* Multiplier Badge */}
                <div className="mt-6 flex items-center justify-between rounded-2xl border border-brand/50 bg-brand/10 p-4">
                    <div className="flex items-center gap-2 text-brand">
                        <Zap className="fill-brand" size={20} />
                        <span className="font-bold uppercase tracking-wider">Potential Boost</span>
                    </div>
                    <span className="text-3xl font-black text-white">{currentMultiplier}x</span>
                </div>
            </div>

            {/* Available Predictions List */}
            <div className="px-4">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">Trending Now</h2>
                <div className="space-y-3">
                    {predictions.map((p) => {
                        const isSelected = selectedIds.includes(p.id);
                        return (
                            <button
                                key={p.id}
                                onClick={() => toggleSelection(p.id)}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
                                    isSelected
                                        ? "border-brand bg-brand/10 ring-1 ring-brand"
                                        : "border-white/10 bg-white/5 hover:bg-white/10"
                                )}
                            >
                                <div className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                                    isSelected ? "border-brand bg-brand text-white" : "border-zinc-600 bg-transparent"
                                )}>
                                    {isSelected && <Plus size={14} />}
                                </div>
                                <div>
                                    <h3 className="line-clamp-1 font-bold text-sm text-white">{p.question}</h3>
                                    <span className="text-xs text-zinc-500">{p.category} • {p.volume || 100} votes</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Floating Action Bar */}
            {selectedCount > 0 && (
                <div className="fixed bottom-20 left-4 right-4 z-40">
                    <button className="flex w-full items-center justify-between rounded-xl bg-white px-6 py-4 font-bold text-black shadow-2xl transition-transform active:scale-95">
                        <span>{selectedCount} Selected</span>
                        <div className="flex items-center gap-2">
                            <span>Create Bundle</span>
                            <ArrowRight size={20} />
                        </div>
                    </button>
                </div>
            )}

            <nav className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </nav>
        </main>
    );
}
