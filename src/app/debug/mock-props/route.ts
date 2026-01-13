
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "Admin client missing" }, { status: 500 });

    // 1. Get recent active games (Game Lines)
    const { data: games } = await supabase
        .from('predictions')
        .select('*')
        .ilike('external_id', '%-h2h-%') // Find base game lines
        .eq('resolved', false)
        .limit(10);

    if (!games || games.length === 0) {
        return NextResponse.json({ message: "No active games found to attach props to." });
    }

    const newProps = [];
    const mockPlayers = ["LeBron James", "Stephen Curry", "Luka Doncic", "Nikola Jokic", "Giannis Antetokounmpo", "Jayson Tatum", "Kevin Durant", "Joel Embiid"];

    for (const game of games) {
        // Extract Game ID part: "c37a...-h2h-..."
        const gameId = game.external_id.split('-')[0];
        const category = game.category || 'NBA';

        // Generate 3-5 props per game
        for (let i = 0; i < 5; i++) {
            const player = mockPlayers[Math.floor(Math.random() * mockPlayers.length)];
            const stat = Math.random() > 0.5 ? "Points" : "Assists";
            const line = stat === "Points" ? (20 + Math.floor(Math.random() * 15)) + 0.5 : (4 + Math.floor(Math.random() * 8)) + 0.5;

            // "LeBron James Over 25.5 Points"
            const question = `${player} Over ${line} ${stat}`;
            const externalId = `${gameId}-player_${stat.toLowerCase()}-${player.replace(/ /g, '-')}-Over-${line}`;

            // Check duplicate
            const { data: existing } = await supabase.from('predictions').select('id').eq('external_id', externalId).single();
            if (existing) continue;

            newProps.push({
                question,
                category,
                external_id: externalId,
                game_id: gameId, // Attach to the game!
                yes_multiplier: 1.85 + (Math.random() * 0.3),
                no_multiplier: 1.85 + (Math.random() * 0.3),
                resolved: false,
                expires_at: game.expires_at,
                created_at: new Date().toISOString(),
                yes_percent: 50,
                volume: 0,
                odds_source: 'Mock Data'
            });
        }
    }

    if (newProps.length > 0) {
        const { error } = await supabase.from('predictions').insert(newProps);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: `Generated ${newProps.length} mock player props across ${games.length} games.`,
        games: games.map(g => g.external_id)
    });
}
