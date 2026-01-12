const { createClient } = require("@supabase/supabase-js");
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
    env.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const index = line.indexOf('=');
            return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^"(.*)"$/, '$1')];
        })
);

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function backfill() {
    console.log("Starting backfill for game_id...");
    const { data: predictions, error } = await supabase
        .from('predictions')
        .select('id, external_id, game_id')
        .is('game_id', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching predictions:", error);
        return;
    }

    console.log(`Found ${predictions.length} predictions with missing game_id.`);
    
    let updatedCount = 0;
    for (const p of predictions) {
        if (!p.external_id) continue;
        
        // Format: {gameId}-{marketKey}-{uniqueIdentifier}
        // Example: f123456-h2h-Lakers -> gameId is f123456
        const parts = p.external_id.split('-');
        if (parts.length >= 2) {
            const gameId = parts[0];
            // Basic sanity check: gameId should probably not contain spaces and be a reasonable length
            if (gameId && gameId.length > 5) {
                const { error: updateError } = await supabase
                    .from('predictions')
                    .update({ game_id: gameId })
                    .eq('id', p.id);
                
                if (!updateError) updatedCount++;
                else console.error(`Error updating ${p.id}:`, updateError);
            }
        }
    }

    console.log(`Successfully backfilled ${updatedCount} predictions.`);
}

backfill();
