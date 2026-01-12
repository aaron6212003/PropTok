
import { createClient } from '@supabase/supabase-js';

const API_KEY = "2ccfa13aeb328eba424a7560ec465fab"; // User provided key
const BASE_URL = "https://api.the-odds-api.com/v4/sports";

async function run() {
    console.log("🕵️‍♂️ Starting Prop Access Diagnosis...");

    // 1. Get an active NBA Game
    const schedUrl = `${BASE_URL}/basketball_nba/odds/?apiKey=${API_KEY}&regions=us&markets=h2h&oddsFormat=decimal`;
    const schedRes = await fetch(schedUrl);
    const games = await schedRes.json();

    if (!Array.isArray(games) || games.length === 0) {
        console.log("❌ No active NBA games found to test.");
        return;
    }

    const gameId = games[0].id;
    console.log(`✅ Found NBA Game: ${games[0].home_team} vs ${games[0].away_team} (ID: ${gameId})`);

    // 2. Test "player_points" ONLY (Most basic prop)
    console.log("\n🧪 Test 1: Requesting 'player_points'...");
    const propUrl = `${BASE_URL}/basketball_nba/events/${gameId}/odds?apiKey=${API_KEY}&regions=us&markets=player_points&oddsFormat=decimal`;

    const propRes = await fetch(propUrl);

    if (propRes.status === 200) {
        console.log("   ✅ SUCCESS! 'player_points' is accessible.");
        const data = await propRes.json();
        console.log(`   Events received: ${JSON.stringify(data).length} chars`);
    } else {
        console.log(`   ❌ FAILED (Status ${propRes.status})`);
        console.log(`   Response: ${await propRes.text()}`);
    }

    // 3. Test "player_assists"
    console.log("\n🧪 Test 2: Requesting 'player_assists'...");
    const propUrl2 = `${BASE_URL}/basketball_nba/events/${gameId}/odds?apiKey=${API_KEY}&regions=us&markets=player_assists&oddsFormat=decimal`;
    const propRes2 = await fetch(propUrl2);

    if (propRes2.status === 200) {
        console.log("   ✅ SUCCESS! 'player_assists' is accessible.");
    } else {
        console.log(`   ❌ FAILED (Status ${propRes2.status})`);
    }
}

run();
