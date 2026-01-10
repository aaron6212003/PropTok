"use client";

import { useState, useEffect } from 'react';
import BottomNavBar from '@/components/layout/bottom-nav';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Trophy, Calendar, Users, ArrowRight, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function TournamentsPage() {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [myEntries, setMyEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<'featured' | 'community'>('featured');

    useEffect(() => {
        const fetchTournaments = async () => {
            // Get Active Tournaments with Owner Details
            const { data: t, error } = await supabase.from('tournaments')
                .select('*, owner:users(username, avatar_url)')
                .eq('status', 'ACTIVE');

            if (error) console.error("Error fetching tournaments:", error);

            // Get My Entries
            const { data: { user } } = await supabase.auth.getUser();
            if (user && t && t.length > 0) {
                const { data: e } = await supabase.from('tournament_entries')
                    .select('*')
                    .eq('user_id', user.id)
                    .in('tournament_id', t.map(x => x.id));
                setMyEntries(e || []);
            }

            setTournaments(t || []);
            setLoading(false);
        };
        fetchTournaments();
    }, []);

    const joinTournament = async (tId: string) => {
        // Optimistic check? No, let's wait for server for money ops
        setLoading(true); // Re-use loading state or add specific one

        // Dynamically import to avoid client-side clutter
        const { joinTournament } = await import('../actions');

        const res = await joinTournament(tId);

        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("Joined Successfully!", {
                description: "Entry fee deducted from cash balance."
            });
            window.location.reload();
        }
        setLoading(false);
    };

    const filteredTournaments = tournaments.filter(t => {
        if (activeTab === 'featured') return !t.owner_id; // System owned (NULL)
        return t.owner_id; // User owned
    });

    return (
        <main className="relative flex h-full w-full flex-col overflow-y-auto bg-black pb-32 text-white">
            <div className="p-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
                        {activeTab === 'featured' ? 'Official Events' : 'Community Hosted'}
                    </p>
                </div>
                {activeTab === 'community' && (
                    <a href="/tournaments/create" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform active:scale-90">
                        <Plus size={20} />
                    </a>
                )}
            </div>

            {/* Tabs */}
            <div className="px-6 mb-6 flex gap-4 border-b border-white/5 pb-1">
                <button
                    onClick={() => setActiveTab('featured')}
                    className={cn(
                        "pb-3 text-sm font-black uppercase tracking-widest transition-colors relative",
                        activeTab === 'featured' ? "text-brand" : "text-zinc-500 hover:text-white"
                    )}
                >
                    Featured
                    {activeTab === 'featured' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('community')}
                    className={cn(
                        "pb-3 text-sm font-black uppercase tracking-widest transition-colors relative",
                        activeTab === 'community' ? "text-brand" : "text-zinc-500 hover:text-white"
                    )}
                >
                    Community
                    {activeTab === 'community' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
                    )}
                </button>
            </div>

            <div className="px-4 space-y-4">
                {loading && <div className="text-zinc-500 px-2">Loading events...</div>}
                {!loading && filteredTournaments.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                        <p className="text-zinc-500 text-sm">No active tournaments found.</p>
                        {activeTab === 'community' && (
                            <a href="/tournaments/create" className="mt-4 inline-block text-xs font-bold text-brand uppercase tracking-widest hover:underline">
                                Create one now &rarr;
                            </a>
                        )}
                    </div>
                )}

                {filteredTournaments.map((t) => {
                    const entry = myEntries.find(e => e.tournament_id === t.id);
                    const isEntered = !!entry;

                    return (
                        <div key={t.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                            {/* Decorative Background */}
                            <div className={cn(
                                "absolute top-0 right-0 h-32 w-32 blur-[60px]",
                                activeTab === 'featured' ? "bg-brand/20" : "bg-purple-500/20"
                            )} />

                            <div className="relative p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className={cn(
                                        "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold",
                                        activeTab === 'featured' ? "bg-brand/10 text-brand" : "bg-purple-500/10 text-purple-400"
                                    )}>
                                        <Trophy size={14} />
                                        <span>${((t.collected_pool || 0) * 0.9).toLocaleString()} Prize Pool</span>
                                    </div>
                                    <span className="text-xs font-bold text-zinc-500">Ends in 2d</span>
                                </div>

                                <h3 className="mb-2 text-xl font-bold">{t.name}</h3>
                                {t.owner && (
                                    <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
                                        <span>Hosted by</span>
                                        <span className="font-bold text-white">@{t.owner.username || 'user'}</span>
                                    </div>
                                )}
                                <p className="mb-6 text-sm text-zinc-400 leading-relaxed line-clamp-2">{t.description}</p>

                                <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                                    <div className="text-center p-2 rounded-lg bg-white/5">
                                        <span className="block text-[10px] uppercase text-zinc-500">Buy-in</span>
                                        <span className="font-mono text-sm font-bold text-white">${t.entry_fee}</span>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-white/5">
                                        <span className="block text-[10px] uppercase text-zinc-500">Stack</span>
                                        <span className="font-mono text-sm font-bold text-white">{t.starting_stack}</span>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-white/5">
                                        <span className="block text-[10px] uppercase text-zinc-500">Players</span>
                                        <span className="font-mono text-sm font-bold text-white">
                                            {t.max_players ? `${t.max_players} Max` : 'UL'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    {isEntered ? (
                                        <div className="space-y-3">
                                            <div className="flex w-full items-center justify-between rounded-xl bg-success/10 px-4 py-3 border border-success/20">
                                                <span className="text-sm font-bold text-success">Entered</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-zinc-400">Your Stack</span>
                                                    <span className="font-bold text-white">{entry.current_stack}</span>
                                                </div>
                                            </div>
                                            <a href={`/tournaments/${t.id}`} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20">
                                                View Leaderboard
                                            </a>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => joinTournament(t.id)}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-black transition-transform active:scale-95"
                                        >
                                            <span>Join for ${t.entry_fee}</span>
                                            <ArrowRight size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <nav className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </nav>
        </main >
    );
}
