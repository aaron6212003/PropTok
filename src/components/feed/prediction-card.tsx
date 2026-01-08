import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prediction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Clock, TrendingUp, Users, MessageSquare } from 'lucide-react';
import CommentsDrawer from '@/components/social/comments-drawer';
import { WagerDrawer } from '@/components/feed/wager-drawer'; // Import
import { submitVote } from '@/app/actions'; // Import server action

interface PredictionCardProps {
    prediction: Prediction;
    isActive: boolean;
}

export default function PredictionCard({ prediction, isActive }: PredictionCardProps) {
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

                {/* Action Sidebar (TikTok style) */}
                <div className="absolute right-2 bottom-32 z-20 flex flex-col gap-6">
                    <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-transform active:scale-90">
                            <MessageSquare size={20} className="fill-white text-white" />
                        </div>
                        <span className="text-xs font-bold drop-shadow-md">245</span>
                    </button>
                    {/* Placeholder for Share/More */}
                </div>

                {/* Content Layer */}
                <div className="relative z-10 flex h-full flex-col justify-between p-6 pb-24 font-sans text-white">

                    {/* Header Stats */}
                    <div className="flex items-center gap-4 text-xs font-medium text-white/80">
                        <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 backdrop-blur-sm">
                            <Clock size={12} />
                            <span>2d left</span>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 backdrop-blur-sm">
                            <Users size={12} />
                            <span>{(prediction.volume / 1000).toFixed(1)}k</span>
                        </div>
                        <div className="ml-auto rounded-full bg-brand/20 px-2 py-1 text-brand backdrop-blur-sm">
                            {prediction.category}
                        </div>
                    </div>

                    {/* Main Question Area */}
                    <div className="mt-8 flex-1 flex flex-col justify-center pr-12"> {/* Added PR for sidebar */}
                        <h1 className="text-3xl font-bold leading-tight tracking-tight shadow-black drop-shadow-lg">
                            {prediction.question}
                        </h1>
                        {prediction.description && (
                            <p className="mt-4 text-sm text-gray-300 drop-shadow-md">
                                {prediction.description}
                            </p>
                        )}
                    </div>

                    {/* Voting / Stats Area */}
                    <div className="mt-auto space-y-4">

                        {/* Live Percentages */}
                        <div className="flex items-center justify-between text-sm font-bold tracking-wider">
                            <span className="text-success">{prediction.yesPercent}% YES</span>
                            <span className="text-destructive">{100 - prediction.yesPercent}% NO</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full bg-success transition-all duration-1000 ease-out"
                                style={{ width: `${prediction.yesPercent}%` }}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleOptionClick('YES')}
                                className={cn(
                                    "group relative flex h-16 flex-col items-center justify-center rounded-2xl border transition-all duration-200 active:scale-95",
                                    (selectedSide === 'YES' || pendingSide === 'YES') // Highlight on pending too? Maybe not until locked.
                                        ? "border-success bg-success/20 text-success"
                                        : isLocked
                                            ? "border-white/5 bg-white/5 text-white/20 blur-[2px]"
                                            : "border-white/20 bg-white/10 hover:bg-white/20"
                                )}
                                disabled={isLocked}
                            >
                                <span className="text-lg font-black uppercase tracking-widest">Yes</span>
                                <span className="text-xs font-medium opacity-80">{prediction.yesMultiplier}x</span>
                            </button>

                            <button
                                onClick={() => handleOptionClick('NO')}
                                className={cn(
                                    "group relative flex h-16 flex-col items-center justify-center rounded-2xl border transition-all duration-200 active:scale-95",
                                    (selectedSide === 'NO' || pendingSide === 'NO')
                                        ? "border-destructive bg-destructive/20 text-destructive"
                                        : isLocked
                                            ? "border-white/5 bg-white/5 text-white/20 blur-[2px]"
                                            : "border-white/20 bg-white/10 hover:bg-white/20"
                                )}
                                disabled={isLocked}
                            >
                                <span className="text-lg font-black uppercase tracking-widest">No</span>
                                <span className="text-xs font-medium opacity-80">{prediction.noMultiplier}x</span>
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
                currentBankroll={1000}
            />
        </>
    );
}
