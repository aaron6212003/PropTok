
import { NextResponse } from "next/server";
import { tank01Service } from "@/lib/tank01-service";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // 1. Get Today's Date (US Eastern Time roughly)
        // Simplification: Use ISO date string for now. 
        // Tank01 expects YYYY-MM-DD.
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        // 2. Parallel Fetch
        const [nba, nfl, nhl] = await Promise.all([
            tank01Service.getNBAScoreboard(todayStr),
            tank01Service.getNFLScoreboard(todayStr),
            tank01Service.getNHLScoreboard(todayStr)
        ]);

        // 3. Normalize Data for Frontend
        // We want a unified structure: { league, home, away, scoreHome, scoreAway, status, clock }

        const events = [];

        // NBA Normalization
        for (const g of nba) {
            events.push({
                id: g.gameID,
                league: 'NBA',
                home: g.home,
                away: g.away,
                scoreHome: g.homePts || 0,
                scoreAway: g.awayPts || 0,
                // Status: "Scheduled", "Live", "Final" - Tank01 uses 'gameStatus' usually
                status: g.gameStatus || (g.gameTime ? 'Scheduled' : 'Final'),
                clock: g.gameClock || g.gameTime || '', // e.g. "Q4 2:00"
                period: g.currentPeriod
            });
        }

        // NFL Normalization
        for (const g of nfl) {
            events.push({
                id: g.gameID,
                league: 'NFL',
                home: g.home,
                away: g.away,
                scoreHome: g.homePts || 0,
                scoreAway: g.awayPts || 0,
                status: g.gameStatus || (g.gameTime ? 'Scheduled' : 'Final'),
                clock: g.gameClock || g.gameTime || '',
                period: g.currentQuarter
            });
        }

        // NHL Normalization
        for (const g of nhl) {
            events.push({
                id: g.gameID,
                league: 'NHL',
                home: g.home,
                away: g.away,
                scoreHome: g.homePts || 0,
                scoreAway: g.awayPts || 0,
                status: g.gameStatus || (g.gameTime ? 'Scheduled' : 'Final'),
                clock: g.gameClock || g.gameTime || '',
                period: g.currentPeriod // usually '1', '2', '3' or 'OT'
            });
        }

        return NextResponse.json({
            date: todayStr,
            events
        });

    } catch (e) {
        console.error("Live Score API Error:", e);
        return NextResponse.json({ events: [] }, { status: 500 });
    }
}
