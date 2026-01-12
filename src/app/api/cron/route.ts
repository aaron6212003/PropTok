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
        available_keys: Object.keys(process.env).filter(k => !k.includes('KEY') && !k.includes('SECRET')), // Safety first
        supabase_keys: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
        odds_keys: Object.keys(process.env).filter(k => k.includes('ODDS')),
        meta: {
            url: process.env.VERCEL_URL || "local",
            region: process.env.VERCEL_REGION || "local",
            time: new Date().toISOString(),
            node_env: process.env.NODE_ENV,
            vercel_env: process.env.VERCEL_ENV || "unknown"
        }
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

    // --- PART 1.5: SPORTS RESOLUTION ---
    try {
        const resolveLogs = await sportsService.resolveGames();
        resolveLogs.forEach((log: string) => results.push({ type: "Sports Resolution", log }));
    } catch (e: any) {
        console.error("Sports Resolution Failed:", e);
        results.push({ type: "Resolution Error", message: e.message });
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

    // --- PART 2: FALLBACK SEEDING (If Feed Empty) ---
    // If TheOddsAPI fails or returns 0 games, we MUST show something.
    const { count } = await supabase.from('predictions').select('*', { count: 'exact', head: true }).eq('resolved', false);

    if (count === 0) {
        results.push({ type: "Fallback", message: "Feed empty. Injecting mock data." });

        const MOCKS = [
            {
                category: "NFL",
                question: "Will Kansas City Chiefs win against Baltimore Ravens?",
                external_id: "mock-nfl-chiefs-ravens",
                yes_multiplier: 1.85,
                no_multiplier: 1.95,
                expires_at: new Date(Date.now() + 86400000).toISOString(),
                resolved: false,
                yes_percent: 65,
                volume: 12000
            },
            {
                category: "NBA",
                question: "Will Lakers vs Warriors go OVER 235.5 points?",
                external_id: "mock-nba-lakers-warriors-total",
                yes_multiplier: 1.91,
                no_multiplier: 1.91,
                expires_at: new Date(Date.now() + 43200000).toISOString(),
                resolved: false,
                yes_percent: 50,
                volume: 5400
            },
            {
                category: "NFL",
                question: "Will Patrick Mahomes throw OVER 2.5 Touchdowns?",
                external_id: "mock-nfl-mahomes-tds",
                yes_multiplier: 2.10,
                no_multiplier: 1.70,
                expires_at: new Date(Date.now() + 86400000).toISOString(),
                resolved: false,
                yes_percent: 45,
                volume: 8900
            },
            {
                category: "Crypto",
                question: "Will Bitcoin hit $100k by tomorrow?",
                external_id: "mock-crypto-btc-100k",
                oracle_type: "crypto_price_gt",
                oracle_id: "bitcoin",
                target_value: 100000,
                yes_multiplier: 3.5,
                no_multiplier: 1.25,
                expires_at: new Date(Date.now() + 86400000).toISOString(),
                resolved: false,
                yes_percent: 15,
                volume: 25000
            }
        ];

        for (const mock of MOCKS) {
            await supabase.from("predictions").insert(mock);
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
