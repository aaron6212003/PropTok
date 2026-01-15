
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBundles() {
    // Get the user (Aaron) - assuming one main user or I'll just list all pending bundles
    // The user ID is likely fixed or I can just simple query.
    // I'll query all pending bundles to see what's stuck.

    console.log("Fetching pending bundles...");
    const { data: bundles, error } = await supabase
        .from('bundles')
        .select(`
            id, 
            created_at, 
            user_id,
            legs:bundle_legs (
                prediction:predictions (
                    id, question, expires_at, resolved, outcome
                )
            )
        `)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${bundles.length} pending bundles.`);

    bundles.forEach((b: any) => {
        console.log(`\nBundle [${b.id}] Created: ${b.created_at}`);
        b.legs.forEach((leg: any, i: number) => {
            const p = leg.prediction;
            if (p) {
                console.log(`   Leg ${i + 1}: ${p.question}`);
                console.log(`   - Expires: ${p.expires_at}`);
                console.log(`   - Resolved: ${p.resolved}`);
            } else {
                console.log(`   Leg ${i + 1}: [Prediction Missing]`);
            }
        });
    });
}

inspectBundles();
