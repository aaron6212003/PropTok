import Link from 'next/link';
import BottomNavBar from '@/components/layout/bottom-nav';

export const dynamic = 'force-dynamic';
import { TrendingUp, Flame, Trophy, Settings, ChevronRight, LogOut, Coins, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserVotes, getUserBundles, getUserTournamentEntries } from '@/app/actions';
import AdminAccessButton from '@/components/profile/admin-access-button';
import HistoryList from '@/components/profile/history-list';
import ResolutionRecap from '@/components/social/resolution-recap';
import WalletToggle from '@/components/layout/wallet-toggle';

function StatCard({
    label,
    value,
    icon: Icon,
    colorClass
}: {
    label: string,
    value: string | number,
    icon: any,
    colorClass: string
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
            <div className={cn("mb-2 rounded-full p-2 bg-opacity-20", colorClass.replace('text-', 'bg-'))}>
                <Icon className={cn("h-6 w-6", colorClass)} />
            </div>
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
        </div>
    );
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tournament?: string }> }) {
    const { tournament: tournamentId } = await searchParams;
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

    const activeBankroll = tournamentId ? (tournamentStack || 0) : (profile?.bankroll || 0);

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

            {/* Avatar & Info */}
            <div className="mt-4 flex flex-col items-center">
                <div className="relative h-24 w-24 rounded-full border-2 border-brand bg-zinc-900 p-1">
                    {profile?.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt="Avatar"
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950" />
                    )}

                    <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-lg">
                        #?
                    </div>
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight lowercase">@{profile?.username || user.email?.split('@')[0]}</h2>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Member since {new Date(user.created_at).getFullYear()}</p>
            </div>

            {/* Bankroll Highlights */}
            <div className="mt-6 px-6">
                <div className="flex flex-col items-center rounded-3xl border border-brand/20 bg-brand/5 p-8 text-center backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(37,99,235,0.1)]">
                    <div className="mb-4">
                        <WalletToggle
                            bankroll={profile?.bankroll || 0}
                            entries={tournamentEntries}
                            activeTournamentId={tournamentId || null}
                        />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-brand/80">
                        {tournamentId ? "Tournament Stack" : "Available PropCash"}
                    </span>
                    <h2 className="mt-1 text-5xl font-black tracking-tighter text-white">
                        ${activeBankroll.toLocaleString()}
                    </h2>
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

            {/* Stat Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 px-6 md:grid-cols-4">
                <StatCard label="Win Rate" value={`${stats.win_rate.toFixed(1)}%`} icon={TrendingUp} colorClass="text-brand" />
                <StatCard label="Streak" value={stats.streak} icon={Flame} colorClass="text-destructive" />
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
