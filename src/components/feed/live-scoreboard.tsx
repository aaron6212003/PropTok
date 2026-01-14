
"use client";

import { useEffect, useState } from "react";

interface ScoreEvent {
    id: string;
    league: string;
    home: string;
    away: string;
    scoreHome: string | number;
    scoreAway: string | number;
    status: string;
    clock: string;
    period?: string;
}

export function LiveScoreboard() {
    const [events, setEvents] = useState<ScoreEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const res = await fetch('/api/live-scores');
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data.events || []);
                }
            } catch (error) {
                console.error("Failed to fetch live scores", error);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
        // Poll every 60 seconds
        const interval = setInterval(fetchScores, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return null;
    if (events.length === 0) return null;

    return (
        <div className="w-full bg-slate-900/80 backdrop-blur-md border-b border-white/10 py-2">
            <div className="container max-w-md mx-auto px-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Sweat Station</span>
                </div>

                {/* Horizontal Scroll Container */}
                <div className="w-full overflow-x-auto no-scrollbar pb-1">
                    <div className="flex w-max space-x-3">
                        {events.map((game) => (
                            <div key={game.id} className="inline-flex flex-col justify-center min-w-[140px] px-3 py-2 rounded-lg bg-black/40 border border-white/5">
                                <div className="flex justify-between items-center text-xs mb-1">
                                    <span className="font-bold text-slate-400">{game.league}</span>
                                    <span className="text-[10px] text-slate-500">{game.status === 'Live' ? game.clock : game.status}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-white mb-0.5">
                                    <span>{game.away}</span>
                                    <span>{game.scoreAway}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium text-white">
                                    <span>{game.home}</span>
                                    <span>{game.scoreHome}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
