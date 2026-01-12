
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import BetCard from '@/components/profile/bet-card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BottomNavBar from '@/components/layout/bottom-nav';

export const dynamic = 'force-dynamic';

export default async function GamePage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { id } = params;

    console.log(`[GamePage] Loading for ID: ${id}`);

    let predictions: any[] = [];
    let gameId: string | null = null;

    // STRATEGY 1: Treat 'id' as a specific UUID (Prediction ID)
    // This is the new default since we changed the card link.
    const { data: specificPrediction, error: uuidError } = await supabase
        .from('predictions')
        .select('external_id, question')
        .eq('id', id)
        .single();

    if (specificPrediction && specificPrediction.external_id) {
        console.log(`[GamePage] Found specific prediction: ${specificPrediction.question}`);
        // Extract generic Game ID. Format usually: "gameId-market-..."
        const tokens = specificPrediction.external_id.split('-');
        gameId = tokens[0];
        console.log(`[GamePage] Derived Game ID: ${gameId}`);
    }

    // STRATEGY 2: If finding by UUID failed, maybe 'id' *is* the Game ID?
    if (!gameId) {
        console.log(`[GamePage] UUID lookup failed or no external_id. Trying '${id}' as GameID directly.`);
        gameId = id;
    }

    // FETCH SIBLINGS: Get all predictions for this Game ID
    if (gameId) {
        const { data: allProps, error: siblingsError } = await supabase
            .from('predictions')
            .select('*')
            .ilike('external_id', `${gameId}-%`)
            .eq('resolved', false)
            .order('yes_multiplier', { ascending: true }); // sort interesting ones first?

        if (allProps && allProps.length > 0) {
            predictions = allProps;
        } else {
            console.error(`[GamePage] No siblings found for GameID: ${gameId}`, siblingsError);
        }
    }

    if (!predictions || predictions.length === 0) {
        console.error(`[GamePage] 404 - No predictions found for ID: ${id}`);
        return notFound();
    }

    // Group by Market for UI
    // "Game Lines" are usually generic win/loss or spreads without player names
    const gameLines = predictions.filter((p: any) =>
        !p.question.includes('Score') &&
        !p.question.includes('Rebounds') &&
        !p.question.includes('Assists') &&
        !p.question.includes('Touchdowns') &&
        !p.question.includes('Yards')
    );
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
                                <div key={p.id} className="p-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                        <p className="font-bold text-sm text-zinc-300">{p.question}</p>
                                        <div className="flex gap-2 shrink-0">
                                            <span className="px-3 py-1.5 rounded-lg bg-[#00DC82]/10 text-[#00DC82] text-xs font-black border border-[#00DC82]/20">YES {p.yes_multiplier}x</span>
                                            <span className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-black border border-red-500/20">NO {p.no_multiplier}x</span>
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
