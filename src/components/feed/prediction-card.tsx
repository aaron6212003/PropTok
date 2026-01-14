import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Prediction } from '@/lib/types';
import { cn, vibrate } from '@/lib/utils';
import { Share2, Clock, Volume2, TrendingUp, HelpCircle, MessageCircle, MoreHorizontal, CheckCircle2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import CommentsDrawer from '@/components/social/comments-drawer';
import { CATEGORY_COLORS, CATEGORY_TEXT_COLORS } from '@/lib/constants';
import { CountdownTimer } from './countdown-timer';
import { useBetSlip } from '@/lib/context/bet-slip-context';
import { getTeamLogos } from '@/lib/logos';

interface PredictionCardProps {
    prediction: Prediction;
    isActive: boolean;
    bankroll: number;
}

export default function PredictionCard({ prediction, isActive, bankroll }: PredictionCardProps) {
    const [showComments, setShowComments] = useState(false);
    const logos = getTeamLogos(prediction.question);

    // Bet Slip Integration
    const { items, toggleInSlip } = useBetSlip();

    // Check if this card is in the slip
    const slipItem = items.find(i => i.predictionId === prediction.id);
    const selectedSide = slipItem?.side || null;

    const handleOptionClick = (side: 'YES' | 'NO') => {
        vibrate(10); // Haptic feedback
        toggleInSlip({
            predictionId: prediction.id,
            question: prediction.question,
            side,
            multiplier: side === 'YES' ? prediction.yesMultiplier : prediction.noMultiplier,
            category: prediction.category
        });
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
                <div className="relative z-10 flex h-full flex-col p-6 pt-24 pb-40 font-sans text-white h-full justify-center">

                    {/* Right Side Action Stack - Centered Vertically */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-6">

                        {/* Filter Toggle (Passed from Parent) */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={() => {
                                    vibrate(5);
                                    // Dispatch custom event or callback? 
                                    // For now, let's make it just a visual placeholder if we can't easily bubble up, 
                                    // BUT ideally we pass a prop. 
                                    // Since I can't easily change the parent prop in this single step without breaking build,
                                    // I'll emit a custom window event or use a global store. 
                                    // actually, let's just dispatch a click to the hidden filter button? No that's hacky.
                                    // CORRECT FIX: Update the interface in next step.
                                    document.dispatchEvent(new CustomEvent('toggle-filter'));
                                }}
                                className="group flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-all hover:bg-brand/20 hover:scale-110 active:scale-95"
                            >
                                <Filter size={20} className="text-white group-hover:text-brand" />
                            </button>
                            <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">Filter</span>
                        </div>

                        {/* Discuss */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={() => {
                                    vibrate(5);
                                    setShowComments(true);
                                }}
                                className="group flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-all hover:bg-white/20 hover:scale-110 active:scale-95"
                            >
                                <MessageCircle size={20} className="text-white" />
                            </button>
                            <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">{prediction.commentCount || 0}</span>
                        </div>

                        {/* Share */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={() => {
                                    vibrate(10);
                                    navigator.clipboard.writeText(window.location.origin);
                                    toast.success("Link copied!");
                                }}
                                className="group flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-all hover:bg-white/20 hover:scale-110 active:scale-95"
                            >
                                <Share2 size={20} className="text-white" />
                            </button>
                            <span className="text-[10px] font-bold text-white shadow-black drop-shadow-md">Share</span>
                        </div>
                    </div>

                    {/* Main Content Area - Centered */}
                    <div className="flex flex-col flex-1 justify-center items-center my-auto w-full max-w-xs mx-auto gap-6 pt-12 text-center pointer-events-none">
                        {/* Team Logos */}
                        {logos.length > 0 && (
                            <div className="flex items-center justify-center -space-x-4 mb-4 z-30 pointer-events-auto">
                                {logos.map((logo, idx) => (
                                    <div
                                        key={idx}
                                        className="h-20 w-20 rounded-full border-4 border-black bg-zinc-900 shadow-2xl overflow-hidden flex items-center justify-center p-2 group-hover:scale-110 transition-transform duration-500"
                                        style={{
                                            transform: `translateX(${idx === 0 ? '-10px' : '10px'}) rotate(${idx === 0 ? '-5deg' : '5deg'})`
                                        }}
                                    >
                                        <img src={logo} alt="Team Logo" className="h-full w-full object-contain filter drop-shadow-md" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Category Badge - Centered above question */}
                        <div className="rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/10 shadow-lg mb-2 pointer-events-auto z-30">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                CATEGORY_TEXT_COLORS[prediction.category] || 'text-white'
                            )}>
                                {prediction.category}
                            </span>
                        </div>

                        <Link
                            href={`/game/${prediction.externalId?.split('-')[0] || prediction.id}`}
                            className="group relative block pointer-events-auto z-30 p-4 -m-4 rounded-xl transition-colors hover:bg-white/5"
                        >
                            <h1 className="text-3xl font-black leading-tight tracking-tighter text-center shadow-black drop-shadow-xl active:scale-95 transition-transform group-hover:text-brand group-hover:scale-105">
                                {prediction.question}
                            </h1>
                            <div className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
                                Tap to view more lines
                            </div>
                        </Link>

                        {/* Removed Old Horizontal Buttons */}
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
                            {/* LIVE / LOCKED OVERLAY */}
                            {new Date(prediction.expiresAt) < new Date() && (
                                <div className="col-span-2 flex items-center justify-center gap-2 py-2 mb-1 bg-red-500/10 border border-red-500/20 rounded-xl animate-pulse">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                                        Live • Betting Suspended
                                    </span>
                                </div>
                            )}

                            <motion.button
                                id={`yes-btn-${prediction.id}`}
                                onClick={() => new Date(prediction.expiresAt) > new Date() && handleOptionClick('YES')}
                                whileTap={{ scale: 0.95 }}
                                disabled={new Date(prediction.expiresAt) < new Date()}
                                animate={selectedSide === 'YES' ? { scale: 1.02, borderColor: "rgba(0,220,130,0.8)" } : { scale: 1 }}
                                className={cn(
                                    "group relative flex h-14 flex-col items-center justify-center rounded-2xl border transition-all duration-300",
                                    selectedSide === 'YES'
                                        ? "border-success bg-success text-black shadow-[0_0_30px_rgba(0,220,130,0.3)]"
                                        : "border-white/10 bg-white/5 hover:border-success/40 hover:bg-success/5",
                                    new Date(prediction.expiresAt) < new Date() && "opacity-50 grayscale cursor-not-allowed hover:bg-white/5 hover:border-white/10"
                                )}
                            >
                                <span className="text-sm font-black uppercase tracking-widest italic">Yes</span>
                                <span className={cn("text-[9px] font-black mt-0.5 tracking-widest", selectedSide === 'YES' ? "text-black/60" : "text-white/50")}>
                                    {prediction.yesMultiplier}x
                                </span>
                            </motion.button>

                            <motion.button
                                id={`no-btn-${prediction.id}`}
                                onClick={() => new Date(prediction.expiresAt) > new Date() && handleOptionClick('NO')}
                                whileTap={{ scale: 0.95 }}
                                disabled={new Date(prediction.expiresAt) < new Date()}
                                animate={selectedSide === 'NO' ? { scale: 1.02, borderColor: "rgba(255,42,109,0.8)" } : { scale: 1 }}
                                className={cn(
                                    "group relative flex h-14 flex-col items-center justify-center rounded-2xl border transition-all duration-300",
                                    selectedSide === 'NO'
                                        ? "border-destructive bg-destructive text-white shadow-[0_0_30px_rgba(255,42,109,0.3)]"
                                        : "border-white/10 bg-white/5 hover:border-destructive/40 hover:bg-destructive/5",
                                    new Date(prediction.expiresAt) < new Date() && "opacity-50 grayscale cursor-not-allowed hover:bg-white/5 hover:border-white/10"
                                )}
                            >
                                <span className="text-sm font-black uppercase tracking-widest italic">No</span>
                                <span className={cn("text-[9px] font-black mt-0.5 tracking-widest", selectedSide === 'NO' ? "text-white/80" : "text-white/50")}>
                                    {prediction.noMultiplier}x
                                </span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            <CommentsDrawer
                predictionId={prediction.id}
                isOpen={showComments}
                onClose={() => setShowComments(false)}
            />
        </>
    );
}
