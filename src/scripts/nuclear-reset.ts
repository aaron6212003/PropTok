
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zenhxaXZ1ZXBlZ216Z21jYmt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgzMjg2OCwiZXhwIjoyMDgzNDA4ODY4fQ.SuWcBPYEaZbR4CxHIWvhTwuO2_HurFZJIXw8aqpIz9g";

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    // 1. Get User (Aaron)
    const { data: users, error: uError } = await adminClient.from("users").select("id, email").ilike("email", "%aaron%").limit(1);

    if (!users || users.length === 0) {
        console.log("User not found via email fuzzy search. trying to just list recent users...");
        const { data: recentUsers } = await adminClient.from("users").select("id, email, cash_balance").order("created_at", { ascending: false }).limit(5);
        console.log("Recent users:", recentUsers);
        return;
    }

    const user = users[0];
    console.log(`Doing NUCLEAR RESET for ${user.email} (${user.id})...`);

    // 2. Wipe Entries (All tables)
    console.log("Deleting from tournament_entries...");
    const { error: e1 } = await adminClient.from("tournament_entries").delete().eq("user_id", user.id);
    if (e1) console.error(e1);

    console.log("Deleting from tournament_participants...");
    const { error: e2 } = await adminClient.from("tournament_participants").delete().eq("user_id", user.id);
    if (e2) console.error(e2);

    // 3. Reset Balance to $100
    console.log("Resetting Balance to $1000.00...");
    const { error: e3 } = await adminClient.from("users").update({ cash_balance: 1000 }).eq("id", user.id);
    if (e3) console.error(e3);

    console.log("DONE. User is clean.");
}

main();
