import { getTournament, getTournamentLeaderboard } from "@/app/actions";
import BottomNavBar from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";
import { Trophy, Clock, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const tournament = await getTournament(id);
    const leaderboard = await getTournamentLeaderboard(id);
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!tournament) return <div className="p-10 text-center text-white">Tournament not found</div>;

    const myEntry = leaderboard.find(e => e.user_id === currentUser?.id);
    const myRank = myEntry ? leaderboard.indexOf(myEntry) + 1 : null;

    return (
        <main className="flex min-h-screen flex-col bg-black text-white pb-32">
            {/* Header */}
            <div className="relative border-b border-white/10 bg-zinc-900/50 pb-8 pt-6">
                <div className="absolute inset-0 bg-brand/5 blur-3xl pointer-events-none" />

                <div className="px-6">
                    <Link href="/tournaments" className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white">
                        <ArrowLeft size={16} />
                        Back
                    </Link>

                    <div className="flex items-start justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <span className="flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-brand">
                                    <Trophy size={10} />
                                    Active
                                </span>
                                <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    <Users size={10} />
                                    {leaderboard.length} Players
                                </span>
                            </div>
                            <h1 className="text-3xl font-black italic tracking-tighter text-white">
                                {tournament.name}
                            </h1>
                            <p className="mt-2 max-w-md text-sm text-zinc-400">
                                {tournament.description}
                            </p>
                        </div>
                    </div>

                    {/* My Stats */}
                    {myEntry && (
                        <div className="mt-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4 border border-white/10">
                                <div>
                                    <span className="block text-xs text-zinc-500">Your Rank</span>
                                    <span className="text-2xl font-black text-white">#{myRank}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs text-zinc-500">Your Stack</span>
                                    <span className="text-2xl font-black text-brand">${myEntry.current_stack.toLocaleString()}</span>
                                </div>
                            </div>

                            <Link
                                href={`/?tournament=${id}`}
                                className="w-full py-4 bg-brand text-black font-black uppercase tracking-widest text-center rounded-xl shadow-lg shadow-brand/20 active:scale-[0.98] transition-all"
                            >
                                Bet Now
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="px-4 py-6">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500 px-2">Live Standings</h2>

                <div className="space-y-2">
                    {leaderboard.map((entry, index) => {
                        const rank = index + 1;
                        const isMe = entry.user_id === currentUser?.id;

                        return (
                            <div
                                key={entry.id}
                                className={cn(
                                    "flex items-center justify-between rounded-xl border p-4 transition-all",
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
                                    <span className="block font-mono font-bold text-white">${entry.current_stack.toLocaleString()}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </div>
        </main>
    );
}
