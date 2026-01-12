
const { createAdminClient } = require('./src/lib/supabase/admin');

async function checkIds() {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('predictions').select('id, external_id, question').limit(5);
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

checkIds();
