"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { likeComment } from '@/app/actions';
import { toast } from 'sonner';

interface CommentItemProps {
    comment: {
        id: string;
        text: string;
        username: string;
        avatar_url: string;
        like_count: number;
        user_has_liked: boolean;
        created_at: string;
    };
    replies?: any[];
    onReply: (id: string, username: string) => void;
}

export default function CommentItem({ comment, replies = [], onReply }: CommentItemProps) {
    const [likes, setLikes] = useState(Number(comment.like_count));
    const [hasLiked, setHasLiked] = useState(comment.user_has_liked);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    const handleLike = async () => {
        // Optimistic UI
        const newHasLiked = !hasLiked;
        setHasLiked(newHasLiked);
        setLikes(prev => newHasLiked ? prev + 1 : prev - 1);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 500);

        const res = await likeComment(comment.id);
        if (res.error) {
            toast.error(res.error);
            // Revert on error
            setHasLiked(hasLiked);
            setLikes(likes);
        }
    };

    const timeAgo = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    };

    return (
        <div className="flex flex-col">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 group px-4 py-2 hover:bg-white/5 transition-colors rounded-2xl"
            >
                <div className="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-zinc-800 overflow-hidden">
                    {comment.avatar_url ? (
                        <img src={comment.avatar_url} alt={comment.username} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-black text-brand tracking-tight">@{comment.username || 'anon'}</span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{timeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed break-words">{comment.text}</p>

                    <div className="flex items-center gap-4 mt-2">
                        <button
                            onClick={handleLike}
                            className={cn(
                                "flex items-center gap-1.5 text-xs font-bold transition-all",
                                hasLiked ? "text-brand" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <div className="relative">
                                <AnimatePresence>
                                    {isAnimating && (
                                        <motion.div
                                            initial={{ scale: 1, opacity: 1 }}
                                            animate={{ scale: 2, opacity: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 text-brand"
                                        >
                                            <Heart size={14} fill="currentColor" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <Heart
                                    size={14}
                                    className={cn("transition-transform", isAnimating && "scale-125")}
                                    fill={hasLiked ? "currentColor" : "none"}
                                />
                            </div>
                            <span className="tabular-nums">{likes}</span>
                        </button>
                        <button
                            onClick={() => onReply(comment.id, comment.username)}
                            className="text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                        >
                            Reply
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Nested Replies */}
            {replies.length > 0 && (
                <div className="ml-14 mt-1">
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="flex items-center gap-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors group"
                    >
                        <div className="h-[1px] w-6 bg-zinc-800 group-hover:bg-zinc-600" />
                        <span>{showReplies ? "Hide" : `View ${replies.length} replies`}</span>
                        <ChevronDown
                            size={12}
                            className={cn("transition-transform", showReplies && "rotate-180")}
                        />
                    </button>

                    <AnimatePresence>
                        {showReplies && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden space-y-1 pl-2 border-l-2 border-zinc-900"
                            >
                                {replies.map(reply => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        onReply={onReply}
                                        replies={[]} // Only allow 1 level of nesting for visual clarity or recurse if needed
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
