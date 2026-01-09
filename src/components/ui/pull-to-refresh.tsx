"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, useMotionValue, animate, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    className?: string;
}

const PULL_THRESHOLD = 70; // Tightened from 100

export default function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const pullY = useMotionValue(0);

    const opacity = useTransform(pullY, [0, PULL_THRESHOLD], [0, 1]);
    const scale = useTransform(pullY, [0, PULL_THRESHOLD], [0.8, 1.2]);
    const rotate = useTransform(pullY, [0, PULL_THRESHOLD], [0, 360]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isRefreshing || window.scrollY > 0) return;
        const startY = e.touches[0].pageY;

        const handleTouchMove = (moveEvent: TouchEvent) => {
            const currentY = moveEvent.touches[0].pageY;
            const diff = currentY - startY;
            if (diff > 0 && window.scrollY <= 0) {
                // More direct pulling physics for faster response
                const pull = Math.pow(diff, 0.92); // Tightened from 0.85
                setPullDistance(pull);
                pullY.set(pull);
                if (diff > 10) {
                    if (moveEvent.cancelable) moveEvent.preventDefault();
                }
            }
        };

        const handleTouchEnd = async () => {
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);

            if (pullDistance >= PULL_THRESHOLD) {
                setIsRefreshing(true);
                animate(pullY, PULL_THRESHOLD, { type: "spring", stiffness: 300, damping: 30 });

                try {
                    await onRefresh();
                    setIsComplete(true);
                    setTimeout(() => {
                        setIsComplete(false);
                        setIsRefreshing(false);
                        animate(pullY, 0, { type: "spring", stiffness: 300, damping: 30 });
                        setPullDistance(0);
                    }, 1000);
                } catch (error) {
                    setIsRefreshing(false);
                    animate(pullY, 0, { type: "spring", stiffness: 300, damping: 30 });
                    setPullDistance(0);
                }
            } else {
                animate(pullY, 0, { type: "spring", stiffness: 300, damping: 30 });
                setPullDistance(0);
            }
        };

        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);
    };

    return (
        <div
            className={cn("relative w-full overflow-hidden", className)}
            onTouchStart={handleTouchStart}
        >
            {/* Refresh Indicator */}
            <div
                className="absolute left-0 right-0 z-50 flex justify-center pointer-events-none"
                style={{ top: 20 }}
            >
                <motion.div
                    style={{
                        opacity,
                        scale,
                        y: useTransform(pullY, [0, PULL_THRESHOLD], [-20, 0])
                    }}
                    className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-xl shadow-2xl transition-colors duration-500",
                        pullDistance >= PULL_THRESHOLD ? "border-brand shadow-brand/40" : "border-white/10"
                    )}
                >
                    <AnimatePresence mode="wait">
                        {isRefreshing ? (
                            <motion.div
                                key="refreshing"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="relative"
                            >
                                <div className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
                                <Loader2 className="h-6 w-6 animate-spin text-brand" />
                            </motion.div>
                        ) : isComplete ? (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                            >
                                <Sparkles className="h-6 w-6 text-success" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="pulling"
                                style={{ rotate }}
                                className="text-white/60"
                            >
                                <Sparkles className={cn(
                                    "h-6 w-6 transition-colors",
                                    pullDistance >= PULL_THRESHOLD ? "text-brand" : ""
                                )} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Glowing Aura when threshold met */}
                    {pullDistance >= PULL_THRESHOLD && !isRefreshing && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1.2 }}
                            className="absolute inset-0 -z-10 rounded-full bg-brand/20 blur-xl"
                        />
                    )}
                </motion.div>
            </div>

            {/* Content Wrapper */}
            <motion.div
                style={{ y: pullY }}
                className="h-full w-full"
            >
                {children}
            </motion.div>
        </div>
    );
}
