
// Scripts/manual_ingest.ts
// USAGE: npx tsx scripts/manual_ingest.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// IMPORTANT: We need to mock the 'createAdminClient' or use the keys directly
// because we are running outside Next.js context.

const THE_ODDS_API_KEY = process.env.THE_ODDS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!THE_ODDS_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing .env.local keys");
    console.log("ODDS_KEY:", !!THE_ODDS_API_KEY);
    console.log("SB_URL:", !!SUPABASE_URL);
    console.log("SB_KEY:", !!SUPABASE_KEY);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SPORTS = [
    "americanfootball_nfl",
    "basketball_nba",
    "icehockey_nhl"
];

const BASE_URL = "https://api.the-odds-api.com/v4/sports";

async function run() {
    console.log("🚀 Starting Manual Ingestion...");
    console.log(`🔑 Using Odds Key: ${THE_ODDS_API_KEY.slice(0, 5)}...`);

    for (const sport of SPORTS) {
        // Request Expanded Markets
        let markets = "h2h,spreads,totals";
        if (sport.includes("nba")) markets += ",player_points,player_assists,player_rebounds";

        const url = `${BASE_URL}/${sport}/odds/?apiKey=${THE_ODDS_API_KEY}&regions=us&markets=${markets}&oddsFormat=decimal`;

        console.log(`\n📡 Fetching ${sport}...`);
        try {
            const res = await fetch(url);
            console.log(`Status: ${res.status} ${res.statusText}`);

            if (!res.ok) {
                const err = await res.text();
                console.error("❌ Error Body:", err);
                continue;
            }

            const data = await res.json();
            console.log(`✅ Received ${data.length} games.`);

            if (data.length > 0) {
                console.log("Sample Game:", data[0].home_team, "vs", data[0].away_team);
                console.log("Markets:", data[0].bookmakers[0]?.markets.map((m: any) => m.key).join(", "));
            }

        } catch (e) {
            console.error("Fetch Exception:", e);
        }
    }
}

run();
