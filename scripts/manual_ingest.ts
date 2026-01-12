
// Scripts/manual_ingest.ts
// USAGE: npx tsx scripts/manual_ingest.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const THE_ODDS_API_KEY = process.env.THE_ODDS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!THE_ODDS_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing .env.local keys");
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
    console.log("🚀 Starting Manual Ingestion (Event Endpoint Test)...");
    console.log(`🔑 Using Odds Key: ${THE_ODDS_API_KEY!.slice(0, 5)}...`);

    for (const sport of SPORTS) {
        console.log(`\n📡 Getting Schedule for ${sport}...`);

        // 1. Fetch Schedule (Basic H2H)
        const url = `${BASE_URL}/${sport}/odds/?apiKey=${THE_ODDS_API_KEY!}&regions=us&markets=h2h&oddsFormat=decimal`;

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`Status ${res.status}:`, await res.text());
                continue;
            }
            const games = await res.json();
            console.log(`✅ Found ${games.length} games.`);

            if (games.length > 0) {
                // 2. DRILL DOWN into the FIRST game to test Props
                const game = games[0];
                console.log(`🔎 Testing Props for: ${game.home_team} vs ${game.away_team} (ID: ${game.id})`);

                let markets = "";
                if (sport.includes("nba")) markets = "player_points,player_assists,player_rebounds";
                else if (sport.includes("nfl")) markets = "player_pass_tds,player_pass_attempts,player_rush_yds";
                else if (sport.includes("nhl")) markets = "player_points,player_goals"; // NHL might vary

                if (markets) {
                    const eventUrl = `${BASE_URL}/${sport}/events/${game.id}/odds?apiKey=${THE_ODDS_API_KEY!}&regions=us&markets=${markets}&oddsFormat=decimal`;
                    // console.log(`   Fetching: ${eventUrl}`);

                    const propRes = await fetch(eventUrl);
                    if (!propRes.ok) {
                        console.error(`   ❌ Prop Fetch Failed: ${propRes.status}`, await propRes.text());
                    } else {
                        const propData = await propRes.json();
                        console.log(`   ✅ Success! Received Event Data.`);

                        const bookmakers = propData.bookmakers || [];
                        console.log(`   Bookmakers w/ Props: ${bookmakers.length}`);

                        if (bookmakers.length > 0) {
                            const b = bookmakers[0];
                            console.log(`   [${b.title}] Markets: ${b.markets.map((m: any) => m.key).join(", ")}`);
                            if (b.markets.length > 0) {
                                console.log(`   Sample Outcome: ${JSON.stringify(b.markets[0].outcomes[0])}`);
                            }
                        }
                    }
                }
            } else {
                console.log("   No active games found.");
            }
        } catch (e) {
            console.error("Fetch Exception:", e);
        }
    }
}

run();
