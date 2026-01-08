import Link from 'next/link';
import BottomNavBar from '@/components/layout/bottom-nav';
import { TrendingUp, Flame, Trophy, Settings, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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

    return (
        <main className="relative flex h-full w-full flex-col overflow-y-auto bg-black pb-24 text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <h1 className="text-xl font-bold">Profile</h1>
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
                <h2 className="mt-4 text-2xl font-bold">{profile?.username || user.email?.split('@')[0]}</h2>
                <p className="text-sm text-zinc-500">Joined {new Date(user.created_at).toLocaleDateString()}</p>
            </div>

            {/* Main Stats Grid */}
            <div className="mt-8 grid grid-cols-2 gap-4 px-6">
                <StatCard
                    label="Win Rate"
                    value={`${profile?.win_rate || 0}% `}
                    icon={TrendingUp}
                    colorClass="text-brand"
                />
                <StatCard
                    label="Current Streak"
                    value={profile?.streak || 0}
                    icon={Flame}
                    colorClass="text-destructive"
                />
                <StatCard
                    label="Best Streak"
                    value={profile?.best_streak || 0}
                    icon={Trophy}
                    colorClass="text-yellow-500"
                />
                <StatCard
                    label="Total Rank"
                    value="-"
                    icon={TrendingUp}
                    colorClass="text-success"
                />
            </div>

            {/* Recent Activity / Categories */}
            <div className="mt-8 px-6">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">Your Categories</h3>
                <div className="space-y-3">
                    {['Sports', 'Crypto', 'Politics'].map((cat) => (
                        <div key={cat} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-brand" />
                                <span className="font-medium">{cat}</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-400">
                                <span className="text-sm">-</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <nav className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </nav>
        </main>
    );
}
