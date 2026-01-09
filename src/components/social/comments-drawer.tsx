"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getComments, postComment } from '@/app/actions';
import CommentItem from './comment-item';
import { toast } from 'sonner';

export default function CommentsDrawer({
    isOpen,
    onClose,
    predictionId
}: {
    isOpen: boolean;
    onClose: () => void;
    predictionId: string;
}) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && predictionId) {
            fetchComments();
        }
    }, [isOpen, predictionId]);

    const fetchComments = async () => {
        setIsLoading(true);
        const data = await getComments(predictionId);
        setComments(data);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const res = await postComment(predictionId, newComment);

        if (res.success) {
            setNewComment("");
            fetchComments();
        } else {
            toast.error(res.error || "Failed to post comment");
        }
        setIsSubmitting(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop with premium blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl"
                    />

                    {/* Drawer - Cinematic Slide */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                        className="fixed bottom-0 left-0 right-0 z-[70] flex h-[85vh] flex-col rounded-t-[40px] bg-zinc-950 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10"
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center p-3">
                            <div className="h-1.5 w-12 rounded-full bg-white/10" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-2 border-b border-white/5">
                            <div className="flex flex-col">
                                <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Social Feed</h2>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{comments.length} Comments</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full bg-white/5 p-3 text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto py-6 no-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Loading Debate...</span>
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
                                    <div className="mb-6 rounded-full bg-brand/5 p-8 border border-brand/10">
                                        <Sparkles className="text-brand opacity-50" size={40} />
                                    </div>
                                    <h3 className="text-lg font-black uppercase italic text-white mb-2">Be the first to speak</h3>
                                    <p className="text-sm text-zinc-500 max-w-[200px] leading-relaxed">The debate is empty. Drop your take below!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {comments.map((comment) => (
                                        <CommentItem key={comment.id} comment={comment} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Input Area - Glassmorphism */}
                        <div className="p-6 pb-12 border-t border-white/5 bg-zinc-950/80 backdrop-blur-md">
                            <form
                                onSubmit={handleSubmit}
                                className="relative flex items-center gap-3 bg-white/5 rounded-[28px] p-2 pr-3 border border-white/5 focus-within:border-brand/40 focus-within:bg-white/10 transition-all shadow-2xl"
                            >
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Drop a take..."
                                    className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-zinc-600 font-medium text-white"
                                />
                                <button
                                    disabled={!newComment.trim() || isSubmitting}
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                                        newComment.trim() ? "bg-brand text-white shadow-lg shadow-brand/20 active:scale-90" : "bg-white/5 text-zinc-700"
                                    )}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
