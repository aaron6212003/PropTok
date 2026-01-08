import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prediction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Clock, TrendingUp, Users, MessageSquare, Share2, Lock } from 'lucide-react';
import CommentsDrawer from '@/components/social/comments-drawer';
import { WagerDrawer } from '@/components/feed/wager-drawer'; // Import
import { submitVote } from '@/app/actions'; // Import server action
import { CATEGORY_COLORS, CATEGORY_TEXT_COLORS } from '@/lib/constants';
import { CountdownTimer } from './countdown-timer';

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

    const yesVotes = Math.floor(prediction.volume * (prediction.yesPercent / 100));
    const noVotes = prediction.volume - yesVotes;

    return (
        <>
            <div className="relative h-full w-full snap-start overflow-hidden bg-black">
                {/* Dynamic Background Gradient */}
                <div
                    className="absolute inset-0 opacity-40 transition-colors duration-700"
                    style={{
                        background: `radial-gradient(circle at center, ${CATEGORY_COLORS[prediction.category] || CATEGORY_COLORS['Default']} 0%, #000000 100%)`
                    }}
                />

                {/* Content Layer */}
                <div className="relative z-10 flex h-full flex-col p-6 pt-24 pb-24 font-sans text-white h-full justify-center">

                    {/* Category Badge - Top Right */}
                    <div className="absolute top-24 right-6">
                        <div className="rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/10 shadow-lg">
                            <span className={cn(
                                "text-xs font-black uppercase tracking-widest",
                                CATEGORY_TEXT_COLORS[prediction.category] || 'text-white'
                            )}>
                                {prediction.category}
                            </span>
                        </div>
                    </div>

                    {/* Header Stats Removed - Moved to Bottom */}

                    {/* Main Content Area - Centered */}
                    <div className="flex flex-col flex-1 justify-center items-center my-auto w-full max-w-lg mx-auto">
                        <h1 className="text-4xl font-black leading-tight tracking-tighter text-center shadow-black drop-shadow-xl">
                            {prediction.question}
                        </h1>

                        <div className="mt-6 flex items-center justify-center gap-4">
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

                    </div>

                    {/* Voting Area */}
                    <div className="mt-auto space-y-4 pb-4">
                        {/* Status Row */}
                        <div className="flex items-end justify-between px-2">
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    <Clock size={10} />
                                    <CountdownTimer targetDate={prediction.expiresAt} />
                                </span>
                                <div className="flex gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                    <span>{yesVotes.toLocaleString()} YES</span>
                                    <span className="text-zinc-700">•</span>
                                    <span>{noVotes.toLocaleString()} NO</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn(
                                    "text-xs font-black uppercase tracking-widest",
                                    CATEGORY_TEXT_COLORS[prediction.category] || 'text-white'
                                )}>{prediction.yesPercent}% Yes</span>
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
                            <motion.button
                                id={`yes-btn-${prediction.id}`}
                                onClick={() => handleOptionClick('YES')}
                                whileTap={{ scale: 0.95 }}
                                animate={selectedSide === 'YES' ? { scale: 1.05 } : { scale: 1 }}
                                className={cn(
                                    "group relative flex h-14 flex-col items-center justify-center rounded-2xl border transition-all duration-300",
                                    (selectedSide === 'YES' || pendingSide === 'YES')
                                        ? "border-success bg-success/20 text-success shadow-[0_0_30px_rgba(0,220,130,0.3)]"
                                        : isLocked
                                            ? "border-white/5 bg-white/5 text-white/5 opacity-30 grayscale cursor-not-allowed"
                                            : "border-white/10 bg-white/5 hover:border-success/40 hover:bg-success/5"
                                )}
                                disabled={isLocked}
                            >
                                {selectedSide === 'YES' ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black uppercase tracking-widest italic">LOCKED</span>
                                        <Lock size={14} />
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm font-black uppercase tracking-widest italic">Yes</span>
                                        <span className="text-[9px] font-black mt-0.5 opacity-50 tracking-widest">{prediction.yesMultiplier}x</span>
                                    </>
                                )}
                            </motion.button>

                            <motion.button
                                id={`no-btn-${prediction.id}`}
                                onClick={() => handleOptionClick('NO')}
                                whileTap={{ scale: 0.95 }}
                                animate={selectedSide === 'NO' ? { scale: 1.05 } : { scale: 1 }}
                                className={cn(
                                    "group relative flex h-14 flex-col items-center justify-center rounded-2xl border transition-all duration-300",
                                    (selectedSide === 'NO' || pendingSide === 'NO')
                                        ? "border-destructive bg-destructive/20 text-destructive shadow-[0_0_30px_rgba(255,42,109,0.3)]"
                                        : isLocked
                                            ? "border-white/5 bg-white/5 text-white/5 opacity-30 grayscale cursor-not-allowed"
                                            : "border-white/10 bg-white/5 hover:border-destructive/40 hover:bg-destructive/5"
                                )}
                                disabled={isLocked}
                            >
                                {selectedSide === 'NO' ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black uppercase tracking-widest italic">LOCKED</span>
                                        <Lock size={14} />
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm font-black uppercase tracking-widest italic">No</span>
                                        <span className="text-[9px] font-black mt-0.5 opacity-50 tracking-widest">{prediction.noMultiplier}x</span>
                                    </>
                                )}
                            </motion.button>
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
