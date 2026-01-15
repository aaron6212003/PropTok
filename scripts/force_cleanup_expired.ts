
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function forceCleanupExpired() {
    const now = new Date().toISOString();
    console.log(`Cleaning up ANY unresolved prediction expiring before ${now}...`);

    // 1. Find Expired Unresolved Predictions
    const { data: predictions, error: pError } = await supabase
        .from('predictions')
        .select('id, question, expires_at')
        .eq('resolved', false)
        .lt('expires_at', now);

    if (pError) {
        console.error(pError);
        return;
    }

    if (!predictions.length) {
        console.log("No expired unresolved predictions found.");
        return;
    }

    const pIds = predictions.map(p => p.id);
    console.log(`Found ${pIds.length} stuck predictions.`);

    // 2. Delete Votes on them
    const { error: vError } = await supabase
        .from('votes')
        .delete()
        .in('prediction_id', pIds);

    if (vError) console.error("Vote delete error:", vError);
    else console.log("Deleted associated votes.");

    // 3. Find and Delete Bundles containing them
    // Bundle legs
    const { data: legs } = await supabase
        .from('bundle_legs')
        .select('bundle_id')
        .in('prediction_id', pIds);

    if (legs && legs.length > 0) {
        const bIds = [...new Set(legs.map(l => l.bundle_id))];
        console.log(`Found ${bIds.length} stuck bundles.`);
        const { error: bError } = await supabase
            .from('bundles')
            .delete()
            .in('id', bIds);

        if (bError) console.error("Bundle delete error:", bError);
        else console.log("Deleted associated bundles.");
    }
}

forceCleanupExpired();
