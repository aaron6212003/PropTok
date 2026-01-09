"use client";

import { useState, useEffect } from 'react';
import BottomNavBar from '@/components/layout/bottom-nav';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function TournamentsPage() {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [myEntries, setMyEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchTournaments = async () => {
            // Get Active Tournaments
            const { data: t } = await supabase.from('tournaments')
                .select('*')
                .eq('status', 'ACTIVE');

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Login required");
            return;
        }

        const { error } = await supabase.from('tournament_entries').insert({
            tournament_id: tId,
            user_id: user.id,
            current_stack: 500 // Hardcoded for MVP, should come from tournament.starting_stack
        });

        if (error) toast.error(error.message);
        else {
            toast.success("Joined Successfully!");
            window.location.reload();
        }
    };

    return (
        <main className="relative flex h-full w-full flex-col overflow-y-auto bg-black pb-32 text-white">
            <div className="p-6">
                <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
                <p className="mt-2 text-zinc-400">Compete for the highest bankroll.</p>
            </div>

            <div className="px-4 space-y-4">
                {loading && <div className="text-zinc-500">Loading events...</div>}

                {tournaments.map((t) => {
                    const entry = myEntries.find(e => e.tournament_id === t.id);
                    const isEntered = !!entry;

                    return (
                        <div key={t.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 h-32 w-32 bg-brand/20 blur-[60px]" />

                            <div className="relative p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                                        <Trophy size={14} />
                                        <span>$1,000 Prize Pool</span>
                                    </div>
                                    <span className="text-xs font-bold text-zinc-500">Ends in 2d</span>
                                </div>

                                <h3 className="mb-2 text-xl font-bold">{t.name}</h3>
                                <p className="mb-6 text-sm text-zinc-400 leading-relaxed">{t.description}</p>

                                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                    <div>
                                        <span className="block text-xs text-zinc-500">Entry Fee</span>
                                        <span className="font-mono text-lg font-bold text-white">${t.entry_fee}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-zinc-500">Starting Stack</span>
                                        <span className="font-mono text-lg font-bold text-white">${t.starting_stack}</span>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    {isEntered ? (
                                        <div className="space-y-3">
                                            <div className="flex w-full items-center justify-between rounded-xl bg-success/10 px-4 py-3 border border-success/20">
                                                <span className="text-sm font-bold text-success">Entered</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-zinc-400">Your Stack</span>
                                                    <span className="font-bold text-white">${entry.current_stack}</span>
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
                                            <span>Join Tournament</span>
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
        </main>
    );
}
