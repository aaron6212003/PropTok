
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupStaleBets() {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    console.log(`Searching for unresolved predictions older than ${twoDaysAgo}...`);

    // 1. Find Stale Predictions
    const { data: stalePredictions, error: predError } = await supabase
        .from('predictions')
        .select('id, question, expires_at')
        .eq('resolved', false)
        .lt('expires_at', twoDaysAgo);

    if (predError) {
        console.error("Error finding predictions:", predError);
        return;
    }

    if (!stalePredictions || stalePredictions.length === 0) {
        console.log("No stale unresolved predictions found.");
        return;
    }

    const staleIds = stalePredictions.map(p => p.id);
    console.log(`Found ${staleIds.length} stale predictions.`);

    // 2. Find Votes on these predictions
    const { data: votes, error: voteError } = await supabase
        .from('votes')
        .select('id, amount, user_id, prediction_id')
        .in('prediction_id', staleIds);

    if (voteError) {
        console.error("Error finding votes:", voteError);
        return;
    }

    console.log(`Found ${votes?.length || 0} pending bets on these stale games.`);

    if (votes && votes.length > 0) {
        // 3. Delete Votes
        const { error: delError } = await supabase
            .from('votes')
            .delete()
            .in('id', votes.map(v => v.id));

        if (delError) console.error("Error deleting votes:", delError);
        else console.log("Successfully deleted stale votes.");

        // Refund? (Optional - skipping for now as user just said 'get rid of')
    }

    // 4. Cleanup Bundles? 
    // Bundle legs link to predictions.
    // If a bundle has a leg in staleIds, the bundle is effectively stuck.
    // Finding bundles to delete...

    // Check bundle legs
    const { data: legs, error: legError } = await supabase
        .from('bundle_legs')
        .select('bundle_id')
        .in('prediction_id', staleIds);

    if (legs && legs.length > 0) {
        const bundleIds = [...new Set(legs.map(l => l.bundle_id))];
        console.log(`Found ${bundleIds.length} bundles containing stale legs.`);

        const { error: bundleDelError } = await supabase
            .from('bundles')
            .delete()
            .in('id', bundleIds);

        if (bundleDelError) console.error("Error deleting bundles:", bundleDelError);
        else console.log("Successfully deleted stale bundles.");
    }

    console.log("Cleanup complete.");
}

cleanupStaleBets();
