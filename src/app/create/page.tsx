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


    const [wager, setWager] = useState(25);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showWagerOption, setShowWagerOption] = useState(false);

    const handleCreateBundle = async () => {
        setIsSubmitting(true);
        const { placeBundleWager } = await import('../actions');
        const res = await placeBundleWager(selectedLegs, wager);

        if (res.success) {
            alert("Bundle Created Successfully!");
            window.location.href = "/profile";
        } else {
            alert(res.error || "Failed to create bundle");
        }
        setIsSubmitting(false);
    };

    return (
        <main className="relative flex h-full w-full flex-col overflow-y-auto bg-black pb-32 text-white">
            <div className="p-6">
                <h1 className="text-3xl font-black tracking-tight uppercase italic">Custom Bundle</h1>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Combine winners to skyrocket your payout</p>

                {/* Multiplier Badge */}
                <div className="mt-8 flex items-center justify-between rounded-[32px] border border-brand/20 bg-brand/5 p-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-brand/10 blur-3xl" />
                    <div className="flex flex-col relative z-10">
                        <div className="flex items-center gap-2 text-brand">
                            <Zap className="fill-brand animate-pulse" size={14} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Combined Payout</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-500 mt-1">{selectedLegs.length} Leg Parlay</span>
                    </div>
                    <span className="text-6xl font-black tracking-tighter text-white relative z-10">{selectedLegs.length > 0 ? totalMultiplier : "1.00"}x</span>
                </div>
            </div>

            {/* Available Predictions List */}
            <div className="px-6 flex-1">
                <h2 className="mb-6 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 border-b border-white/5 pb-2">Live Markets</h2>
                <div className="space-y-6">
                    {predictions.map((p) => {
                        const leg = selectedLegs.find(l => l.id === p.id);
                        const yesProb = (p.yes_percent || 50) / 100;
                        const yesMult = (0.95 / Math.max(0.01, yesProb)).toFixed(2);
                        const noMult = (0.95 / Math.max(0.01, 1 - yesProb)).toFixed(2);

                        return (
                            <div key={p.id} className="rounded-3xl border border-white/5 bg-zinc-900/30 p-5 backdrop-blur-xl transition-all hover:bg-zinc-900/50">
                                <h3 className="mb-6 text-base font-bold leading-snug tracking-tight">{p.question}</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => toggleSelection({ ...p, yes_multiplier: Number(yesMult), no_multiplier: Number(noMult) }, 'YES')}
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-2xl border py-4 transition-all duration-300",
                                            leg?.side === 'YES'
                                                ? "border-success bg-success/20 text-success shadow-[0_0_20px_rgba(0,220,130,0.2)]"
                                                : "border-white/5 bg-white/5 text-zinc-500 hover:bg-white/10"
                                        )}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Yes</span>
                                        <span className="text-sm font-black mt-0.5">{yesMult}x</span>
                                    </button>
                                    <button
                                        onClick={() => toggleSelection({ ...p, yes_multiplier: Number(yesMult), no_multiplier: Number(noMult) }, 'NO')}
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-2xl border py-4 transition-all duration-300",
                                            leg?.side === 'NO'
                                                ? "border-destructive bg-destructive/20 text-destructive shadow-[0_0_20px_rgba(255,42,109,0.2)]"
                                                : "border-white/5 bg-white/5 text-zinc-500 hover:bg-white/10"
                                        )}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">No</span>
                                        <span className="text-sm font-black mt-0.5">{noMult}x</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Wager Controls (Hidden until legs selected) */}
            {selectedLegs.length > 0 && (
                <div className="fixed bottom-24 left-0 right-0 z-40 px-6 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="rounded-t-[32px] border-t border-white/10 bg-zinc-900 p-6 shadow-2xl">
                        <div className="mb-6 flex flex-col items-center">
                            <div className="flex items-center justify-between w-full mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Wager Amount</span>
                                <span className="text-2xl font-black text-white">${wager}</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="1000"
                                step="10"
                                value={wager}
                                onChange={(e) => setWager(Number(e.target.value))}
                                className="h-4 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-brand"
                            />
                        </div>

                        <button
                            onClick={handleCreateBundle}
                            disabled={isSubmitting}
                            className="group flex w-full items-center justify-between rounded-3xl bg-white p-6 text-black shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Potential Return</span>
                                <span className="text-2xl font-black">${(wager * Number(totalMultiplier)).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-black uppercase tracking-[0.2em]">{isSubmitting ? "Locking..." : "Lock Bundle"}</span>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:translate-x-1 shadow-lg">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            <nav className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </nav>
        </main>
    );
}
