import { createClient } from '@/lib/supabase/server';
import BetCard from '@/components/profile/bet-card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BottomNavBar from '@/components/layout/bottom-nav';
import PropRow from '@/components/game/prop-row';

export const dynamic = 'force-dynamic';

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);

    let predictions: any[] = [];
    let gameId: string | null = null;
    let errorDebug = "";

    try {
        // 1. Try generic search first (matches GameID or legacy)
        // BUGFIX: Use `${id}%` to allow exact matches or different separators (underscores etc)
        let { data, error } = await supabase
            .from('predictions')
            .select('*')
            .ilike('external_id', `${id}%`)
            .eq('resolved', false);

        if (data && data.length > 0) {
            predictions = data;
        } else {
            // 2. Try UUID lookup
            const { data: specific, error: uuidError } = await supabase
                .from('predictions')
                .select('external_id')
                .eq('id', id)
                .single();

            if (specific?.external_id) {
                const parts = specific.external_id.split('-');
                gameId = parts[0];
                const { data: cousins } = await supabase
                    .from('predictions')
                    .select('*')
                    .ilike('external_id', `${gameId}%`); // Relaxed here too
                predictions = cousins || [];
            } else {
                errorDebug = `UUID Lookup failed. ID not found in DB.`;
            }
        }
    } catch (e) {
        errorDebug = JSON.stringify(e);
    }

    // IF NOTHING FOUND: Show DEBUG Dashboard (Instead of 404)
    if (!predictions || predictions.length === 0) {
        // Fetch ANY 5 valid games to show the user
        const { data: recentGames } = await supabase
            .from('predictions')
            .select('external_id, question')
            .limit(20);

        // Extract unique game IDs from recent bets
        const uniqueGameIds = Array.from(new Set(recentGames?.map(p => p.external_id?.split('-')[0]) || [])).slice(0, 5);

        return (
            <main className="min-h-screen bg-black text-white p-6 pt-24 font-mono">
                <BottomNavBar />
                <Link href="/" className="mb-4 inline-block text-brand">← Back to Feed</Link>
                <h1 className="text-2xl font-bold text-red-500 mb-4">⚠️ Game Not Found</h1>

                <div className="bg-zinc-900 p-4 rounded-xl border border-red-500/20 mb-8 text-left">
                    <p className="text-zinc-400 mb-2">We couldn't find bets for ID:</p>
                    <p className="bg-white/10 p-2 rounded text-white font-mono mb-4 break-all">{id || "UNDEFINED"}</p>
                    <p className="text-zinc-500 text-xs">{errorDebug}</p>
                </div>

                <h2 className="text-lg font-bold text-white mb-4">Try These Active Games:</h2>
                <div className="space-y-2">
                    {uniqueGameIds.map(gid => (
                        <Link key={gid} href={`/game/${gid}`} className="block p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700">
                            Game ID: <span className="text-brand">{gid}</span>
                        </Link>
                    ))}
                </div>
            </main>
        );
    }

    // NORMAL RENDER
    const gameLines = predictions.filter((p: any) =>
        !p.question.includes('Score') &&
        !p.question.includes('Rebounds') &&
        !p.question.includes('Assists') &&
        !p.question.includes('Touchdowns') &&
        !p.question.includes('Yards')
    );
    const props = predictions.filter((p: any) => !gameLines.includes(p));

    return (
        <main className="relative min-h-screen bg-black text-white pb-48">
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center p-4 bg-black/80 backdrop-blur-md border-b border-white/5">
                <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-white/10">
                    <ArrowLeft className="text-white" />
                </Link>
                <h1 className="ml-2 text-lg font-black uppercase tracking-widest">Game Markets</h1>
            </div>

            <div className="p-6 pt-24 space-y-8">
                {/* Game Lines Section */}
                {gameLines.length > 0 && (
                    <section>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-brand mb-4">Game Lines</h2>
                        <div className="grid gap-4">
                            {gameLines.map((p: any) => (
                                <div key={p.id} className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
                                    <h3 className="font-bold text-lg leading-tight mb-4">{p.question}</h3>
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-3 rounded-xl bg-white/5 font-black uppercase tracking-widest text-[#00DC82] border border-[#00DC82]/20 hover:bg-[#00DC82]/10 transition-colors">
                                            Yes {p.yes_multiplier}x
                                        </button>
                                        <button className="flex-1 py-3 rounded-xl bg-white/5 font-black uppercase tracking-widest text-red-500 border border-red-500/20 hover:bg-red-500/10 transition-colors">
                                            No {p.no_multiplier}x
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Player Props Section */}
                <section>
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-brand mb-4">Player Props</h2>
                    {props.length === 0 ? (
                        <p className="text-zinc-500 italic">No player props available.</p>
                    ) : (
                        <div className="grid gap-4">
                            {props.map((p: any) => (
                                <PropRow
                                    key={p.id}
                                    id={p.id}
                                    question={p.question}
                                    yesMultiplier={p.yes_multiplier}
                                    noMultiplier={p.no_multiplier}
                                    yesPercent={p.yes_percent || 50}
                                    category={p.category}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <BottomNavBar />
        </main>
    );
}
