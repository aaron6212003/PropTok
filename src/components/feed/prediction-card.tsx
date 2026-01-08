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
                {/* Background Image */}
                {prediction.imageUrl && (
                    <div className="absolute inset-0 z-0">
                        <img
                            src={prediction.imageUrl}
                            alt="Background"
                            className="h-full w-full object-cover opacity-40"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
                    </div>
                )}

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
                    <div className="mt-12 flex flex-col flex-1">
                        <h1 className="text-4xl font-black leading-[1.1] tracking-tighter shadow-black drop-shadow-2xl">
                            {prediction.question}
                        </h1>

                        {/* Engagement Row */}
                        <div className="mt-8 flex items-center gap-6 border-y border-white/5 py-6">
                            <button
                                onClick={() => setShowComments(true)}
                                className="flex items-center gap-2 group"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all group-hover:bg-white/10">
                                    <MessageSquare size={18} className="text-zinc-400 group-hover:text-white" />
                                </div>
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Discuss</span>
                                    <span className="text-xs font-bold mt-1 text-zinc-300">245 Opinions</span>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(window.location.origin);
                                    alert("Link copied!");
                                }}
                                className="flex items-center gap-2 group"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all group-hover:bg-white/10">
                                    <Share2 size={18} className="text-zinc-400 group-hover:text-white" />
                                </div>
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Invite</span>
                                    <span className="text-xs font-bold mt-1 text-zinc-300">Share Link</span>
                                </div>
                            </button>
                        </div>

                        {/* Social Void Filler: Featured Comment & Pulse */}
                        <div className="flex-1 flex flex-col justify-center relative py-8">
                            {/* Background Graphic: Subtle Peak Pulse */}
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 opacity-20 pointer-events-none">
                                <svg viewBox="0 0 400 100" className="w-full h-full text-brand fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
                                    <path d="M0 80 Q 50 80, 100 40 T 200 60 T 300 10 T 400 80" className="animate-pulse" />
                                </svg>
                            </div>

                            {/* Featured Comment Preview */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="glass relative z-10 self-start max-w-[85%] rounded-[24px] rounded-tl-none p-4 shadow-2xl"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-4 w-4 rounded-full bg-brand/40" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">@whale_watcher</span>
                                    <span className="text-[10px] font-bold text-zinc-600">3h ago</span>
                                </div>
                                <p className="text-sm font-bold text-zinc-200 leading-snug">
                                    "No way his passing line stays this low with the weather clearing up. Easiest YES of the week."
                                </p>
                            </motion.div>
                        </div>
                    </div>

                    {/* Voting / Stats Area */}
                    <div className="mt-auto space-y-6">

                        {/* Live Percentages & Status */}
                        <div className="flex items-end justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Market Sentiment</span>
                                <span className="text-2xl font-black text-white italic">Mostly Bullish</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-black text-success uppercase tracking-widest">{prediction.yesPercent}% YES</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5 p-[1px] border border-white/5">
                            <div
                                className="h-full bg-success transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,220,130,0.3)]"
                                style={{ width: `${prediction.yesPercent}%` }}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleOptionClick('YES')}
                                className={cn(
                                    "group relative flex h-20 flex-col items-center justify-center rounded-[24px] border transition-all duration-300 active:scale-95",
                                    (selectedSide === 'YES' || pendingSide === 'YES')
                                        ? "border-success bg-success/20 text-success shadow-[0_0_30px_rgba(0,220,130,0.15)]"
                                        : isLocked
                                            ? "border-white/5 bg-white/5 text-white/10 opacity-20"
                                            : "border-white/10 bg-white/5 hover:border-success/40 hover:bg-success/5"
                                )}
                                disabled={isLocked}
                            >
                                <span className="text-lg font-black uppercase tracking-widest italic">Yes</span>
                                <span className="text-[10px] font-black mt-0.5 opacity-60 tracking-widest">{prediction.yesMultiplier}x Payout</span>
                            </button>

                            <button
                                onClick={() => handleOptionClick('NO')}
                                className={cn(
                                    "group relative flex h-20 flex-col items-center justify-center rounded-[24px] border transition-all duration-300 active:scale-95",
                                    (selectedSide === 'NO' || pendingSide === 'NO')
                                        ? "border-destructive bg-destructive/20 text-destructive shadow-[0_0_30px_rgba(255,42,109,0.15)]"
                                        : isLocked
                                            ? "border-white/5 bg-white/5 text-white/10 opacity-20"
                                            : "border-white/10 bg-white/5 hover:border-destructive/40 hover:bg-destructive/5"
                                )}
                                disabled={isLocked}
                            >
                                <span className="text-lg font-black uppercase tracking-widest italic">No</span>
                                <span className="text-[10px] font-black mt-0.5 opacity-60 tracking-widest">{prediction.noMultiplier}x Payout</span>
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
