
import { createClient } from '@supabase/supabase-js';
import { sportsService } from '../src/lib/sports-service';

// Load env vars if running locally (handled by sourcing in terminal usually, but safe to assume env is present if run via next/scripts or just assume pre-loaded)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log("Starting cleanup...");

    // 1. Delete Soccer and NCAAB
    const { error, count } = await supabase
        .from('predictions')
        .delete({ count: 'exact' })
        .in('category', ['Soccer', 'NCAAB']);

    if (error) {
        console.error("Error deleting:", error);
    } else {
        console.log(`Deleted ${count} Soccer/NCAAB predictions.`);
    }

    // 2. Force Ingest NCAAF
    console.log("Force ingesting NCAAF...");
    // We can call sportsService directly if we modify it to accept specific sport, 
    // or just rely on its loop (which now includes NCAAF and excludes others)
    // But sportsService.ingestGames is a big loop.
    // Let's just call ingestion.

    await sportsService.ingestGames();
    console.log("Ingestion complete.");
}

cleanup();
