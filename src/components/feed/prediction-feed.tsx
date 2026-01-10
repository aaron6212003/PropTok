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
import { AnimatePresence, motion } from 'framer-motion';
import { Filter, Check, ChevronDown, X } from 'lucide-react';

interface PredictionFeedProps {
    initialPredictions: any[];
    bankroll: number;
    tournamentId?: string;
}

type SortOption = 'trending' | 'ending' | 'new';

export default function PredictionFeed({ initialPredictions, bankroll, tournamentId }: PredictionFeedProps) {
    const [sortBy, setSortBy] = useState<SortOption>('trending');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
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

    // Listen for custom filter toggle events from children
    useEffect(() => {
        const handleToggle = () => setIsFilterOpen(prev => !prev);
        document.addEventListener('toggle-filter', handleToggle);
        return () => document.removeEventListener('toggle-filter', handleToggle);
    }, []);

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
            {/* Sorting Tabs - Floating Header (Simplified) */}
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

            {/* Dropdown Menu Overlay */}
            <AnimatePresence>
                {isFilterOpen && (
                    <>
                        {/* Backdrop to close on click outside */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                            onClick={() => setIsFilterOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                            className="fixed top-[130px] left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
                        >
                            <div className="w-full max-w-[320px] pointer-events-auto flex flex-col gap-2">
                                <div className="rounded-2xl bg-black/90 border border-white/10 backdrop-blur-xl shadow-2xl p-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedCategories([]);
                                                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                                            }}
                                            className={cn(
                                                "col-span-2 flex items-center justify-between px-4 py-3 rounded-xl transition-all border",
                                                selectedCategories.length === 0
                                                    ? "bg-white text-black border-white font-bold"
                                                    : "bg-white/5 border-transparent hover:bg-white/10 text-zinc-400"
                                            )}
                                        >
                                            <span className="text-xs font-bold uppercase tracking-wider">All Sports</span>
                                            {selectedCategories.length === 0 && <Check size={16} className="text-black" />}
                                        </button>

                                        {availableCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => {
                                                    toggleCategory(cat);
                                                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(5);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all border",
                                                    selectedCategories.includes(cat)
                                                        ? "bg-white/10 border-white/20 text-white"
                                                        : "bg-transparent border-transparent hover:bg-white/5 text-zinc-400"
                                                )}
                                            >
                                                <div
                                                    className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]"
                                                    style={{ backgroundColor: CATEGORY_COLORS[cat] || CATEGORY_COLORS['Default'], color: CATEGORY_COLORS[cat] || CATEGORY_COLORS['Default'] }}
                                                />
                                                <span className="text-xs font-bold uppercase tracking-wider">{cat}</span>
                                                {selectedCategories.includes(cat) && <Check size={12} className="ml-auto text-success" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Done Button */}
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-full bg-white text-black font-black uppercase tracking-widest text-xs py-3 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
