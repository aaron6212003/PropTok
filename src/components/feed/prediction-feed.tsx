"use client";

import { useRef, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PullToRefresh from '../ui/pull-to-refresh';
import PredictionCard from './prediction-card';
import { useScroll, useTransform } from 'framer-motion';
import { Prediction } from "@/lib/types";
import { Flame, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS, CATEGORY_TEXT_COLORS } from '@/lib/constants';
import EmptyState from '../ui/empty-state';
import { toast } from 'sonner';

interface PredictionFeedProps {
    initialPredictions: any[];
    bankroll: number;
    tournamentId?: string;
}

type SortOption = 'trending' | 'ending' | 'new';

export default function PredictionFeed({ initialPredictions, bankroll, tournamentId }: PredictionFeedProps) {
    const [sortBy, setSortBy] = useState<SortOption>('trending');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Get unique categories from predictions
    const availableCategories = useMemo(() => {
        const cats = new Set<string>();
        initialPredictions.forEach(p => {
            if (p.category) cats.add(p.category);
        });
        return Array.from(cats).sort();
    }, [initialPredictions]);

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat)
                ? prev.filter(c => c !== cat)
                : [...prev, cat]
        );
    };

    // Filter and then Sort Predictions
    const filteredAndSortedPredictions = useMemo(() => {
        let filtered = [...initialPredictions];

        // Apply Category Filter
        if (selectedCategories.length > 0) {
            filtered = filtered.filter(p => selectedCategories.includes(p.category));
        }

        // Apply Sorting
        switch (sortBy) {
            case 'trending':
                return filtered.sort((a, b) => (b.volume || 0) - (a.volume || 0));
            case 'ending':
                return filtered.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
            case 'new':
                return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            default:
                return filtered;
        }
    }, [initialPredictions, sortBy, selectedCategories]);

    const handleRefresh = async () => {
        router.refresh();
        // Give it a tiny bit of time to "feel" like it's working
        await new Promise(resolve => setTimeout(resolve, 800));
    };

    return (
        <PullToRefresh onRefresh={handleRefresh} className="h-full w-full" scrollContainerRef={scrollRef}>
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

            {/* Vertical Filter Sidebar - Left Side */}
            <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4 pointer-events-none">
                <div className="flex flex-col items-start gap-3 pointer-events-auto">
                    <button
                        onClick={() => setSelectedCategories([])}
                        className={cn(
                            "group flex items-center justify-center rounded-full h-10 w-10 border transition-all duration-300",
                            selectedCategories.length === 0
                                ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110"
                                : "bg-black/40 text-zinc-400 border-white/10 backdrop-blur-md hover:border-white/20 hover:scale-105"
                        )}
                        title="All Sports"
                    >
                        <span className="text-[9px] font-black">ALL</span>
                    </button>

                    {availableCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={cn(
                                "group relative flex items-center justify-center rounded-full h-10 w-10 border transition-all duration-300",
                                selectedCategories.includes(cat)
                                    ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-110"
                                    : "bg-black/40 text-zinc-400 border-white/10 backdrop-blur-md hover:border-white/20 hover:scale-105"
                            )}
                            title={cat}
                        >
                            <div
                                className={cn(
                                    "h-2 w-2 rounded-full transition-all duration-300",
                                    selectedCategories.includes(cat) ? "scale-125" : "opacity-80 group-hover:opacity-100"
                                )}
                                style={{ backgroundColor: CATEGORY_COLORS[cat] || CATEGORY_COLORS['Default'] }}
                            />

                            {/* Hover Label (Desktop/Tablet) */}
                            <span className="absolute left-full ml-3 hidden group-hover:block whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                                {cat}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div ref={scrollRef} className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar pt-12">
                {filteredAndSortedPredictions.map((prediction: any) => {
                    const fallbackYesMultiplier = Number((0.95 / Math.max(0.01, (prediction.yes_percent || 50) / 100)).toFixed(2));
                    const fallbackNoMultiplier = Number((0.95 / Math.max(0.01, 1 - (prediction.yes_percent || 50) / 100)).toFixed(2));

                    const yesMultiplier = prediction.yes_multiplier || fallbackYesMultiplier;
                    const noMultiplier = prediction.no_multiplier || fallbackNoMultiplier;

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

                {filteredAndSortedPredictions.length === 0 && (
                    <EmptyState
                        icon={Sparkles}
                        title="No Markets Found"
                        description="There are currently no active markets. Check back soon for new opportunities!"
                        className="h-full"
                    />
                )}
            </div>
        </PullToRefresh>
    );
}
