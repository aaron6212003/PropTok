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

    // Search both Question and Description for maximum hit rate
    const searchString = `${prediction.question} ${prediction.description || ''}`;
    // Strictly filter logos by category to avoid "Bears" matching "Chicago Bears" in NCAAB
    const teams = getTeamLogos(searchString, prediction.category);
    const homeTeam = teams[0];
    const awayTeam = teams[1];

    // DEBUG: temporary log to find out why logos are missing
    // console.log(`[PredictionCard] "${prediction.question}" -> Found:`, teams);

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
            <div className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-black">
                {/* Dynamic Background Gradient (Hardware Accelerated) */}
                <div
                    className="absolute inset-0 opacity-40 transition-colors duration-700 ease-in-out will-change-[background]"
                    style={{
                        background: `radial-gradient(circle at center, ${homeTeam ? homeTeam.color : (CATEGORY_COLORS[prediction.category] || CATEGORY_COLORS['Default'])} 0%, #000000 85%)`,
                        transform: 'translateZ(0)' // Force GPU
                    }}
                />

                {/* 3D Ambient Logistics (Premium & Optimized: Straight & Balanced) */}
                {teams.length > 0 && (
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        {/* Home Team (Centered Above Text) */}
                        <div
                            className="absolute top-[18%] left-1/2 -translate-x-1/2 h-32 w-32 flex items-center justify-center opacity-40"
                            style={{
                                transform: 'translateZ(0)', // Force GPU
                                willChange: 'opacity'
                            }}
                        >
                            <img
                                src={homeTeam.url}
                                alt={homeTeam.name}
                                loading="lazy"
                                className="max-h-full max-w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                            />
                        </div>

                        {/* Away Team (Centered Below Text) */}
                        {awayTeam && (
                            <div
                                className="absolute bottom-[28%] left-1/2 -translate-x-1/2 h-32 w-32 flex items-center justify-center opacity-40"
                                style={{
                                    transform: 'translateZ(0)', // Force GPU
                                    willChange: 'opacity'
                                }}
                            >
                                <img
                                    src={awayTeam.url}
                                    alt={awayTeam.name}
                                    loading="lazy"
                                    className="max-h-full max-w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                                />
                            </div>
                        )}

                        {/* Fallback Single Logo (Center Watermark) */}
                        {teams.length === 1 && (
                            <div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 opacity-20 flex items-center justify-center"
                            >
                                <img
                                    src={homeTeam.url}
                                    alt="Background Logo Center"
                                    loading="lazy"
                                    className="max-h-full max-w-full object-contain"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* DEBUG FOOTER: Minimally invasive (kept for safety) */}
                <div className="absolute bottom-1 left-0 w-full text-center z-50 pointer-events-none opacity-20">
                    <span className="text-[9px] text-white/10 font-mono">
                        {teams.map(t => t.name).join(' vs ') || ''}
                    </span>
                </div>

                {/* Content Layer */}
                <div className="relative z-10 flex h-full flex-col p-6 pt-24 pb-40 font-sans text-white h-full justify-center">

                    {/* Right Side Action Stack - Centered Vertically */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-6">

                        {/* Filter Toggle (Passed from Parent) */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={() => {
                                    vibrate(5);
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

                        {/* LIVE / LOCKED OVERLAY (Moved Below Buttons) */}
                        {new Date(prediction.expiresAt) < new Date() && (
                            <div className="flex flex-col items-center justify-center gap-1.5 py-3 mb-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl shadow-inner w-full">
                                {/* Score Display (If Available) */}
                                {(prediction.status === 'live' || prediction.status === 'final' || (prediction.homeScore !== undefined)) && (
                                    <div className="flex items-center gap-6 text-3xl font-black italic tracking-tighter">
                                        <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{prediction.homeScore || 0}</span>
                                        <span className="text-zinc-600 text-lg font-bold not-italic">-</span>
                                        <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{prediction.awayScore || 0}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        {prediction.status !== 'final' && (
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        )}
                                        <span className={cn("relative inline-flex rounded-full h-2 w-2", prediction.status === 'final' ? "bg-zinc-500" : "bg-red-500")}></span>
                                    </span>
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", prediction.status === 'final' ? "text-zinc-500" : "text-red-500")}>
                                        {prediction.status === 'final' ? 'Final Result' : 'Live • Betting Suspended'}
                                    </span>
                                </div>
                            </div>
                        )}
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
