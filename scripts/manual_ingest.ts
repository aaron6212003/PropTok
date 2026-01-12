
// Scripts/manual_ingest.ts
// USAGE: npx tsx scripts/manual_ingest.ts

import fs from 'fs';
import path from 'path';

// Load keys from manual_keys.json (Bypass .env issues)
try {
    const keysPath = path.resolve(process.cwd(), 'manual_keys.json');
    if (fs.existsSync(keysPath)) {
        const keys = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));
        Object.entries(keys).forEach(([k, v]) => {
            process.env[k] = v as string;
        });
        console.log("✅ Loaded keys from manual_keys.json");
    } else {
        console.warn("⚠️ manual_keys.json not found, relying on existing env");
    }
} catch (e) {
    console.error("Failed to load manual keys:", e);
}

const THE_ODDS_API_KEY = process.env.THE_ODDS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!THE_ODDS_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing .env.local keys");
    process.exit(1);
}

// Client removed (delegated to sports-service)

const MAX_GAMES_PER_SPORT = 6; // Limit for rate limits

async function run() {
    console.log("🚀 Starting Manual Ingestion (Production Push)...");

    // We need to instantiate the services locally
    // Note: This relies on sportsService being able to run in a script context
    // We might need to mock or ensure sportsService imports work with 'dotenv' 
    // But since sportsService uses createAdminClient which reads process.env, it should work.

    const { sportsService } = await import('../src/lib/sports-service');

    console.log("🔄 Triggering Ingestion Logic...");
    try {
        const logs = await sportsService.ingestGames();
        console.log("✅ Ingestion Complete. Logs:");
        logs.forEach(l => console.log(`   - ${l}`));
    } catch (e) {
        console.error("❌ Ingestion Failed:", e);
    }
}

run();
