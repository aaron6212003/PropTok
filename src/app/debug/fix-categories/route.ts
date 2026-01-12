
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "Admin client missing" }, { status: 500 });

    const NFL_PLAYERS = [
        'CJ Stroud', 'Joe Mixon', 'Stefon Diggs', 'Russell Wilson',
        'Najee Harris', 'George Pickens', 'Tank Dell', 'TJ Watt',
        'Patrick Mahomes', 'Lamar Jackson', 'Josh Allen'
    ];

    let updatedCount = 0;
    const logs: string[] = [];

    for (const player of NFL_PLAYERS) {
        // Update all predictions containing this player name to category = 'NFL'
        const { error, count } = await supabase
            .from('predictions')
            .update({ category: 'NFL' })
            .ilike('question', `%${player}%`)
            .eq('category', 'NBA'); // Only fix if wrongly labeled as NBA

        if (!error && count !== null) {
            updatedCount += count;
            if (count > 0) logs.push(`Fixed ${count} rows for ${player}`);
        }
    }

    return NextResponse.json({
        success: true,
        updated: updatedCount,
        logs
    });
}
