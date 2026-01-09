"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionText?: string;
    onAction?: () => void;
    className?: string;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionText,
    onAction,
    className
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex flex-col items-center justify-center py-20 px-6 text-center", className)}
        >
            <div className="mb-6 rounded-full bg-white/5 p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-brand/5 blur-2xl group-hover:bg-brand/10 transition-colors" />
                <Icon size={48} className="text-zinc-500 relative z-10 group-hover:text-brand transition-colors" />
            </div>

            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-white shadow-xl">
                {title}
            </h3>
            <p className="text-sm text-zinc-500 max-w-[280px] mb-8 leading-relaxed font-medium">
                {description}
            </p>

            {actionText && onAction && (
                <button
                    onClick={onAction}
                    className="rounded-2xl bg-white px-8 py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-xl transition-all active:scale-95 hover:bg-zinc-200"
                >
                    {actionText}
                </button>
            )}
        </motion.div>
    );
}
