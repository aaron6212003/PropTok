import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolvePrediction } from "@/app/actions";

// Prevent Vercel from caching this route
export const dynamic = "force-dynamic";

export async function GET() {
    const supabase = await createClient();

    // 1. Fetch active predictions with an oracle_id
    const { data: predictions, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("resolved", false)
        .not("oracle_id", "is", null);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results = [];

    // 2. Iterate and Check
    for (const prediction of predictions) {
        if (prediction.oracle_type === "crypto_price_gt") {
            try {
                // Fetch real price from CoinGecko
                const response = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${prediction.oracle_id}&vs_currencies=usd`
                );
                const data = await response.json();
                const currentPrice = data[prediction.oracle_id]?.usd;

                if (currentPrice) {
                    console.log(`Checking ${prediction.oracle_id}: ${currentPrice} > ${prediction.target_value}`);

                    // RESOLUTION LOGIC
                    if (currentPrice > prediction.target_value) {
                        // Target HIT -> YES Wins
                        await resolvePrediction(prediction.id, "YES");
                        results.push({ id: prediction.id, outcome: "YES", reason: `Price ${currentPrice} > ${prediction.target_value}` });
                    } else {
                        // Optional: Check expiration for NO win? 
                        // For now, we only resolve if the target is HIT.
                        // A "price_gt" usually implies "Does it hit X before expiry?"
                    }
                }
            } catch (err) {
                console.error("Crypto Oracle Error:", err);
            }
        }

        // --- SPORTS ORACLE (MOCKED FOR DEMO) ---
        if (prediction.oracle_type === "sports_winner") {
            // In a real app, fetch from https://api.sportsdata.io/v3/nfl/scores/json/ScoresByDate/...
            // For the demo/prototype, we will simulate the "Steelers vs Texans" game result.

            const gameId = prediction.oracle_id; // e.g., 'steelers-texans-2025'
            const targetWinner = prediction.target_slug; // e.g., 'steelers'

            console.log(`Checking Game ${gameId} for winner: ${targetWinner}`);

            // SIMULATED API RESPONSE
            const mockGameDatabase: Record<string, string> = {
                'steelers-texans-2025': 'steelers', // Steelers won!
                'lakers-warriors-2025': 'warriors',
                'chiefs-ravens-2025': 'pending'
            };

            const actualWinner = mockGameDatabase[gameId];

            if (actualWinner && actualWinner !== 'pending') {
                if (actualWinner === targetWinner) {
                    // They bet on the winner -> YES
                    await resolvePrediction(prediction.id, "YES");
                    results.push({ id: prediction.id, outcome: "YES", reason: `Game Winner ${actualWinner} matches target` });
                } else {
                    // They bet on the loser -> resolved as NO
                    await resolvePrediction(prediction.id, "NO");
                    results.push({ id: prediction.id, outcome: "NO", reason: `Game Winner ${actualWinner} does NOT match target` });
                }
            }
        }

        // --- PLAYER PROPS (MOCKED) ---
        if (prediction.oracle_type === "player_stat_gt") {
            // Logic: Check if player's stat > line
            // Mock: Randomly resolve 20% of the time to simulate live game progress

            if (Math.random() > 0.8) {
                const isWin = Math.random() > 0.4; // 60% chance to go Over if it resolves

                if (isWin) {
                    await resolvePrediction(prediction.id, "YES");
                    results.push({ id: prediction.id, outcome: "YES", reason: `Stat Hit: ${prediction.player_name} > ${prediction.line}` });
                } else {
                    // Only resolve NO if game ends? For beta we can random resolve too
                    // await resolvePrediction(prediction.id, "NO"); 
                }
            }
        }
    }

    return NextResponse.json({ success: true, processed: predictions.length, results });
}
