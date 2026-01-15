
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function chunkedCleanup() {
    const now = new Date().toISOString();
    console.log(`Cleaning up expired unresolved items older than now (${now})...`);

    // 1. Fetch ALL Expired Unresolved Predictions
    // We only need IDs.
    const { data: predictions, error: pError } = await supabase
        .from('predictions')
        .select('id')
        .eq('resolved', false)
        .lt('expires_at', now);

    if (pError) {
        console.error("Fetch Error:", pError);
        return;
    }

    if (!predictions || predictions.length === 0) {
        console.log("No stale predictions found.");
        return;
    }

    const allIds = predictions.map(p => p.id);
    console.log(`Found ${allIds.length} stale predictions. Deleting in batches of 50...`);

    // 2. Delete Votes in Batches
    // We must find votes associated with these IDs first?
    // Or just delete votes where prediction_id is in the batch.

    // It's better to iterate through the prediction IDs in chunks and delete dependent votes/bundles.
    const chunkSize = 50;
    for (let i = 0; i < allIds.length; i += chunkSize) {
        const batchIds = allIds.slice(i, i + chunkSize);
        console.log(`Processing batch ${Math.floor(i / chunkSize) + 1}... (${batchIds.length} items)`);

        // A. Delete Votes
        const { error: vError } = await supabase
            .from('votes')
            .delete()
            .in('prediction_id', batchIds);

        if (vError) console.error("  Vote Delete Error:", vError.message);

        // B. Delete Bundles (via bundle_legs)
        // Find legs
        const { data: legs } = await supabase
            .from('bundle_legs')
            .select('bundle_id')
            .in('prediction_id', batchIds);

        if (legs && legs.length > 0) {
            const bIds = [...new Set(legs.map(l => l.bundle_id))];
            const { error: bError } = await supabase
                .from('bundles')
                .delete()
                .in('id', bIds);
            if (bError) console.error("  Bundle Delete Error:", bError.message);
        }

        // C. Delete Predictions (Optional, but good for hygiene)
        // User didn't ask to delete the games themselves, just the bets. 
        // But "stuck bets" implies the game is invalid or stuck.
        // I will NOT delete the predictions to avoid breaking other things, 
        // unless I am sure. User just said "get rid of the old ones that never loaded".
        // Clearing votes/bundles is enough for the user.
    }

    console.log("Chunked cleanup complete.");
}

chunkedCleanup();
