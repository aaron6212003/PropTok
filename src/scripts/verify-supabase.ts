
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function verify() {
    console.log("--- VERIFYING SUPABASE CONNECTION ---");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error("Missing Environment Variables!");
        console.log("URL:", url);
        console.log("KEY:", key ? "Present" : "Missing");
        return;
    }

    console.log("URL:", url);
    console.log("Key Length:", key.length);

    try {
        const supabase = createClient(url, key, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Try a simple read
        console.log("Attempting Read (users)...");
        const { data: users, error: readError } = await supabase.from('users').select('count').limit(1).single();

        if (readError) {
            console.error("READ FAILED:", readError.message);
        } else {
            console.log("READ SUCCESS. Users found.");
        }

        // Try a simple insert (if safe, or just check admin privileges)
        // We won't insert to avoid garbage, but 'RPC' listing or similar would be good.
        // Let's try to get a user by ID 0 to see if it allows unrestricted access

        console.log("Attempting Admin Access...");
        const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (error) {
            console.error("ADMIN AUTH FAILED:", error.message);
        } else {
            console.log("ADMIN AUTH SUCCESS. Users:", data.users.length);
        }

    } catch (e) {
        console.error("FATAL ERROR:", e);
    }
}

verify();
