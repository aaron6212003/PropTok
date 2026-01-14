import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_KEY = process.env.THE_ODDS_API_KEY;
const BASE_URL = "https://api.the-odds-api.com/v4/sports";

export async function GET() {
    if (!API_KEY) return NextResponse.json({ error: "No API Key" });

    const logs: any[] = [];

    try {
        // 1. Fetch Completed NHL Games (Scores) - TRYING WITH MARKETS PARAM
        const scoresUrl = `${BASE_URL}/icehockey_nhl/scores/?apiKey=${API_KEY}&daysFrom=3&markets=player_points`;
        logs.push({ step: "Fetching Scores WITH MARKETS", url: scoresUrl });
        const scoresRes = await fetch(scoresUrl);
        const scoresData = await scoresRes.json();

        const completedGame = scoresData.find((g: any) => g.completed);

        logs.push({
            step: "Scores Data Sample",
            sample: completedGame || "No completed games found"
        });

        if (completedGame) {
            // 2. Fetch "Odds" for this completed game to see if 'outcomes' have grading
            // We'll check a player prop market
            const eventId = completedGame.id;
            const propsUrl = `${BASE_URL}/icehockey_nhl/events/${eventId}/odds?apiKey=${API_KEY}&regions=us&markets=player_points,h2h&oddsFormat=decimal`;

            logs.push({ step: "Fetching Completed Event Odds", url: propsUrl });
            const propsRes = await fetch(propsUrl);
            const propsData = await propsRes.json();

            logs.push({
                step: "Completed Event Props Data",
                data: propsData
            });
        }

        return NextResponse.json({ logs });

    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack });
    }
}
