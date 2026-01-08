"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Prediction } from '@/lib/types';

export interface SlipItem {
    predictionId: string;
    question: string;
    side: 'YES' | 'NO';
    multiplier: number;
    category: string;
}

interface BetSlipContextType {
    items: SlipItem[];
    addToSlip: (item: SlipItem) => void;
    removeFromSlip: (predictionId: string) => void;
    toggleInSlip: (item: SlipItem) => void;
    clearSlip: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    tournamentId: string | null;
    setTournamentId: (id: string | null) => void;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export function BetSlipProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<SlipItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [tournamentId, setTournamentId] = useState<string | null>(null);

    // Initial load from local storage could go here

    const addToSlip = (item: SlipItem) => {
        setItems(prev => {
            // Remove existing for same prediction if switching side
            const filtered = prev.filter(i => i.predictionId !== item.predictionId);
            return [...filtered, item];
        });
        // Auto-open if first item? Maybe not, keep it non-intrusive.
    };

    const removeFromSlip = (predictionId: string) => {
        setItems(prev => prev.filter(i => i.predictionId !== predictionId));
    };

    const toggleInSlip = (item: SlipItem) => {
        setItems(prev => {
            const exists = prev.find(i => i.predictionId === item.predictionId);
            if (exists) {
                // If clicking same side, remove. If diff side, switch.
                if (exists.side === item.side) {
                    return prev.filter(i => i.predictionId !== item.predictionId);
                } else {
                    return prev.map(i => i.predictionId === item.predictionId ? item : i);
                }
            }
            return [...prev, item];
        });
    };

    const clearSlip = () => {
        setItems([]);
        setIsOpen(false);
    };

    return (
        <BetSlipContext.Provider value={{ items, addToSlip, removeFromSlip, toggleInSlip, clearSlip, isOpen, setIsOpen, tournamentId, setTournamentId }}>
            {children}
        </BetSlipContext.Provider>
    );
}

export function useBetSlip() {
    const context = useContext(BetSlipContext);
    if (context === undefined) {
        throw new Error('useBetSlip must be used within a BetSlipProvider');
    }
    return context;
}
