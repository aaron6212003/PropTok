"use client";

import { AnimatePresence } from "framer-motion";
import BetCard from "./bet-card";
import EmptyState from "@/components/ui/empty-state";
import { Clock } from "lucide-react";

interface HistoryListProps {
    history: any[];
}

export default function HistoryList({ history }: HistoryListProps) {
    return (
        <div className="space-y-3">
            <AnimatePresence mode="popLayout">
                {history.map((bet: any) => (
                    <BetCard key={bet.id} bet={bet} />
                ))}
            </AnimatePresence>

            {history.length === 0 && (
                <EmptyState
                    icon={Clock}
                    title="No Bets Yet"
                    description="You haven't placed any bets yet. Head over to the feed to start predicting!"
                    actionText="Explore Markets"
                    onAction={() => window.location.href = '/'}
                    className="py-12"
                />
            )}
        </div>
    );
}
