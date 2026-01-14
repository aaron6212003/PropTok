
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function countActive() {
    console.log("Counting Active Predictions...");

    // 1. Total Active Count (Unresolved or Live < 4h)
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
        .from('predictions')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false)
        .gt('expires_at', fourHoursAgo);

    if (error) {
        console.error("Error counting:", error);
        return;
    }

    console.log(`TOTAL ACTIVE PREDICTIONS: ${count}`);

    // 2. Count by Category (Heuristic - doing a scan since we can't group by easily with basic client without RPC)
    // Actually, let's just fetch a chunk and see the distribution if count is high.

    if ((count || 0) > 4000) {
        console.log("WARNING: Count is close to or exceeding 5000 limit.");
    }
}

countActive();
