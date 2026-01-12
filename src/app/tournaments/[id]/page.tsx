import { getTournament, getTournamentLeaderboard, verifyTournamentPayment } from "@/app/actions";
import BottomNavBar from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";
import { Trophy, Clock, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LiveLeaderboard from "@/components/tournament/live-leaderboard";
import JoinButton from "@/components/tournament/join-button";
import BetSlip from "@/components/feed/bet-slip";
import SettleButton from "@/components/tournament/settle-button";

export default async function TournamentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ success?: string; session_id?: string }> }) {
    const { id } = await params;
    const searchParamsObj = await searchParams;

    // Passive Verification (Auto-Fix if Webhook missed)
    if (searchParamsObj.session_id) {
        await verifyTournamentPayment(searchParamsObj.session_id);
    }

    // Fetch Data
    const tournament = await getTournament(id);
    const leaderboard = await getTournamentLeaderboard(id);
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!tournament) return <div className="p-10 text-center text-white">Tournament not found</div>;

    let cashBalance = 0;
    if (currentUser) {
        const { data: profile } = await supabase.from("users").select("cash_balance").eq("id", currentUser.id).single();
        cashBalance = profile?.cash_balance || 0;
    }

    const myEntry = leaderboard.find(e => e.user_id === currentUser?.id);
    const myRank = myEntry ? leaderboard.indexOf(myEntry) + 1 : null;

    return (
        <main className="flex h-[100dvh] w-full flex-col bg-black text-white overflow-hidden">
            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto pb-32 scrollbar-none">
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
                                    <span className={cn(
                                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                                        tournament.status === 'COMPLETED' ? "bg-zinc-800 text-zinc-500" : "bg-brand/10 text-brand"
                                    )}>
                                        <Trophy size={10} />
                                        {tournament.status === 'COMPLETED' ? 'Settled' : 'Active'}
                                    </span>
                                    <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        <Users size={10} />
                                        {leaderboard.length} Players
                                    </span>
                                    {tournament.entry_fee_cents && tournament.entry_fee_cents > 0 && (
                                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                            Entry: ${(tournament.entry_fee_cents / 100).toFixed(2)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-purple-400">
                                        Payout: {
                                            (() => {
                                                try {
                                                    const structure = typeof tournament.payout_structure === 'string'
                                                        ? JSON.parse(tournament.payout_structure)
                                                        : tournament.payout_structure;
                                                    return Object.entries(structure || {})
                                                        .sort(([a], [b]) => Number(a) - Number(b))
                                                        .map(([_, val]) => `${val}%`)
                                                        .join(" / ");
                                                } catch (e) {
                                                    return "Top Heavy";
                                                }
                                            })()
                                        }
                                    </span>
                                    {tournament.allowed_leagues && tournament.allowed_leagues.length > 0 && (
                                        <span className="flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                            {tournament.allowed_leagues.join(", ")} Only
                                        </span>
                                    )}
                                    {tournament.allowed_game_ids && tournament.allowed_game_ids.length > 0 && (
                                        <span className="flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-orange-400">
                                            Matchup Restricted
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl font-black italic tracking-tighter text-white">
                                    {tournament.name}
                                </h1>
                                <p className="mt-2 max-w-md text-sm text-zinc-400">
                                    {tournament.description}
                                </p>
                            </div>
                        </div>

                        {/* My Stats or Join CTA */}
                        {myEntry ? (
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

                                {tournament.status !== 'COMPLETED' && (
                                    <Link
                                        href={`/?tournament=${id}`}
                                        className="w-full py-4 bg-brand text-black font-black uppercase tracking-widest text-center rounded-xl shadow-lg shadow-brand/20 active:scale-[0.98] transition-all"
                                    >
                                        Bet Now
                                    </Link>
                                )}

                                {tournament.status === 'COMPLETED' && (
                                    <div className="w-full py-4 bg-zinc-900 border border-white/5 text-zinc-500 font-black uppercase tracking-widest text-center rounded-xl">
                                        Tournament Closed
                                    </div>
                                )}

                                {/* Owner Controls */}
                                {tournament.owner_id === currentUser?.id && tournament.status !== 'COMPLETED' && (
                                    <div className="mt-2">
                                        <SettleButton tournamentId={id} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-6">
                                {/* Success Handler from Stripe Redirect */}
                                {searchParamsObj.success === 'true' ? (
                                    <div className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold uppercase tracking-widest rounded-xl text-center animate-pulse">
                                        Processing Entry...
                                        <span className="block text-[10px] text-zinc-500 normal-case mt-1">
                                            Your payment was successful. We are confirming with the bank. Refresh in 10s.
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Only show Pay Button if there is a fee */}
                                        {tournament.entry_fee_cents && tournament.entry_fee_cents > 0 ? (
                                            <JoinButton
                                                tournamentId={tournament.id}
                                                entryFeeCents={tournament.entry_fee_cents}
                                                isLoggedIn={!!currentUser}
                                            />
                                        ) : (
                                            <button className="w-full py-4 bg-white/10 text-zinc-500 font-bold uppercase tracking-widest rounded-xl cursor-not-allowed">
                                                Free Entry (Coming Soon)
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Leaderboard List */}
                <div className="px-4 py-6">
                    <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500 px-2">Live Standings</h2>

                    <LiveLeaderboard
                        tournamentId={id}
                        initialData={leaderboard}
                        currentUserId={currentUser?.id}
                    />
                </div>
            </div>

            {/* Bottom Gradient Fade */}
            <div className="fixed bottom-[64px] left-0 right-0 h-12 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />

            <div className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </div>

            <BetSlip cashBalance={cashBalance} />
        </main>
    );
}
