
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BottomNavBar from '@/components/layout/bottom-nav';
import PropRow from '@/components/game/prop-row';

export const dynamic = 'force-dynamic';

export default async function PlayerPage({ params }: { params: Promise<{ name: string }> }) {
    const supabase = await createClient();
    const { name: rawName } = await params;
    const playerName = decodeURIComponent(rawName).replace(/-/g, ' ');

    // Fetch props for this player. 
    // We search the 'question' column for the player name (simple partial match).
    // Or we could try to use the external_id if we have a strict naming convention.
    // Given the variability, ILIKE on question is safest for now.

    // Also ensuring we only get ACTIVE/UNRESOLVED props
    const { data: props } = await supabase
        .from('predictions')
        .select('*')
        .ilike('question', `%${playerName}%`)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

    return (
        <main className="relative min-h-screen bg-black text-white pb-32">
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center p-4 bg-black/80 backdrop-blur-md border-b border-white/5">
                <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-white/10">
                    <ArrowLeft className="text-white" />
                </Link>
                <div className="ml-2">
                    <h1 className="text-lg font-black uppercase tracking-widest leading-none">{playerName}</h1>
                    <p className="text-xs text-zinc-400 font-mono">Player Markets</p>
                </div>
            </div>

            <div className="p-6 pt-24 space-y-8">
                {(!props || props.length === 0) ? (
                    <div className="text-center py-10 text-zinc-500">
                        <p>No active props found for {playerName}.</p>
                    </div>
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
            </div>

            <BottomNavBar />
        </main>
    );
}
