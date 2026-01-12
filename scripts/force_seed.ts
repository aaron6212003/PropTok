
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Checking DB...");
    const { count } = await supabase.from('predictions').select('*', { count: 'exact', head: true });
    console.log(`Current Prediction Count: ${count}`);

    const MOCKS = [
        {
            category: "NFL",
            question: "Will Kansas City Chiefs win against Baltimore Ravens?",
            external_id: "manual-seed-nfl-chiefs-ravens",
            yes_multiplier: 1.85,
            no_multiplier: 1.95,
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            resolved: false,
            yes_percent: 65,
            volume: 12000
        },
        {
            category: "NBA",
            question: "Will Lakers vs Warriors go OVER 235.5 points?",
            external_id: "manual-seed-nba-lakers-warriors-total",
            yes_multiplier: 1.91,
            no_multiplier: 1.91,
            expires_at: new Date(Date.now() + 43200000).toISOString(),
            resolved: false,
            yes_percent: 50,
            volume: 5400
        },
        {
            category: "Crypto",
            question: "Will Bitcoin hit $100k by Friday?",
            external_id: "manual-seed-btc-100k",
            oracle_type: "crypto_price_gt",
            oracle_id: "bitcoin",
            target_value: 100000,
            yes_multiplier: 3.5,
            no_multiplier: 1.25,
            expires_at: new Date(Date.now() + 86400000 * 3).toISOString(),
            resolved: false,
            yes_percent: 15,
            volume: 25000
        }
    ];

    console.log("Inserting mocks...");
    const { error } = await supabase.from('predictions').upsert(MOCKS, { onConflict: 'external_id' });

    if (error) console.error("Error:", error);
    else console.log("Success! Mocks inserted.");
}

seed();
