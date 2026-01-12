
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import BetCard from '@/components/profile/bet-card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BottomNavBar from '@/components/layout/bottom-nav';

export default async function GamePage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { id } = params;

    // Fetch all predictions for this Game ID
    // external_id starts with "gameId-"
    const { data: predictions } = await supabase
        .from('predictions')
        .select('*')
        .ilike('external_id', `${id}-%`)
        .eq('resolved', false);

    if (!predictions || predictions.length === 0) {
        // Fallback: try direct ID match? No, URL uses gameId
        return notFound();
    }

    // Group by Market
    const gameLines = predictions.filter((p: any) => !p.question.includes('Score') && !p.question.includes('Rebounds') && !p.question.includes('Assists'));
    const props = predictions.filter((p: any) => !gameLines.includes(p));

    return (
        <main className="relative min-h-screen bg-black text-white pb-32">
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
                                    {/* Simple Yes/No Buttons (Mock reuse of logic needed) */}
                                    {/* Ideally we reuse a mini-card or just list lines */}
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-3 rounded-xl bg-white/5 font-black uppercase tracking-widest hover:bg-green-500/20 hover:text-green-500 transition-colors">
                                            Yes {p.yes_multiplier}x
                                        </button>
                                        <button className="flex-1 py-3 rounded-xl bg-white/5 font-black uppercase tracking-widest hover:bg-red-500/20 hover:text-red-500 transition-colors">
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
                                <div key={p.id} className="p-4 rounded-xl bg-zinc-900 border border-white/5">
                                    <div className="flex justify-between items-start gap-4">
                                        <p className="font-bold text-sm text-zinc-300">{p.question}</p>
                                        <div className="flex gap-1 shrink-0">
                                            <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-black">{p.yes_multiplier}x</span>
                                            <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-black">{p.no_multiplier}x</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <BottomNavBar />
        </main>
    );
}
