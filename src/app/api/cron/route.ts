import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePrediction } from "@/app/actions";

export const dynamic = "force-dynamic";

export async function GET() {
    const supabase = await createClient();
    const results = [];

    // --- PART 1: INGESTION (Mocked for now) ---
    // In a real app, we fetch from TheRundown or SportRadar here.
    const MOCK_GAMES = [
        {
            category: "NFL",
            question: "Will Patrick Mahomes throw for OVER 285.5 Yards?",
            line: 285.5,
            oracle_type: "player_stat_gt",
            oracle_id: "mahomes-yards-week1",
            player_name: "Patrick Mahomes",
            game_date: new Date(Date.now() + 86400000).toISOString()
        },
        {
            category: "Crypto",
            question: "Will Bitcoin be above $100k tomorrow?",
            line: 100000,
            oracle_type: "crypto_price_gt",
            oracle_id: "bitcoin",
            target_value: 100000,
            game_date: new Date(Date.now() + 86400000).toISOString()
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
