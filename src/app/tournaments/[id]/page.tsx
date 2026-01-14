import { getTournament, getTournamentLeaderboard, verifyTournamentPayment } from "@/app/actions";
import BottomNavBar from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";
import { Trophy, Clock, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import LiveLeaderboard from "@/components/tournament/live-leaderboard";
import JoinButton from "@/components/tournament/join-button";
import BetSlip from "@/components/feed/bet-slip";
import SettleButton from "@/components/tournament/settle-button";

export const dynamic = 'force-dynamic';

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

    // Check User Entry & Balance
    let myEntry = null;
    let myRank = 0;
    let userBalance = 0;

    if (currentUser) {
        // USE ADMIN CLIENT TO BYPASS RLS
        const adminClient = createAdminClient();
        if (adminClient) {
            const { data: entries } = await adminClient
                .from("tournament_entries")
                .select("current_stack, rank")
                .eq("user_id", currentUser.id)
                .eq("tournament_id", id)
                .limit(1);

            const entry = entries && entries.length > 0 ? entries[0] : null;

            myEntry = entry;
            if (entry) myRank = entry.rank;

            console.log(`[TournamentPage] Admin Check: User ${currentUser.id} -> Found? ${!!entry}`);
        }

        // Fetch Balance (Client is fine for this as checking own data usually works, but consistency is key)
        const { data: profile } = await supabase.from("users").select("cash_balance").eq("id", currentUser.id).single();
        userBalance = profile?.cash_balance || 0;
    }

    return (
        <main className="flex h-[100dvh] w-full flex-col bg-black text-white overflow-hidden">
            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto pb-32 scrollbar-none">
                {/* Header & Stats Dashboard */}
                <div className="relative border-b border-white/10 bg-zinc-900/50 pb-8 pt-6">
                    <div className="absolute inset-0 bg-brand/5 blur-3xl pointer-events-none" />

                    <div className="px-6 relative z-10">
                        <Link href="/tournaments" className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                            <ArrowLeft size={16} />
                            Back
                        </Link>

                        <div className="mb-6">
                            <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2">
                                {tournament.name}
                            </h1>
                            <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
                                {tournament.description}
                            </p>
                        </div>

                        {/* KPIS Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {/* 1. Prize Pool */}
                            <div className="flex flex-col gap-1 rounded-2xl bg-white/5 p-3 border border-white/10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prize Pool</span>
                                <span className="text-xl font-black text-brand text-glow">
                                    ${((tournament.entry_fee_cents || 0) * leaderboard.length / 100).toLocaleString()}
                                </span>
                            </div>

                            {/* 2. Players */}
                            <div className="flex flex-col gap-1 rounded-2xl bg-white/5 p-3 border border-white/10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Entrants</span>
                                <div className="flex items-center gap-1">
                                    <Users size={14} className="text-zinc-400" />
                                    <span className="text-xl font-bold text-white">{leaderboard.length}</span>
                                </div>
                            </div>

                            {/* 3. Status/Entry */}
                            <div className="flex flex-col gap-1 rounded-2xl bg-white/5 p-3 border border-white/10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Entry</span>
                                <span className="text-xl font-bold text-white">
                                    {(tournament.entry_fee_cents || 0) > 0
                                        ? `$${((tournament.entry_fee_cents || 0) / 100).toFixed(0)}`
                                        : 'Free'}
                                </span>
                            </div>
                        </div>

                        {/* Action Area */}
                        {myEntry ? (
                            <div className="flex flex-col gap-4 p-4 rounded-3xl bg-gradient-to-br from-brand/10 to-transparent border border-brand/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="block text-[10px] font-black uppercase tracking-widest text-brand">Your Status</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-white">#{myRank}</span>
                                            <span className="text-xs font-bold text-zinc-500">of {leaderboard.length}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Chip Stack</span>
                                        <span className="text-2xl font-black text-white">${myEntry.current_stack.toLocaleString()}</span>
                                    </div>
                                </div>

                                {tournament.status !== 'COMPLETED' ? (
                                    <Link
                                        href={`/?tournament=${id}`}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-brand text-black font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 active:scale-[0.98] transition-all hover:brightness-110"
                                    >
                                        Place Bets
                                    </Link>
                                ) : (
                                    <div className="w-full py-3 bg-zinc-800 text-zinc-500 font-bold uppercase tracking-widest text-center rounded-xl">
                                        Tournament Ended
                                    </div>
                                )}

                                {tournament.owner_id === currentUser?.id && tournament.status !== 'COMPLETED' && (
                                    <SettleButton tournamentId={id} />
                                )}
                            </div>
                        ) : (
                            <div className="glass rounded-3xl p-4 border-white/10">
                                {/* Success Handler */}
                                {searchParamsObj.success === 'true' ? (
                                    <div className="w-full py-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold uppercase tracking-widest rounded-2xl text-center animate-pulse flex flex-col items-center justify-center gap-2">
                                        <span>Payment Successful</span>
                                        <span className="text-[10px] text-zinc-400 normal-case bg-black/40 px-3 py-1 rounded-full">
                                            Creating your entry...
                                        </span>
                                    </div>
                                ) : (
                                    <div className="pt-2">
                                        {/* Entry CTA */}
                                        <div className="mb-4 text-center">
                                            <span className="text-xs font-bold text-zinc-400">Join the competition</span>
                                        </div>
                                        {tournament.entry_fee_cents && tournament.entry_fee_cents > 0 ? (
                                            <JoinButton
                                                tournamentId={id}
                                                entryFeeCents={Math.round(tournament.entry_fee_cents)}
                                                isLoggedIn={!!currentUser}
                                                userBalance={userBalance}
                                            />
                                        ) : (
                                            <button className="w-full py-4 bg-white/10 text-zinc-500 font-bold uppercase tracking-widest rounded-xl cursor-not-allowed">
                                                Free Entry (Coming Soon)
                                            </button>
                                        )}
                                    </div>
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

            <BetSlip cashBalance={userBalance} />
        </main>
    );
}
