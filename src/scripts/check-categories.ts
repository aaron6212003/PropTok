
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCategories() {
    console.log("Checking Distinct Categories...");

    const { data, error } = await supabase
        .from('predictions')
        .select('category, external_id')
        .eq('resolved', false);

    if (error) {
        console.error(error);
        return;
    }

    const counts: Record<string, number> = {};
    const nflExamples: string[] = [];

    data?.forEach(p => {
        const cat = p.category || "NULL";
        counts[cat] = (counts[cat] || 0) + 1;

        if (cat.toUpperCase().includes('NFL') || cat.toUpperCase().includes('FOOTBALL')) {
            if (nflExamples.length < 5) nflExamples.push(`${p.category} (${p.external_id})`);
        }
    });

    console.log("Active Category Counts:", counts);
    console.log("NFL Examples:", nflExamples);
}

checkCategories();
