import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePrediction } from "@/app/actions";

export const dynamic = "force-dynamic";

export async function GET() {
    const supabase = await createClient();
    const results = [];

    // --- PART 1: INGESTION (Semi-Manual for Launch) ---
    // REAL NFL WILD CARD MATCHUPS
    const MOCK_GAMES = [
        {
            category: "NFL",
            question: "Will the Lions cover -3.5 vs Rams?",
            line: -3.5,
            oracle_type: "spread_cover",
            oracle_id: "det-vs-lar-spread",
            game_date: new Date("2024-01-14T20:00:00Z").toISOString(), // Sunday Night
            player_name: "Detroit Lions"
        },
        {
            category: "NFL",
            question: "Will Travis Kelce verify OVER 6.5 Receptions?",
            line: 6.5,
            oracle_type: "player_stat_gt",
            oracle_id: "kelce-rec-wildcard",
            game_date: new Date("2024-01-13T20:00:00Z").toISOString(), // Saturday
            player_name: "Travis Kelce"
        },
        {
            category: "NFL",
            question: "Will Packers vs Cowboys go OVER 50.5 Points?",
            line: 50.5,
            oracle_type: "total_score_gt",
            oracle_id: "gb-vs-dal-total",
            game_date: new Date("2024-01-14T16:30:00Z").toISOString(),
            player_name: "Game Total"
        },
        {
            category: "NFL",
            question: "Will Lamar Jackson Rush for OVER 60.5 Yards?",
            line: 60.5,
            oracle_type: "player_stat_gt",
            oracle_id: "lamar-rush-divisional",
            game_date: new Date("2024-01-20T20:00:00Z").toISOString(),
            player_name: "Lamar Jackson"
        },
        {
            category: "Crypto",
            question: "Will Bitcoin hit $50k by Monday?",
            line: 50000,
            oracle_type: "crypto_price_gt",
            oracle_id: "bitcoin",
            target_value: 50000,
            game_date: new Date(Date.now() + 86400000 * 3).toISOString()
        }
    ];

    for (const game of MOCK_GAMES) {
        // Check duplication
        const { data: existing } = await supabase.from("predictions").select("id").eq("oracle_id", game.oracle_id).single();

        if (!existing) {
            await supabase.from("predictions").insert({
                ...game,
                created_at: new Date().toISOString(),
                resolved: false
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
            // MOCK RESOLUTION LOGIC
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

            // 2. Player Props (Random Mock 20% flush)
            if (prediction.oracle_type === "player_stat_gt" && Math.random() > 0.8) {
                const isWin = Math.random() > 0.4;
                if (isWin) {
                    await resolvePrediction(prediction.id, "YES");
                    results.push({ type: "Resolution", id: prediction.id, outcome: "YES (Mock)" });
                }
            }
        }
    }

    return NextResponse.json({ success: true, actions: results });
}
