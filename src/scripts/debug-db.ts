
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Fallback key from admin.ts for convenience if env is missing
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zenhxaXZ1ZXBlZ216Z21jYmt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgzMjg2OCwiZXhwIjoyMDgzNDA4ODY4fQ.SuWcBPYEaZbR4CxHIWvhTwuO2_HurFZJIXw8aqpIz9g";

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log("Checking DB...");

    // We need a user ID. Let's just list ALL entries for the tournament if we don't have ID.
    // Or just list latest 5 entries from both tables.

    console.log("--- Tournament Entries (New) ---");
    const { data: entries, error: eError } = await adminClient
        .from("tournament_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

    if (eError) console.error("Error fetching entries:", eError);
    else console.log(entries);

    console.log("\n--- Tournament Participants (Old) ---");
    const { data: parts, error: pError } = await adminClient
        .from("tournament_participants")
        .select("*")
        .order("joined_at", { ascending: false }) // Assuming joined_at or created_at
        .limit(5);

    if (pError) console.error("Error fetching participants:", pError);
    else console.log(parts);
}

main();
