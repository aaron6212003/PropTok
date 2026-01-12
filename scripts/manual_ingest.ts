
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
