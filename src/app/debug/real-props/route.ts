
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "Admin client missing" }, { status: 500 });

    const logs: string[] = [];

    // REAL PROP DATA (Jan 11, 2026)
    // Source: SportsGrid, Covers, CBS Sports
    const realProps = [
        { team: "Bucks", player: "Giannis Antetokounmpo", stat: "Points", line: 29.5, type: "Over" },
        { team: "Warriors", player: "Stephen Curry", stat: "Threes", line: 4.5, type: "Over" },
        { team: "Heat", player: "Bam Adebayo", stat: "Rebounds", line: 8.5, type: "Over" },
        { team: "76ers", player: "Tyrese Maxey", stat: "Points", line: 27.5, type: "Over" },
        { team: "Bucks", player: "Bobby Portis", stat: "Pts+Reb+Ast", line: 19.5, type: "Over" },
        { team: "Knicks", player: "Mitchell Robinson", stat: "Assists", line: 0.5, type: "Over" },
        { team: "Hawks", player: "Onyeka Okongwu", stat: "Points", line: 14.5, type: "Over" },
        { team: "Spurs", player: "Keldon Johnson", stat: "Points", line: 12.5, type: "Over" },
        { team: "Suns", player: "Dillon Brooks", stat: "Rebounds", line: 3.5, type: "Over" },
        { team: "Wolves", player: "Jaden McDaniels", stat: "Points", line: 14.5, type: "Under" },
        { team: "Grizzlies", player: "Desmond Bane", stat: "Threes", line: 1.5, type: "Under" },
        { team: "Raptors", player: "Scottie Barnes", stat: "Assists", line: 5.5, type: "Under" }
    ];

    let insertedCount = 0;

    for (const prop of realProps) {
        // 1. Find the Game ID for this team
        // Use ILIKE to find any game where the team is mentioned in external_id (usually "home-away")
        // or we could query by `category` if we had team columns. 
        // Best bet: Query `external_id` for the team name.
        const { data: games } = await supabase
            .from('predictions')
            .select('*')
            .ilike('external_id', `%${prop.team.toLowerCase()}%`)
            .eq('resolved', false)
            .limit(1);

        if (!games || games.length === 0) {
            logs.push(`SKIPPED: Could not find active game for ${prop.team}`);
            continue;
        }

        const game = games[0];
        const gameId = game.external_id.split('-')[0]; // Extract base ID

        // 2. Construct Prop
        const question = `${prop.player} ${prop.type} ${prop.line} ${prop.stat}`;
        // Unique ID: gameId-player_stat-Player_Name-Type-Line
        const statKey = prop.stat.toLowerCase().replace(/\+/g, '_'); // pts+reb+ast -> pts_reb_ast
        const safePlayerName = prop.player.replace(/ /g, '-');
        const externalId = `${gameId}-player_${statKey}-${safePlayerName}-${prop.type}-${prop.line}`;

        // Check if exists
        const { data: existing } = await supabase.from('predictions').select('id').eq('external_id', externalId).single();
        if (existing) {
            logs.push(`EXISTS: ${question}`);
            continue;
        }

        // Insert
        const { error } = await supabase.from('predictions').insert({
            question,
            category: 'NBA', // Force NBA for these
            external_id: externalId,
            yes_multiplier: 1.87, // Standard -115
            no_multiplier: 1.87,
            resolved: false,
            expires_at: game.expires_at, // Sync with game time
            created_at: new Date().toISOString(),
            yes_percent: 50,
            volume: 0,
            odds_source: 'Real Data Seed (Jan 11)'
        });

        if (error) {
            logs.push(`ERROR: Failed to insert ${question} - ${error.message}`);
        } else {
            logs.push(`ADDED: ${question}`);
            insertedCount++;
        }
    }

    return NextResponse.json({
        success: true,
        inserted: insertedCount,
        logs
    });
}
