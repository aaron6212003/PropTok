"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Prediction } from '@/lib/types';
import { useSearchParams } from 'next/navigation';

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
    setIsOpen: (open: boolean) => void;
    currency: 'CASH' | 'CHIPS';
    setCurrency: (c: 'CASH' | 'CHIPS') => void;
    tournamentId: string | null;
    setTournamentId: (id: string | null) => void;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export function BetSlipProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<SlipItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [currency, setCurrency] = useState<'CASH' | 'CHIPS'>('CASH');
    const searchParams = useSearchParams();
    // Initialize from URL but allow overriding? 
    // Actually, normally the URL drives the state. If we want to set it via dropdown,
    // we should probably just use router.push to change the URL.
    // However, to satisfy the immediate type error and allow local state override if needed:
    const [tournamentIdState, setTournamentIdState] = useState<string | null>(null);

    // Sync with URL
    useEffect(() => {
        const tId = searchParams.get('tournament');
        if (tId) setTournamentIdState(tId);
        else setTournamentIdState(null);
    }, [searchParams]);

    const setTournamentId = (id: string | null) => {
        setTournamentIdState(id);
        // We might want to push to router here too, but for context API let's just update state
    };

    const addToSlip = (item: SlipItem) => {
        setItems(prev => {
            // Remove existing for same prediction if switching side
            const filtered = prev.filter(i => i.predictionId !== item.predictionId);
            setIsOpen(true);
            return [...filtered, item];
        });
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
            // setIsOpen(true); // Don't auto-open
            return [...prev, item];
        });
    };

    const clearSlip = () => {
        setItems([]);
        setIsOpen(false);
    };

    return (
        <BetSlipContext.Provider value={{
            items,
            addToSlip,
            removeFromSlip,
            toggleInSlip,
            clearSlip,
            isOpen,
            setIsOpen,
            currency,
            setCurrency,
            tournamentId: tournamentIdState,
            setTournamentId
        }}>
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
