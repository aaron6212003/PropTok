"use client";

import { useState } from "react";
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
const MAX_PULL = 180;

export default function PullToRefresh({ onRefresh, children, className, scrollContainerRef }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);

    // Motion value for performant animations
    const pullY = useMotionValue(0);

    // Simplest transforms for maximum stability
    const rotate = useTransform(pullY, [0, PULL_THRESHOLD], [0, 180]);
    const opacity = useTransform(pullY, [20, PULL_THRESHOLD], [0, 1]);
    const scale = useTransform(pullY, [0, PULL_THRESHOLD], [0.8, 1]);

    const handleTouchStart = (e: React.TouchEvent) => {
        // Strict Scroll Check: Only allow pull if we are EXACTLY at the top
        const scrollTop = scrollContainerRef?.current?.scrollTop ?? window.scrollY ?? 0;

        if (scrollTop > 0 || isRefreshing) return;

        const startY = e.touches[0].pageY;
        let isPulling = false;

        const handleTouchMove = (moveEvent: TouchEvent) => {
            const currentY = moveEvent.touches[0].pageY;
            const diff = currentY - startY;

            // 1. Must be pulling DOWN
            if (diff > 5) { // Dead zone of 5px to prevent jittery triggers
                // 2. Check scroll position again (in case it changed)
                const currentScroll = scrollContainerRef?.current?.scrollTop ?? window.scrollY ?? 0;
                if (currentScroll > 0) return;

                // 3. Engage Pull
                isPulling = true;

                // Prevent browser refresh/scroll
                if (moveEvent.cancelable) {
                    moveEvent.preventDefault();
                }

                // LINEAR DAMPENING (Factor 0.5)
                // Reliable, consistent, no weird math.
                // Subtract dead zone so it starts at 0
                const resistance = Math.min((diff - 5) * 0.5, MAX_PULL);

                pullY.set(resistance);
                setPullDistance(resistance);
            }
        };

        const handleTouchEnd = async () => {
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);

            if (!isPulling) return;

            const finalPull = pullY.get();

            if (finalPull >= PULL_THRESHOLD) {
                // Refresh Triggered
                setIsRefreshing(true);
                animate(pullY, PULL_THRESHOLD, { type: "spring", stiffness: 300, damping: 30 });

                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);

                try {
                    await onRefresh();

                    setIsComplete(true);
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([10, 30, 10]);

                    setTimeout(() => {
                        reset();
                    }, 800);
                } catch (e) {
                    reset();
                }
            } else {
                // Cancelled
                reset();
            }
        };

        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);
    };

    const reset = () => {
        setIsComplete(false);
        setIsRefreshing(false);
        setPullDistance(0);
        animate(pullY, 0, { type: "spring", stiffness: 300, damping: 30 });
    };

    return (
        <div
            className={cn("relative h-full w-full", className)}
            onTouchStart={handleTouchStart}
            style={{ touchAction: 'pan-y' }} // Allow vertical scroll but let JS handle overrides
        >
            {/* Refresh Indicator */}
            <div className="absolute left-0 right-0 top-6 z-50 flex justify-center pointer-events-none">
                <motion.div
                    style={{
                        opacity,
                        scale,
                        y: useTransform(pullY, [0, PULL_THRESHOLD], [-40, 0])
                    }}
                    className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border bg-zinc-950/90 backdrop-blur-md shadow-xl transition-colors duration-300",
                        isComplete ? "border-success/50 bg-success/10" : "border-zinc-800"
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

            {/* Content w/ Transform */}
            <motion.div
                style={{ y: pullY }}
                className="h-full w-full"
            >
                {children}
            </motion.div>
        </div>
    );
}
