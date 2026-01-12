import Link from 'next/link';
import BottomNavBar from '@/components/layout/bottom-nav';

export const dynamic = 'force-dynamic';
import { TrendingUp, Flame, Trophy, Settings, ChevronRight, LogOut, Coins, Clock, CheckCircle2, XCircle, Camera, Edit2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserVotes, getUserBundles, getUserTournamentEntries, updateProfile } from '@/app/actions';
import AdminAccessButton from '@/components/profile/admin-access-button';
import HistoryList from '@/components/profile/history-list';
import ResolutionRecap from '@/components/social/resolution-recap';
import WalletToggle from '@/components/layout/wallet-toggle';
import ProfileEditor from '@/components/profile/profile-editor';

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tournament?: string, deposit_success?: string }> }) {
    const { tournament: tournamentId, deposit_success } = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch data in parallel
    const [profileRes, votes, bundles, entriesRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        getUserVotes(50),
        getUserBundles(50),
        getUserTournamentEntries()
    ]);

    const profile = profileRes.data;
    const tournamentEntries = entriesRes;

    // Determine Active Stats (Cash vs. Tournament)
    let stats = {
        win_rate: Number(profile?.win_rate || 0),
        streak: Number(profile?.streak || 0),
        total_wins: Number(profile?.total_wins || 0), // Use new col or fallback
        total_bets: Number(profile?.total_bets || 0), // (profile.wins * 100 / profile.win_rate) approx if missing
        label: "Career Stats"
    };

    // Quick fallback calculation for legacy profile data if new cols are 0
    if (stats.total_bets === 0 && profile?.total_bets) stats.total_bets = profile.total_bets;
    if (stats.total_wins === 0 && profile?.wins) stats.total_wins = profile.wins; // Legacy column name 'wins'

    let tournamentStack = null;

    if (tournamentId) {
        const { data: entry } = await supabase
            .from("tournament_entries")
            .select("*")
            .eq("tournament_id", tournamentId)
            .eq("user_id", user.id)
            .single();

        if (entry) {
            tournamentStack = entry.current_stack;
            // Switch to Tournament Stats
            stats = {
                win_rate: Number(entry.win_rate || 0),
                streak: Number(entry.streak || 0), // Use entry streak
                total_wins: Number(entry.total_wins || 0),
                total_bets: Number(entry.total_bets || 0),
                label: "Tournament Stats"
            };
        }
    }

    const activeBankroll = tournamentId ? (tournamentStack || 0) : (profile?.cash_balance || 0);

    // Fetch UNSEEN results for the recap
    const unseenVotes = await getUserVotes(50, true);
    const unseenBundles = await getUserBundles(50, true);

    const resolvedUnseen = [
        ...unseenVotes.filter(v => v.predictions?.resolved).map(v => ({
            id: v.id,
            wager: v.wager,
            multiplier: v.payout_multiplier,
            question: v.predictions.question,
            won: v.side === v.predictions.outcome,
            isBundle: false
        })),
        ...unseenBundles.filter(b => b.status !== 'PENDING').map(b => ({
            id: b.id,
            wager: b.wager,
            multiplier: b.total_multiplier,
            question: `${b.legs?.length}-Leg Parlay`,
            won: b.status === 'WON',
            isBundle: true
        }))
    ].sort((a, b) => b.wager - a.wager); // Show biggest bets first in recap

    // Combine and sort history
    const history = [
        ...votes.map(v => ({ ...v, isBundle: false })),
        ...bundles.map(b => ({ ...b, isBundle: true }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <main className="relative flex h-full w-full flex-col overflow-y-auto bg-black pb-24 text-white">
            <ResolutionRecap results={resolvedUnseen} />

            {deposit_success === 'true' && (
                <div className="mx-6 mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500 rounded-full p-1">
                            <CheckCircle2 size={16} className="text-black" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">Deposit Successful!</p>
                            <p className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-wider">Your balance has been updated.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <h1 className="text-xl font-bold uppercase tracking-widest">My Account</h1>
                <div className="flex gap-2">
                    <form action={async () => {
                        'use server';
                        const sb = await createClient();
                        await sb.auth.signOut();
                        redirect('/login');
                    }}>
                        <button type="submit" className="rounded-full bg-white/5 p-2 text-destructive backdrop-blur-md transition-colors hover:bg-white/10">
                            <LogOut size={20} />
                        </button>
                    </form>
                    <Link href="/settings" className="rounded-full bg-white/5 p-2 text-zinc-400 backdrop-blur-md transition-colors hover:text-white">
                        <Settings size={20} />
                    </Link>
                </div>
            </div>

            {/* Editable Profile Header */}
            <ProfileEditor
                userId={user.id}
                initialUsername={profile?.username || user.email?.split('@')[0]}
                initialAvatarUrl={profile?.avatar_url}
                memberSince={new Date(user.created_at).getFullYear()}
            />

            {/* Bankroll Highlights */}
            <div className="mt-6 px-6">
                <div className="flex flex-col items-center rounded-3xl border border-brand/20 bg-brand/5 p-8 text-center backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(37,99,235,0.1)]">
                    <div className="mb-4">
                        <WalletToggle
                            cash={profile?.cash_balance || 0}
                            chips={0}
                        />
                    </div>
                    <Link href="/wallet" className="group relative">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 transition-colors group-hover:text-emerald-400">
                            {tournamentId ? "Tournament Stack" : "Real Cash Balance"}
                        </span>
                        <h2 className="mt-1 text-5xl font-black tracking-tighter text-white transition-transform group-active:scale-95">
                            ${activeBankroll.toLocaleString()}
                        </h2>
                        {!tournamentId && (
                            <div className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 transition-all group-hover:block group-hover:translate-x-2 group-hover:opacity-100">
                                <ChevronRight className="text-emerald-500" />
                            </div>
                        )}
                    </Link>

                    {/* Deposit CTA */}
                    {!tournamentId && (
                        <div className="mt-6 w-full">
                            <Link href="/wallet" className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#00DC82] py-3 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-[#00DC82]/20 transition-transform active:scale-95 hover:brightness-110">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/10 p-1">
                                    <TrendingUp size={14} />
                                </span>
                                Deposit Funds
                            </Link>
                        </div>
                    )}

                    <div className="mt-4 flex gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Wins</span>
                            <span className="text-sm font-bold text-success">{stats.total_wins}</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Bets</span>
                            <span className="text-sm font-bold text-brand">{stats.total_bets}</span>
                        </div>
                    </div>
                    <div className="mt-2 text-[10px] uppercase text-zinc-600 tracking-wider">
                        ({stats.label})
                    </div>
                </div>
            </div>



            <div className="px-6">
                <AdminAccessButton />

            </div>

            {/* Betting History */}
            <div className="mt-10 px-6">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Active & Past Bets</h3>
                    <span className="text-[10px] font-bold text-zinc-600">{history.length} Recent</span>
                </div>

                <HistoryList history={history} />
            </div>
            <nav className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </nav>
        </main>
    );
}
