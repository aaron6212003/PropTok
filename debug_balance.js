const { createClient } = require("@supabase/supabase-js");
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
    env.split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const [k, ...v] = line.split('=');
            return [k.trim(), v.join('=').trim().replace(/^"(.*)"$/, '$1')];
        })
);

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log("--- DEBUG START ---");
    // 1. Check all users balance
    const { data: users, error: userError } = await supabase.from('users').select('id, username, cash_balance');
    if (userError) console.error("User Error:", userError);
    else console.log("Users:", users);

    // 2. Check tournaments fees
    const { data: tournaments, error: tError } = await supabase.from('tournaments')
        .select('id, name, entry_fee, entry_fee_cents')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(5);

    if (tError) console.error("Tournament Error:", tError);
    else console.log("Tournaments:", tournaments);
    
    console.log("--- DEBUG END ---");
}

check();
