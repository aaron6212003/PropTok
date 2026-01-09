import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePrediction } from "@/app/actions";
import { sportsService } from "@/lib/sports-service";

export const dynamic = "force-dynamic";

export async function GET() {
    const supabase = await createClient();
    const results: any[] = [];

    // --- DIAGNOSTIC: ENV VAR CHECK ---
    const envDiagnostics = {
        THE_ODDS_API_KEY: process.env.THE_ODDS_API_KEY ? "FOUND (Length: " + process.env.THE_ODDS_API_KEY.length + ")" : "MISSING",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "FOUND" : "MISSING",
        SUPABASE_ADMIN_KEY: process.env.SUPABASE_ADMIN_KEY ? "FOUND" : "MISSING",
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "FOUND" : "MISSING",
    };
    results.push({ type: "Environment Diagnostics", ...envDiagnostics });

    // --- PART 1: LIVE INGESTION ---
    try {
        const liveLogs = await sportsService.ingestGames();
        liveLogs.forEach((log: string) => results.push({ type: "Live Ingestion", log }));
    } catch (e: any) {
        console.error("Sports Ingestion Failed:", e);
        results.push({ type: "Ingestion Error", message: e.message });
    }

    // Keep crypto mock for now as it's useful
    const CRYPTO_MOCKS = [
        {
            category: "Crypto",
            question: "Will Bitcoin hit $110k by Monday?",
            line: 110000,
            oracle_type: "crypto_price_gt",
            oracle_id: "bitcoin",
            target_value: 110000,
            game_date: new Date("2026-01-12T23:59:00Z").toISOString(),
            yes_multiplier: 1.9,
            no_multiplier: 1.9
        }
    ];

    for (const game of CRYPTO_MOCKS) {
        // Check duplication
        const { data: existing } = await supabase.from("predictions").select("id").eq("oracle_id", game.oracle_id).single();

        if (!existing) {
            await supabase.from("predictions").insert({
                ...game,
                created_at: new Date().toISOString(),
                resolved: false,
                yes_percent: 50,
                volume: 0,
                expires_at: game.game_date
            });
            results.push({ type: "Ingestion", item: game.question });
        }
    }

    // --- PART 2: ORACLE RESOLUTION ---
    const { data: predictions } = await supabase
        .from("predictions")
        .select("*")
        .eq("resolved", false)
        .not("oracle_id", "is", null);

    if (predictions) {
        for (const prediction of predictions) {
            // 1. Crypto
            if (prediction.oracle_type === "crypto_price_gt") {
                try {
                    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${prediction.oracle_id}&vs_currencies=usd`);
                    const data = await response.json();
                    const price = data[prediction.oracle_id]?.usd;
                    if (price && price > prediction.target_value) {
                        await resolvePrediction(prediction.id, "YES");
                        results.push({ type: "Resolution", id: prediction.id, outcome: "YES" });
                    }
                } catch (e) { console.error(e); }
            }

            // 2. NFL Games (Resolve if past game_date)
            if (prediction.game_date) {
                const gameTime = new Date(prediction.game_date);
                const now = new Date();

                if (now > gameTime) {
                    const seed = prediction.oracle_id?.length || 7;
                    const outcome = (seed % 2 === 0) ? "YES" : "NO";

                    await resolvePrediction(prediction.id, outcome);
                    results.push({
                        type: "Resolution",
                        id: prediction.id,
                        question: prediction.question,
                        outcome: outcome
                    });
                }
            }
        }
    }

    return NextResponse.json({ success: true, actions: results });
}
