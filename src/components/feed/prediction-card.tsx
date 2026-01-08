import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prediction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Clock, TrendingUp, Users, MessageSquare, Share2 } from 'lucide-react';
import CommentsDrawer from '@/components/social/comments-drawer';
import { WagerDrawer } from '@/components/feed/wager-drawer'; // Import
import { submitVote } from '@/app/actions'; // Import server action

interface PredictionCardProps {
    prediction: Prediction;
    isActive: boolean;
    bankroll: number;
}

export default function PredictionCard({ prediction, isActive, bankroll }: PredictionCardProps) {
    const [selectedSide, setSelectedSide] = useState<'YES' | 'NO' | null>(null);
    const [showComments, setShowComments] = useState(false);

    // Wager State
    const [showWagerDrawer, setShowWagerDrawer] = useState(false);
    const [pendingSide, setPendingSide] = useState<'YES' | 'NO' | null>(null);

    const isLocked = selectedSide !== null;

    const handleOptionClick = (side: 'YES' | 'NO') => {
        if (isLocked) return;
        setPendingSide(side);
        setShowWagerDrawer(true);
    };

    const handleConfirmWager = async (amount: number) => {
        if (!pendingSide) return;

        // Optimistic UI
        setSelectedSide(pendingSide);
        setShowWagerDrawer(false);

        try {
            const result = await submitVote(prediction.id, pendingSide, amount);
            if (result.error) {
                alert(result.error); // Simple feedback for MVP
                setSelectedSide(null); // Revert
            } else {
                // Success! Bankroll updated via server revalidation or we can update local state context
                console.log("Bet placed!");
            }
        } catch (e) {
            console.error(e);
            setSelectedSide(null);
        }
    };

    return (
        <>
            <div className="relative h-full w-full snap-start overflow-hidden bg-black">
                {/* Background Image Removed for Simplicity */}

                {/* Content Layer */}
                <div className="relative z-10 flex h-full flex-col p-6 pb-24 font-sans text-white">

                    {/* Header Stats */}
                    <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-zinc-500">
                        <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 backdrop-blur-md border border-white/5">
                            <Clock size={12} className="text-zinc-400" />
                            <span>2d left</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 backdrop-blur-md border border-white/5">
                            <Users size={12} className="text-zinc-400" />
                            <span>{(prediction.volume / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="ml-auto rounded-full bg-brand/10 border border-brand/20 px-3 py-1.5 text-brand backdrop-blur-md">
                            {prediction.category}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="mt-8 flex flex-col flex-1 min-h-0">
                        <h1 className="text-3xl font-black leading-tight tracking-tighter shadow-black drop-shadow-2xl">
                            {prediction.question}
                        </h1>

                        {/* Engagement Row */}
                        <div className="mt-4 flex items-center gap-4">
                            <button
                                onClick={() => setShowComments(true)}
                                className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 transition-all hover:bg-white/10"
                            >
                                <MessageSquare size={14} className="text-zinc-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Discuss</span>
                            </button>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.origin);
                                    alert("Link copied!");
                                }}
                                className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 transition-all hover:bg-white/10"
                            >
                                <Share2 size={14} className="text-zinc-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Share</span>
                            </button>
                        </div>

                        {/* Central Visual Removed for Simplicity */}
                        <div className="flex-1" />
                    </div>

                    {/* Voting Area */}
                    <div className="mt-auto space-y-4 pb-4">
                        {/* Status Row */}
                        <div className="flex items-end justify-between px-2">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600">Market Probability</span>
                                <div className="h-[2px] w-8 bg-brand mt-1" />
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black text-success uppercase tracking-widest">{prediction.yesPercent}% Yes Confidence</span>
                            </div>
                        </div>

                        {/* Progress Bar (Minimal) */}
                        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-900 border border-white/5">
                            <div
                                className="h-full bg-success shadow-[0_0_10px_rgba(0,220,130,0.4)] transition-all duration-1000"
                                style={{ width: `${prediction.yesPercent}%` }}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                id={`yes-btn-${prediction.id}`}
                                onClick={() => handleOptionClick('YES')}
                                className={cn(
                                    "group relative flex h-14 flex-col items-center justify-center rounded-2xl border transition-all duration-300 active:scale-95",
                                    (selectedSide === 'YES' || pendingSide === 'YES')
                                        ? "border-success bg-success/20 text-success shadow-[0_0_20px_rgba(0,220,130,0.15)]"
                                        : isLocked
                                            ? "border-white/5 bg-white/5 text-white/5 opacity-40 cursor-not-allowed"
                                            : "border-white/10 bg-white/5 hover:border-success/40 hover:bg-success/5"
                                )}
                                disabled={isLocked}
                            >
                                <span className="text-sm font-black uppercase tracking-widest italic">Yes</span>
                                <span className="text-[9px] font-black mt-0.5 opacity-50 tracking-widest">{prediction.yesMultiplier}x</span>
                            </button>

                            <button
                                id={`no-btn-${prediction.id}`}
                                onClick={() => handleOptionClick('NO')}
                                className={cn(
                                    "group relative flex h-14 flex-col items-center justify-center rounded-2xl border transition-all duration-300 active:scale-95",
                                    (selectedSide === 'NO' || pendingSide === 'NO')
                                        ? "border-destructive bg-destructive/20 text-destructive shadow-[0_0_20px_rgba(255,42,109,0.15)]"
                                        : isLocked
                                            ? "border-white/5 bg-white/5 text-white/5 opacity-40 cursor-not-allowed"
                                            : "border-white/10 bg-white/5 hover:border-destructive/40 hover:bg-destructive/5"
                                )}
                                disabled={isLocked}
                            >
                                <span className="text-sm font-black uppercase tracking-widest italic">No</span>
                                <span className="text-[9px] font-black mt-0.5 opacity-50 tracking-widest">{prediction.noMultiplier}x</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CommentsDrawer isOpen={showComments} onClose={() => setShowComments(false)} />

            <WagerDrawer
                isOpen={showWagerDrawer}
                onClose={() => setShowWagerDrawer(false)}
                onConfirm={handleConfirmWager}
                side={pendingSide || 'YES'}
                multiplier={pendingSide === 'YES' ? prediction.yesMultiplier : prediction.noMultiplier}
                currentBankroll={bankroll}
            />
        </>
    );
}
