"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOCK_USER } from '@/lib/mock-data';

// Mock comments data
const MOCK_COMMENTS = [
    { id: '1', user: 'crypto_king', text: 'Bitcoin definitely hitting 100k, look at the volume!', side: 'YES', likes: 45, time: '2m' },
    { id: '2', user: 'bear_market', text: 'No way, resistance is too strong at 98k.', side: 'NO', likes: 12, time: '5m' },
    { id: '3', user: 'moon_b0y', text: 'LFG!!! 🚀', side: 'YES', likes: 8, time: '12m' },
    { id: '4', user: 'skeptic_sam', text: 'This is a trap.', side: 'NO', likes: 23, time: '15m' },
];

export default function CommentsDrawer({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [activeTab, setActiveTab] = useState<'ALL' | 'YES' | 'NO'>('ALL');

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 flex h-[70vh] flex-col rounded-t-3xl bg-zinc-900 shadow-2xl ring-1 ring-white/10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/5 p-4">
                            <h2 className="text-lg font-bold">Debate</h2>
                            <button onClick={onClose} className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-2">
                            {['ALL', 'YES', 'NO'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={cn(
                                        "flex-1 rounded-lg py-2 text-xs font-bold transition-colors",
                                        activeTab === tab
                                            ? "bg-white/10 text-white"
                                            : "text-zinc-500 hover:bg-white/5"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {MOCK_COMMENTS
                                .filter(c => activeTab === 'ALL' || c.side === activeTab)
                                .map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                        <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-800" />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-sm font-bold text-white">{comment.user}</span>
                                                <span className={cn(
                                                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                                                    comment.side === 'YES' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                                                )}>
                                                    {comment.side}
                                                </span>
                                                <span className="text-xs text-zinc-500">{comment.time}</span>
                                            </div>
                                            <p className="text-sm text-zinc-300">{comment.text}</p>
                                            <div className="flex items-center gap-4 pt-1">
                                                <button className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white">
                                                    <ThumbsUp size={12} />
                                                    {comment.likes}
                                                </button>
                                                <button className="text-xs text-zinc-500 hover:text-white">Reply</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Input */}
                        <div className="border-t border-white/10 bg-zinc-900 p-4 pb-8">
                            <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 ring-1 ring-white/10 focus-within:ring-brand">
                                <input
                                    type="text"
                                    placeholder="Add to the debate..."
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                                />
                                <button className="text-brand">
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
