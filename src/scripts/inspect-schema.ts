
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zenhxaXZ1ZXBlZ216Z21jYmt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgzMjg2OCwiZXhwIjoyMDgzNDA4ODY4fQ.SuWcBPYEaZbR4CxHIWvhTwuO2_HurFZJIXw8aqpIz9g";

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log("--- Inspecting tournament_entries ---");
    // We can't do 'describe table' easily via JS client, but we can try to insert a row and see what it returns?
    // Or simpler: just list the keys of an existing row (if any).

    // First, let's look at ANY entry.
    const { data: sample, error } = await adminClient.from("tournament_entries").select("*").limit(1);
    if (sample && sample.length > 0) {
        console.log("Sample Row Keys:", Object.keys(sample[0]));
        console.log("Sample Row:", sample[0]);
    } else {
        console.log("No entries found. Trying to insert a test row to see allowed columns...");
        // This is hacky but effective.
        const { data: inserted, error: iError } = await adminClient.from("tournament_entries").insert({
            // minimal fields
            tournament_id: "00000000-0000-0000-0000-000000000000", // invalid FK likely
            user_id: "00000000-0000-0000-0000-000000000000",
            current_stack: 1000
        }).select();

        if (iError) {
            console.log("Insert Error (Expect FK error, but reveals if table exists):", iError);
        }
    }
}

main();
