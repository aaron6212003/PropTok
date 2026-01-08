import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePrediction } from "@/app/actions";

export const dynamic = "force-dynamic";

export async function GET() {
    const supabase = await createClient();
    const results = [];

    // --- PART 1: INGESTION (Semi-Manual for Launch) ---
    // REAL 2026 NFL WILD CARD WEEKEND GAMES
    const MOCK_GAMES = [
        {
            category: "NFL",
            question: "Will the Bills cover -9.5 vs Jaguars?",
            line: -9.5,
            oracle_type: "spread_cover",
            oracle_id: "buf-vs-jax-spread-wc26",
            game_date: new Date("2026-01-11T18:00:00Z").toISOString(), // Sunday 1 PM ET
            player_name: "Buffalo Bills"
        },
        {
            category: "NFL",
            question: "Will Josh Allen throw for OVER 275.5 Yards vs JAX?",
            line: 275.5,
            oracle_type: "player_stat_gt",
            oracle_id: "allen-pass-yards-wc26",
            game_date: new Date("2026-01-11T18:00:00Z").toISOString(),
            player_name: "Josh Allen"
        },
        {
            category: "NFL",
            question: "Will 49ers vs Eagles go OVER 47.5 Points?",
            line: 47.5,
            oracle_type: "total_score_gt",
            oracle_id: "sf-vs-phi-total-wc26",
            game_date: new Date("2026-01-11T21:30:00Z").toISOString(), // Sunday 4:30 PM ET
            player_name: "Game Total"
        },
        {
            category: "NFL",
            question: "Will Christian McCaffrey score 2+ TDs vs Eagles?",
            line: 1.5,
            oracle_type: "player_stat_gt",
            oracle_id: "cmc-tds-wc26",
            game_date: new Date("2026-01-11T21:30:00Z").toISOString(),
            player_name: "Christian McCaffrey"
        },
        {
            category: "NFL",
            question: "Will Patriots cover +7.5 @ Chargers?",
            line: 7.5,
            oracle_type: "spread_cover",
            oracle_id: "ne-vs-lac-spread-wc26",
            game_date: new Date("2026-01-12T01:00:00Z").toISOString(), // Sunday 8 PM ET
            player_name: "New England Patriots"
        },
        {
            category: "Crypto",
            question: "Will Bitcoin hit $50k by Monday?",
            line: 50000,
            oracle_type: "crypto_price_gt",
            oracle_id: "bitcoin",
            target_value: 50000,
            game_date: new Date("2026-01-12T23:59:00Z").toISOString()
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

            // 2. NFL Games (Resolve if past game_date)
            const gameTime = new Date(prediction.game_date);
            const now = new Date();

            if (now > gameTime) {
                // If the game is in the past, let's resolve it!
                // We'll use semi-random but consistent outcomes based on oracle_id
                const seed = prediction.oracle_id.length;
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


    return NextResponse.json({ success: true, actions: results });
}
