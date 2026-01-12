
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkFeed() {
    console.log("🔍 Checking Feed Data Availability...");

    // 1. Total Raw Count
    const { count: total } = await supabase.from('predictions').select('*', { count: 'exact', head: true });
    console.log(`\n📊 Total Predictions in DB: ${total}`);

    // 2. "Feed Eligible" (Unresolved, Not Player Prop)
    const { data: feedItems, error } = await supabase
        .from('predictions')
        .select('id, question, external_id, resolved, expires_at')
        .eq('resolved', false)
        .not('external_id', 'ilike', '%-player_%');

    if (error) {
        console.error("❌ Query Error:", error.message);
        return;
    }

    console.log(`\n✅ Feed Candidates (Unresolved + Game Lines): ${feedItems.length}`);

    if (feedItems.length > 0) {
        console.log("   First 3 items:");
        feedItems.slice(0, 3).forEach(p => {
            console.log(`   - [${p.id}] ${p.question} (Ext: ${p.external_id})`);
        });
    } else {
        console.log("   ⚠️ No game lines found! This explains the empty feed.");

        // Check if we have ANY unresolved items (maybe they are all player props?)
        const { count: unresolvedTotal } = await supabase
            .from('predictions')
            .select('*', { count: 'exact', head: true })
            .eq('resolved', false);
        console.log(`   (Total Unresolved items, including props: ${unresolvedTotal})`);
    }

    // 3. Check for "Expired" but Unresolved (Live Games)
    if (feedItems.length > 0) {
        const now = new Date().toISOString();
        const future = feedItems.filter(p => p.expires_at > now);
        const past = feedItems.filter(p => p.expires_at <= now);

        console.log(`\n🕒 Time Check:`);
        console.log(`   - Future Games (Not Started): ${future.length}`);
        console.log(`   - Past/Live Games (Started): ${past.length}`);
    }
}

checkFeed();
