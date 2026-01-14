
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkGames() {
    console.log("Checking NFL Games...");

    // 1. Get all NFL predictions
    const { data: predictions, error } = await supabase
        .from('predictions')
        .select('external_id, expires_at')
        .ilike('external_id', 'ea794ebbcb7cbcaf7753c65d0f1a15c8%') // Just to check connection first, wait no let's check general
        .ilike('category', '%football%') // Assuming category is stored

    // Correction: Let's just group by external_id prefix (game id)
    // Actually, let's just fetch all unexpired
    const { data, error: err } = await supabase
        .from('predictions')
        .select('external_id, expires_at, category')
        .eq('resolved', false)
        .gt('expires_at', new Date().toISOString());

    if (err) {
        console.error(err);
        return;
    }

    const games = new Set();
    const nflGames = new Set();

    data?.forEach(p => {
        const gameId = p.external_id?.split('-')[0];
        if (gameId) {
            games.add(gameId);
            // Check if it's NFL (usually inferred from ID or manual check)
            // But we can check the known NFL IDs we saw earlier
            // In debug-ingest we saw: received 4 events
        }
    });

    console.log(`Total Active Games in DB: ${games.size}`);
    console.log("Game IDs found:", Array.from(games));

    // Let's specifically look for the NFL keys we saw in logs
    // We expect 4.
}

checkGames();
