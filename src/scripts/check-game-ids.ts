
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zenhxaXZ1ZXBlZ216Z21jYmt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgzMjg2OCwiZXhwIjoyMDgzNDA4ODY4fQ.SuWcBPYEaZbR4CxHIWvhTwuO2_HurFZJIXw8aqpIz9g";

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log("--- Checking Player Props Game IDs ---");

    // Fetch a few player props (category 'player_props' or checking external_id format)
    // Actually, let's look for predictions where category is NOT a major league (or check logic).
    // Usually 'NFL', 'NBA' are categories. Player props might share that category?
    // Let's just dump 5 random predictions and see their category and game_id.

    const { data: props, error } = await adminClient
        .from("predictions")
        .select("id, question, category, game_id, external_id")
        .limit(10);

    if (error) console.error(error);
    else console.table(props);

    // Check specifically for something that looks like a player prop
    const { data: playerProps } = await adminClient
        .from("predictions")
        .select("id, question, game_id")
        .ilike("question", "%over%") // 'Over' usually implies player prop or total
        .limit(5);

    console.log("--- Potential Player Props ---");
    console.table(playerProps);
}

main();
