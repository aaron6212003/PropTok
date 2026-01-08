import Link from 'next/link';
import BottomNavBar from '@/components/layout/bottom-nav';
import { TrendingUp, Flame, Trophy, Settings, ChevronRight, LogOut, Coins, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserVotes } from '@/app/actions';
import AdminAccessButton from '@/components/profile/admin-access-button';

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

export default async function ProfilePage() {
    const supabase = await createClient(); // Wait for the promise
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch public profile
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    // Fetch betting history
    const votes = await getUserVotes();

    return (
        <main className="relative flex h-full w-full flex-col overflow-y-auto bg-black pb-24 text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <h1 className="text-xl font-bold uppercase tracking-widest">My Account</h1>
                <div className="flex gap-2">
                    <form action={async () => {
                        'use server';
                        const sb = await createClient(); // Wait for the promise
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
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand/20">
                        <Coins className="h-6 w-6 text-brand" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-brand/80">Available PropCash</span>
                    <h2 className="mt-1 text-5xl font-black tracking-tighter text-white">
                        ${(profile?.bankroll || 0).toLocaleString()}
                    </h2>
                    <div className="mt-4 flex gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Wins</span>
                            <span className="text-sm font-bold text-success">{profile?.wins || 0}</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Return</span>
                            <span className="text-sm font-bold text-brand">+--%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stat Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 px-6 md:grid-cols-4">
                <StatCard label="Win Rate" value={`${profile?.win_rate || 0}%`} icon={TrendingUp} colorClass="text-brand" />
                <StatCard label="Streak" value={profile?.streak || 0} icon={Flame} colorClass="text-destructive" />
            </div>

            <div className="px-6">
                <AdminAccessButton />
            </div>

            {/* Betting History */}
            <div className="mt-10 px-6">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Active & Past Bets</h3>
                    <span className="text-[10px] font-bold text-zinc-600">{votes.length} Total</span>
                </div>

                <div className="space-y-3">
                    {votes.map((vote: any) => {
                        const isResolved = vote.predictions?.resolved;
                        const isWin = isResolved && vote.side === vote.predictions?.outcome;
                        const isLoss = isResolved && !isWin;

                        return (
                            <div key={vote.id} className="group relative flex flex-col gap-3 rounded-2xl border border-white/5 bg-zinc-900/50 p-4 transition-all hover:bg-zinc-900">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        {new Date(vote.created_at).toLocaleDateString()}
                                    </span>
                                    {isResolved ? (
                                        isWin ? (
                                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-success">
                                                <CheckCircle2 size={12} /> WON
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-destructive">
                                                <XCircle size={12} /> LOST
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand">
                                            <Clock size={12} /> PENDING
                                        </div>
                                    )}
                                </div>
                                <h4 className="line-clamp-2 text-sm font-bold leading-snug">
                                    {vote.predictions?.question}
                                </h4>
                                <div className="flex items-center justify-between rounded-xl bg-black/40 p-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Wager</span>
                                        <span className="text-sm font-bold">${vote.wager} on {vote.side}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Payout</span>
                                        <span className={cn(
                                            "text-sm font-black",
                                            isWin ? "text-success" : isLoss ? "text-zinc-500 line-through" : "text-white"
                                        )}>
                                            ${(vote.wager * vote.payout_multiplier).toFixed(0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {votes.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                            <p className="text-sm font-medium text-zinc-500">No bets placed yet.</p>
                            <Link href="/" className="mt-4 inline-block text-xs font-black uppercase tracking-widest text-brand">Start Playing →</Link>
                        </div>
                    )}
                </div>
            </div>

            <nav className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </nav>
        </main>
    );
}
