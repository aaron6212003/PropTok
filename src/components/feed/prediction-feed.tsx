"use client";

import { useRef, useState, useEffect } from 'react';
import PredictionCard from './prediction-card';
import { useScroll, useTransform } from 'framer-motion';
import { Prediction } from "@/lib/types";

interface PredictionFeedProps {
    initialPredictions: any[];
    bankroll: number;
}

export default function PredictionFeed({ initialPredictions, bankroll }: PredictionFeedProps) {
    // Simple scroll snap implementation
    // In a real app we might use 'div' with scroll-snap-type: y mandatory

    return (
        <div className="h-[calc(100dvh-5rem)] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth pb-20 no-scrollbar">
            {initialPredictions.map((prediction) => {
                const yesProb = (prediction.yes_percent || 50) / 100;
                const yesMultiplier = Number((0.95 / Math.max(0.01, yesProb)).toFixed(2));
                const noMultiplier = Number((0.95 / Math.max(0.01, 1 - yesProb)).toFixed(2));

                return (
                    <PredictionCard
                        key={prediction.id}
                        prediction={{
                            id: prediction.id,
                            question: prediction.question,
                            category: prediction.category,
                            volume: prediction.volume || 1200,
                            yesPercent: prediction.yes_percent || 50,
                            yesMultiplier,
                            noMultiplier,
                            expiresAt: prediction.expires_at,
                            imageUrl: prediction.image_url
                        }}
                        isActive={true}
                        bankroll={bankroll}
                    />
                );
            })}
        </div>
    );
}
