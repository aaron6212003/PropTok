const { createClient } = require("@supabase/supabase-js");
const fs = require('fs');
const path = require('path');

// Read .env.local manually
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

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
    console.log("Checking DB for unresolved predictions with game_id...");
    const { data, error } = await supabase
        .from("predictions")
        .select("id, game_id, category, resolved, question")
        .eq("resolved", false)
        .not("game_id", "is", null);
    
    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Found", data?.length, "unresolved predictions with game_id");
    if (data?.length > 0) {
        const categories = [...new Set(data.map(p => p.category))];
        console.log("Categories in DB:", categories);
        
        // Manual group by game_id to see what getUpcomingGames would do
        const gamesMap = new Map();
        data.forEach(p => {
            if (!gamesMap.has(p.game_id)) {
                gamesMap.set(p.game_id, { id: p.game_id, category: p.category });
            }
        });
        console.log("Unique games found:", gamesMap.size);
        console.log("Sample game categories:", Array.from(gamesMap.values()).slice(0, 10));
    } else {
        console.log("No data found matching criteria.");
        // Let's check ALL unresolved
        const { count } = await supabase.from("predictions").select("*", { count: 'exact', head: true }).eq("resolved", false);
        console.log("Total unresolved predictions in DB:", count);
    }
}

debug();
