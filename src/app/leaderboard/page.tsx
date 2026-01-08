import BottomNavBar from '@/components/layout/bottom-nav';
import { cn } from '@/lib/utils';
import { Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { getLeaderboard } from '../actions';
import { createClient } from '@/lib/supabase/server';

function RankChange({ change }: { change: string | null }) {
    if (change === 'up') return <ArrowUp size={14} className="text-success" />;
    if (change === 'down') return <ArrowDown size={14} className="text-destructive" />;
    return <Minus size={14} className="text-zinc-500" />;
}

export default async function LeaderboardPage() {
    const leaderboard = await getLeaderboard();
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    return (
        <main className="relative flex h-full w-full flex-col overflow-y-auto bg-black pb-24 text-white">
            {/* Header */}
            <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 p-4 backdrop-blur-md">
                <h1 className="text-center text-xl font-bold tracking-tight">Leaderboard</h1>
                <div className="mt-4 flex rounded-lg bg-zinc-900 p-1">
                    {['Global', 'Friends', 'Crypto'].map((tab, i) => (
                        <button
                            key={tab}
                            className={cn(
                                "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                                i === 0 ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 p-2">
                {leaderboard.map((user, index) => {
                    const isMe = currentUser?.id === user.id;
                    const rank = index + 1;

                    return (
                        <div
                            key={user.id}
                            className={cn(
                                "mb-2 flex items-center justify-between rounded-xl border p-3 transition-colors",
                                isMe
                                    ? "border-brand/30 bg-brand/10 shadow-[0_0_15px_-3px_rgba(37,99,235,0.2)]"
                                    : "border-transparent bg-white/5 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex w-6 flex-col items-center justify-center gap-1">
                                    <span className={cn(
                                        "text-lg font-bold",
                                        rank <= 3 ? "text-yellow-400" : "text-zinc-500"
                                    )}>
                                        #{rank}
                                    </span>
                                    {/* Placeholder for rank change (requires history table) */}
                                    <RankChange change="same" />
                                </div>

                                <div className="relative h-10 w-10 rounded-full bg-zinc-800 border border-white/10">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.username} className="h-full w-full rounded-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <span className={cn("font-bold", isMe && "text-brand")}>
                                        {user.username || "Anonymous"}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        {user.streak || 0} Streak 🔥 • {user.wins || 0} Wins
                                    </span>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="block text-lg font-bold text-white">{user.win_rate || 0}%</span>
                                <span className="text-[10px] uppercase text-zinc-500">Win Rate</span>
                            </div>
                        </div>
                    );
                })}

                {leaderboard.length === 0 && (
                    <div className="py-20 text-center text-zinc-500">
                        No players yet! Be the first to win.
                    </div>
                )}
            </div>

            <nav className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </nav>
        </main>
    );
}
