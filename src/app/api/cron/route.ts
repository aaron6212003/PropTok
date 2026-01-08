import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePrediction } from "@/app/actions";

export const dynamic = "force-dynamic";

export async function GET() {
    const supabase = await createClient();
    const results = [];

    // --- PART 1: INGESTION (Live from The Odds API) ---
    const API_KEY = process.env.THE_ODDS_API_KEY;
    const gamesToIngest = [];

    if (API_KEY) {
        try {
            // Fetch upcoming NFL games with odds
            const response = await fetch(
                `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american`,
                { next: { revalidate: 3600 } } // Cache for 1 hour
            );

            const data = await response.json();

            // Process each game
            for (const game of data.slice(0, 5)) { // Limit to 5 games to save API quota
                const homeTeam = game.home_team;
                const awayTeam = game.away_team;
                const gameTime = game.commence_time;

                // Get DraftKings odds (or first available)
                const oddsData = game.bookmakers?.find((b: any) => b.key === 'draftkings') || game.bookmakers?.[0];

                if (oddsData) {
                    // Spread
                    const spreadMarket = oddsData.markets?.find((m: any) => m.key === 'spreads');
                    if (spreadMarket) {
                        const homeSpread = spreadMarket.outcomes.find((o: any) => o.name === homeTeam);
                        if (homeSpread) {
                            gamesToIngest.push({
                                category: "NFL",
                                question: `Will ${homeTeam} cover ${homeSpread.point > 0 ? '+' : ''}${homeSpread.point} vs ${awayTeam}?`,
                                line: homeSpread.point,
                                oracle_type: "spread_cover",
                                oracle_id: `${homeTeam.toLowerCase().replace(/\s/g, '-')}-spread-${game.id}`,
                                game_date: gameTime,
                                player_name: homeTeam
                            });
                        }
                    }

                    // Total
                    const totalMarket = oddsData.markets?.find((m: any) => m.key === 'totals');
                    if (totalMarket) {
                        const overUnder = totalMarket.outcomes[0];
                        if (overUnder) {
                            gamesToIngest.push({
                                category: "NFL",
                                question: `Will ${homeTeam} vs ${awayTeam} go OVER ${overUnder.point} Points?`,
                                line: overUnder.point,
                                oracle_type: "total_score_gt",
                                oracle_id: `${game.id}-total`,
                                game_date: gameTime,
                                player_name: "Game Total"
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching from The Odds API:", error);
        }
    }

    // Add a crypto prop for variety
    gamesToIngest.push({
        category: "Crypto",
        question: "Will Bitcoin hit $50k this week?",
        line: 50000,
        oracle_type: "crypto_price_gt",
        oracle_id: "bitcoin",
        target_value: 50000,
        game_date: new Date(Date.now() + 86400000 * 7).toISOString()
    });

    // Insert games into database
    for (const game of gamesToIngest) {
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
