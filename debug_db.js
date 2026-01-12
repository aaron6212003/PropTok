const { createClient } = require("@supabase/supabase-js");
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
    env.split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const [k, ...v] = line.split('=');
            return [k.trim(), v.join('=').trim().replace(/^"(.*)"$/, '$1')];
        })
);

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    console.log("--- DEBUG START ---");
    const { data: allUnresolved, error: error1 } = await supabase
        .from('predictions')
        .select('id, category, game_id, resolved')
        .eq('resolved', false);
    
    if (error1) console.error("Error 1:", error1);
    console.log("Total Unresolved Predictions:", allUnresolved?.length || 0);

    const withGameId = allUnresolved?.filter(p => p.game_id !== null);
    console.log("Unresolved with game_id:", withGameId?.length || 0);

    if (withGameId?.length > 0) {
        const categories = [...new Set(withGameId.map(p => p.category))];
        console.log("Categories for games:", categories);
        const nba = withGameId.filter(p => (p.category || '').toLowerCase().includes('nba') || (p.category || '').toLowerCase().includes('basketball'));
        console.log("NBA/Basketball games count:", nba.length);
    }
    console.log("--- DEBUG END ---");
}

check();
