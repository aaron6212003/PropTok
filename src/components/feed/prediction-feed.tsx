"use client";

import { useRef, useState, useMemo, useEffect } from 'react';
import PredictionCard from './prediction-card';
import { useScroll, useTransform } from 'framer-motion';
import { Prediction } from "@/lib/types";
import { Flame, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBetSlip } from '@/lib/context/bet-slip-context';
import EmptyState from '../ui/empty-state';

interface PredictionFeedProps {
    initialPredictions: any[];
    bankroll: number;
    tournamentId?: string;
}

type SortOption = 'trending' | 'ending' | 'new';

export default function PredictionFeed({ initialPredictions, bankroll, tournamentId }: PredictionFeedProps) {
    const [sortBy, setSortBy] = useState<SortOption>('trending');

    // Sort Predictions
    const sortedPredictions = useMemo(() => {
        const preds = [...initialPredictions];
        switch (sortBy) {
            case 'trending':
                return preds.sort((a, b) => (b.volume || 0) - (a.volume || 0));
            case 'ending':
                return preds.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
            case 'new':
                return preds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            default:
                return preds;
        }
    }, [initialPredictions, sortBy]);

    return (
        <div className="relative h-full w-full">
            {/* Sorting Tabs - Floating Header */}
            <div className="fixed top-[72px] left-0 right-0 z-40 flex justify-center pointer-events-none">
                <div className="flex items-center gap-1 rounded-full bg-black/60 p-1 backdrop-blur-md border border-white/10 shadow-xl pointer-events-auto">
                    <button
                        onClick={() => setSortBy('trending')}
                        className={cn(
                            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all",
                            sortBy === 'trending' ? "bg-white/10 text-white shadow-lg" : "text-zinc-400 hover:text-white"
                        )}
                    >
                        <Flame size={12} className={sortBy === 'trending' ? "text-orange-500 fill-orange-500" : ""} />
                        <span>Trending</span>
                    </button>
                    <button
                        onClick={() => setSortBy('ending')}
                        className={cn(
                            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all",
                            sortBy === 'ending' ? "bg-white/10 text-white shadow-lg" : "text-zinc-400 hover:text-white"
                        )}
                    >
                        <Clock size={12} className={sortBy === 'ending' ? "text-red-500" : ""} />
                        <span>Ending</span>
                    </button>
                    <button
                        onClick={() => setSortBy('new')}
                        className={cn(
                            "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all",
                            sortBy === 'new' ? "bg-white/10 text-white shadow-lg" : "text-zinc-400 hover:text-white"
                        )}
                    >
                        <Sparkles size={12} className={sortBy === 'new' ? "text-yellow-400 fill-yellow-400" : ""} />
                        <span>New</span>
                    </button>
                </div>
            </div>

            <div className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
                {sortedPredictions.map((prediction) => {
                    const yesProb = (prediction.yes_percent || 50) / 100;
                    const yesMultiplier = Number((0.95 / Math.max(0.01, yesProb)).toFixed(2));
                    const noMultiplier = Number((0.95 / Math.max(0.01, 1 - yesProb)).toFixed(2));

                    return (
                        <PredictionCard
                            key={prediction.id}
                            prediction={{
                                id: prediction.id,
                                question: prediction.question,
                                category: prediction.category,
                                volume: prediction.volume || 0,
                                yesPercent: prediction.yes_percent || 50,
                                yesMultiplier,
                                noMultiplier,
                                expiresAt: prediction.expires_at,
                                createdAt: prediction.created_at,
                                imageUrl: prediction.image_url,
                                description: prediction.description
                            }}
                            isActive={true}
                            bankroll={bankroll}
                        />
                    );
                })}

                {sortedPredictions.length === 0 && (
                    <EmptyState
                        icon={Sparkles}
                        title="No Markets Found"
                        description="There are currently no active markets. Check back soon for new opportunities!"
                        className="h-full"
                    />
                )}
            </div>
        </div>
    );
}
