"use client";

import { useState, useEffect } from 'react';
import BottomNavBar from '@/components/layout/bottom-nav';
import { getPredictions } from '../actions';
import { cn } from '@/lib/utils';
import { Plus, X, ArrowRight, Zap } from 'lucide-react';

interface SelectedLeg {
    id: string;
    side: 'YES' | 'NO';
    multiplier: number;
    question: string;
}

export default function CreateBundlePage() {
    const [predictions, setPredictions] = useState<any[]>([]);
    const [selectedLegs, setSelectedLegs] = useState<SelectedLeg[]>([]);

    useEffect(() => {
        getPredictions().then(setPredictions);
    }, []);

    const toggleSelection = (prediction: any, side: 'YES' | 'NO') => {
        const existing = selectedLegs.find(l => l.id === prediction.id);

        if (existing) {
            if (existing.side === side) {
                // Remove if clicking same side
                setSelectedLegs(selectedLegs.filter(l => l.id !== prediction.id));
            } else {
                // Switch side
                setSelectedLegs(selectedLegs.map(l =>
                    l.id === prediction.id
                        ? { ...l, side, multiplier: side === 'YES' ? prediction.yes_multiplier : prediction.no_multiplier }
                        : l
                ));
            }
        } else if (selectedLegs.length < 5) {
            // Add new leg
            setSelectedLegs([...selectedLegs, {
                id: prediction.id,
                side,
                multiplier: side === 'YES' ? prediction.yes_multiplier : prediction.no_multiplier,
                question: prediction.question
            }]);
        }
    };

    const totalMultiplier = selectedLegs.reduce((acc, leg) => acc * leg.multiplier, 1).toFixed(2);

    return (
        <main className="relative flex h-full w-full flex-col overflow-y-auto bg-black pb-32 text-white">
            <div className="p-6">
                <h1 className="text-3xl font-black tracking-tight uppercase">Custom Bundle</h1>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Pick up to 5 legs to boost Payouts</p>

                {/* Multiplier Badge */}
                <div className="mt-6 flex items-center justify-between rounded-3xl border border-brand/30 bg-brand/5 p-6 backdrop-blur-xl">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-brand">
                            <Zap className="fill-brand" size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Bundle Payout</span>
                        </div>
                        <span className="text-sm font-bold text-zinc-400">{selectedLegs.length} Leg Parlay</span>
                    </div>
                    <span className="text-5xl font-black tracking-tighter text-white">{selectedLegs.length > 0 ? totalMultiplier : "1.00"}x</span>
                </div>
            </div>

            {/* Available Predictions List */}
            <div className="px-6">
                <h2 className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Markets</h2>
                <div className="space-y-4">
                    {predictions.map((p) => {
                        const leg = selectedLegs.find(l => l.id === p.id);
                        return (
                            <div key={p.id} className="rounded-2xl border border-white/5 bg-zinc-900/50 p-4">
                                <h3 className="mb-4 text-sm font-bold leading-tight">{p.question}</h3>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => toggleSelection(p, 'YES')}
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-xl border py-2.5 transition-all",
                                            leg?.side === 'YES'
                                                ? "border-success bg-success/20 text-success"
                                                : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                                        )}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest">Yes</span>
                                        <span className="text-sm font-bold">{p.yes_multiplier || "1.9"}x</span>
                                    </button>
                                    <button
                                        onClick={() => toggleSelection(p, 'NO')}
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-xl border py-2.5 transition-all text-destructive",
                                            leg?.side === 'NO'
                                                ? "border-destructive bg-destructive/20 text-destructive"
                                                : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                                        )}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest">No</span>
                                        <span className="text-sm font-bold">{p.no_multiplier || "1.9"}x</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating Action Bar */}
            {selectedLegs.length > 0 && (
                <div className="fixed bottom-24 left-6 right-6 z-40">
                    <button className="group flex w-full items-center justify-between rounded-2xl bg-white p-5 text-black shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all active:scale-95">
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Selection</span>
                            <span className="text-xl font-black">{selectedLegs.length} Legs</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-black uppercase tracking-widest">Create Bundle</span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:translate-x-1">
                                <ArrowRight size={18} />
                            </div>
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
