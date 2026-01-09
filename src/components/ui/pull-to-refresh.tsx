"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    className?: string;
    scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 200;

export default function PullToRefresh({ onRefresh, children, className, scrollContainerRef }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [pullDistance, setPullDistance] = useState(0); // State for UI logic

    // Motion value for performant animations
    const pullY = useMotionValue(0);

    // Transforms for the indicator
    const rotate = useTransform(pullY, [0, PULL_THRESHOLD], [0, 180]);
    const opacity = useTransform(pullY, [0, PULL_THRESHOLD / 2, PULL_THRESHOLD], [0, 0.5, 1]);
    const scale = useTransform(pullY, [0, PULL_THRESHOLD], [0.5, 1]); // Starts smaller

    // Dynamic background resistance (Rubber Banding)
    const calculateResistance = (diff: number) => {
        // Logarithmic decay formula for "heavy" feel
        return (diff * 0.5) * (1 - Math.min(diff, MAX_PULL * 2) / (MAX_PULL * 3));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        // 1. Check if we are at the top
        const scrollTop = scrollContainerRef?.current?.scrollTop || window.scrollY || 0;

        if (scrollTop > 0 || isRefreshing) return;

        const startY = e.touches[0].pageY;
        let isPulling = false;

        const handleTouchMove = (moveEvent: TouchEvent) => {
            const currentY = moveEvent.touches[0].pageY;
            const diff = currentY - startY;

            // Only engage if pulling DOWN and at Top
            if (diff > 0) {
                // If we scroll DOWN during pull, ignore
                if ((scrollContainerRef?.current?.scrollTop || window.scrollY) > 0) return;

                // Engage pull gesture
                isPulling = true;

                // Prevent native scroll/refresh
                if (diff < MAX_PULL && moveEvent.cancelable) {
                    moveEvent.preventDefault();
                }

                const resistedPull = calculateResistance(diff);
                pullY.set(resistedPull);
                setPullDistance(resistedPull);
            }
        };

        const handleTouchEnd = async () => {
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);

            if (!isPulling) return;

            const finalPull = pullY.get();

            if (finalPull >= PULL_THRESHOLD) {
                // Trigger Refresh
                setIsRefreshing(true);

                // Snap to threshold (Tighter Spring)
                animate(pullY, PULL_THRESHOLD, { type: "spring", stiffness: 400, damping: 25 });

                // Haptic feedback if available (Mobile only)
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);

                try {
                    await onRefresh();

                    // Success State
                    setIsComplete(true);
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([10, 30, 10]);

                    setTimeout(() => {
                        closeRefresh();
                    }, 800);
                } catch (e) {
                    closeRefresh();
                }
            } else {
                // Cancel (Snap back quickly)
                closeRefresh();
            }
        };

        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);
    };

    const closeRefresh = () => {
        setIsComplete(false);
        setIsRefreshing(false);
        setPullDistance(0);
        animate(pullY, 0, { type: "spring", stiffness: 500, damping: 35 });
    };

    return (
        <div
            className={cn("relative h-full w-full", className)}
            onTouchStart={handleTouchStart}
        >
            {/* Refresh Indicator Bubble */}
            <div className="absolute left-0 right-0 top-6 z-50 flex justify-center pointer-events-none">
                <motion.div
                    style={{
                        opacity,
                        scale,
                        y: useTransform(pullY, [0, PULL_THRESHOLD], [-40, 0])
                    }}
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border bg-zinc-950/80 backdrop-blur-md shadow-xl transition-colors duration-300",
                        isComplete ? "border-success/50 bg-success/10" :
                            pullDistance >= PULL_THRESHOLD ? "border-brand/50 bg-brand/10" : "border-white/10"
                    )}
                >
                    <AnimatePresence mode="wait">
                        {isRefreshing ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                            >
                                <Loader2 className="h-5 w-5 animate-spin text-brand" />
                            </motion.div>
                        ) : isComplete ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                            >
                                <Sparkles className="h-5 w-5 text-success fill-current" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="pulling"
                                style={{ rotate }}
                            >
                                <RefreshCw className={cn(
                                    "h-5 w-5 transition-colors",
                                    pullDistance >= PULL_THRESHOLD ? "text-brand" : "text-zinc-500"
                                )} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Main Content (Pushes Down) */}
            <motion.div
                style={{ y: pullY }}
                className="h-full w-full"
            >
                {children}
            </motion.div>
        </div>
    );
}
