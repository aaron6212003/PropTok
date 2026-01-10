"use client";

import { useEffect, useState } from "react";
import { getTournamentLeaderboard } from "@/app/actions";
import { cn } from "@/lib/utils";

interface LiveLeaderboardProps {
    tournamentId: string;
    initialData: any[];
    currentUserId?: string;
}

export default function LiveLeaderboard({ tournamentId, initialData, currentUserId }: LiveLeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState(initialData);

    useEffect(() => {
        const interval = setInterval(async () => {
            const freshData = await getTournamentLeaderboard(tournamentId);
            if (freshData && freshData.length > 0) {
                setLeaderboard(freshData);
            }
        }, 5000); // Poll every 5 seconds for "Live" feel

        return () => clearInterval(interval);
    }, [tournamentId]);

    return (
        <div className="space-y-2">
            {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isMe = entry.user_id === currentUserId;

                return (
                    <div
                        key={entry.id}
                        className={cn(
                            "flex items-center justify-between rounded-xl border p-4 transition-all duration-500",
                            isMe ? "bg-brand/10 border-brand/50" : "bg-zinc-900 border-white/5"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <span className={cn(
                                "text-lg font-black w-8 text-center",
                                rank === 1 ? "text-yellow-400" :
                                    rank === 2 ? "text-zinc-300" :
                                        rank === 3 ? "text-amber-600" : "text-zinc-600"
                            )}>
                                #{rank}
                            </span>

                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-zinc-800 overflow-hidden">
                                    {entry.users?.avatar_url && (
                                        <img src={entry.users.avatar_url} className="h-full w-full object-cover" />
                                    )}
                                </div>
                                <div>
                                    <p className={cn("font-bold text-sm", isMe ? "text-brand" : "text-white")}>
                                        {entry.users?.username || "Anonymous"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="block font-mono font-bold text-white transition-all text-glow">
                                ${entry.current_stack.toLocaleString()}
                            </span>
                        </div>
                    </div>
                );
            })}

            {/* Live Indicator */}
            <div className="flex justify-center pt-4">
                <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 border border-success/20">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-success">Live Updates Active</span>
                </div>
            </div>
        </div>
    );
}
