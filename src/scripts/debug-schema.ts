
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zenhxaXZ1ZXBlZ216Z21jYmt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgzMjg2OCwiZXhwIjoyMDgzNDA4ODY4fQ.SuWcBPYEaZbR4CxHIWvhTwuO2_HurFZJIXw8aqpIz9g";

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log("Checking columns for tournament_entries...");

    // Attempt to insert dummy to see error, or just select * limit 1 and look at keys
    const { data, error } = await adminClient.from("tournament_entries").select("*").limit(1);

    if (error) {
        console.error("Select Error:", error);
    } else if (data && data.length > 0) {
        console.log("Columns found:", Object.keys(data[0]));
    } else {
        console.log("No data found, trying to insert invalid column to provoke error listing...");
        const { error: iError } = await adminClient.from("tournament_entries").insert({
            // @ts-ignore
            invalid_column_xyz: 123
        });
        console.error("Insert Error (Expected):", iError);
    }
}

main();
