
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNCAAF() {
    console.log("Checking for NCAAF predictions...");
    const { data, error } = await supabase
        .from('predictions')
        .select('id, question, category')
        .eq('category', 'NCAAF');

    if (error) console.error(error);
    else {
        console.log(`Found ${data.length} NCAAF predictions.`);
        data.forEach(p => console.log(`- [${p.category}] ${p.question}`));
    }
}

checkNCAAF();
