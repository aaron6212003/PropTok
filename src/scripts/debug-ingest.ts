
import { sportsService } from "../lib/sports-service";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Mock Supabase Admin Client for the script context
// We need to bypass the standard createAdminClient if it relies on next/headers or server-only context
// But sports-service imports it. Let's see if we can run it as is.
// If sports-service uses 'createAdminClient' from '@/lib/supabase/admin', we need to make sure that file works in a script.

async function main() {
    console.log("--- STARTING MANUAL INGESTION DEBUG ---");
    console.log("Checking Environment Variables...");
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "OK" : "MISSING");
    console.log("SERVICE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "MISSING");
    console.log("ODDS_API_KEY:", process.env.THE_ODDS_API_KEY ? "OK" : "MISSING");

    const key = process.env.THE_ODDS_API_KEY || "";
    const maskedKey = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : "INVALID";
    console.log(`Using Odds API Key: ${maskedKey}`);

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    console.log(`Supabase URL: ${sbUrl}`);
    console.log(`Supabase Key: ${sbKey.length > 10 ? sbKey.substring(0, 5) + "..." : "INVALID"}`);

    try {
        console.log("Testing Key against /sports endpoint (Low Cost)...");
        const testUrl = `https://api.the-odds-api.com/v4/sports?apiKey=${key}`;
        const res = await fetch(testUrl);
        console.log(`Test Status: ${res.status} ${res.statusText}`);

        // Log Headers for Quota Info
        console.log("--- RATE LIMIT HEADERS ---");
        res.headers.forEach((val, key) => {
            if (key.includes("requests") || key.includes("quota") || key.includes("limit")) {
                console.log(`${key}: ${val}`);
            }
        });

        if (!res.ok) {
            console.log("Response Body:", await res.text());
        } else {
            console.log("Key is VALID for general access.");
        }

        console.log("\nStarting Full Ingestion...");
        const logs = await sportsService.ingestGames();
        console.log("\n--- INGESTION LOGS ---");
        logs.forEach(log => console.log(log));
        console.log("--- END LOGS ---");
    } catch (e) {
        console.error("FATAL ERROR:", e);
    }
}

main();
