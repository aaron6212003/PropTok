"use client";

import { useRef, useState, useEffect } from 'react';
import PredictionCard from './prediction-card';
import { useScroll, useTransform } from 'framer-motion';
import { Prediction } from "@/lib/types";

interface PredictionFeedProps {
    initialPredictions: any[]; // We'll refine this type
}

export default function PredictionFeed({ initialPredictions }: PredictionFeedProps) {
    // Simple scroll snap implementation
    // In a real app we might use 'div' with scroll-snap-type: y mandatory

    return (
        <div className="h-[calc(100dvh-5rem)] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth pb-20 no-scrollbar">
            {initialPredictions.map((prediction) => (
                <PredictionCard
                    key={prediction.id}
                    prediction={{
                        id: prediction.id,
                        question: prediction.question,
                        category: prediction.category,
                        volume: prediction.volume || 1200, // Fallback for seeds
                        yesPercent: prediction.yes_percent || 50,
                        yesMultiplier: prediction.yes_multiplier || 1.9,
                        noMultiplier: prediction.no_multiplier || 1.9,
                        expiresAt: prediction.expires_at
                    }}
                    isActive={true}
                />
            ))}
        </div>
    );
}
