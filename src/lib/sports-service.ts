import { createAdminClient } from "./supabase/admin";

const ODDS_API_KEY = process.env.THE_ODDS_API_KEY;
const BASE_URL = "https://api.the-odds-api.com/v4/sports";

export interface SportsMarket {
    id: string;
    sport_key: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    bookmakers: Array<{
        key: string;
        title: string;
        markets: Array<{
            key: string;
            outcomes: Array<{
                name: string;
                price: number;
                point?: number;
            }>;
        }>;
    }>;
}

export const sportsService = {
    decimalToMultiplier(decimal: number): number {
        return Number(decimal.toFixed(2));
    },

    americanToMultiplier(american: number): number {
        if (american > 0) {
            return Number(((american + 100) / 100).toFixed(2));
        } else {
            const abs = Math.abs(american);
            return Number(((abs + 100) / abs).toFixed(2));
        }
    },

    generateQuestion(marketType: string, game: SportsMarket, outcome: any): string {
        const team = outcome.name;
        if (marketType === 'h2h') {
            return `Will ${team} win against ${team === game.home_team ? game.away_team : game.home_team}?`;
        }
        if (marketType === 'spreads') {
            const points = outcome.point > 0 ? `+${outcome.point}` : outcome.point;
            return `Will ${team} cover ${points} vs ${team === game.home_team ? game.away_team : game.home_team}?`;
        }
        if (marketType === 'totals') {
            return `Will ${game.home_team} vs ${game.away_team} go ${outcome.name.toUpperCase()} ${outcome.point} points?`;
        }
        return `Will ${team} win?`;
    },

    async fetchLiveOdds(sport: string = "americanfootball_nfl") {
        console.log(`[sportsService] Fetching ${sport}...`);
        if (!ODDS_API_KEY) {
            console.error("[sportsService] CRITICAL: THE_ODDS_API_KEY is missing from environment variables.");
            return { error: "API Key Missing", data: [] };
        }

        try {
            const url = `${BASE_URL}/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`[sportsService] API Error (${response.status}):`, errorData);
                return { error: `API Error ${response.status}`, data: [] };
            }

            const data = await response.json();
            console.log(`[sportsService] Received ${Array.isArray(data) ? data.length : 0} events for ${sport}`);

            if (!Array.isArray(data)) {
                return { error: "API returned non-array data", data: [] };
            }

            return { data };
        } catch (error: any) {
            console.error("[sportsService] Network/Fetch error:", error);
            return { error: error.message, data: [] };
        }
    },

    async ingestGames() {
        console.log("[sportsService] Starting Ingestion Process...");
        const logs: string[] = [];

        const nflRes = await this.fetchLiveOdds("americanfootball_nfl");
        const nbaRes = await this.fetchLiveOdds("basketball_nba");

        if (nflRes.error) logs.push(`NFL Error: ${nflRes.error}`);
        if (nbaRes.error) logs.push(`NBA Error: ${nbaRes.error}`);

        const games = [...(nflRes.data || []), ...(nbaRes.data || [])];
        logs.push(`Total games fetched: ${games.length}`);

        const supabase = createAdminClient();
        if (!supabase) {
            const msg = "Ingestion Aborted: Admin client could not be initialized.";
            console.error(`[sportsService] ${msg}`);
            logs.push(msg);
            return logs;
        }

        let addedCount = 0;
        let skippedCount = 0;

        for (const game of games) {
            // Priority: DraftKings -> FanDuel -> BetMGM -> First available
            const preferredBookies = ["draftkings", "fanduel", "betmgm"];
            const bookie = game.bookmakers.find(b => preferredBookies.includes(b.key)) || game.bookmakers[0];

            if (!bookie) {
                skippedCount++;
                continue;
            }

            for (const market of bookie.markets) {
                // Focus on spreads and totals for now
                if (market.key !== 'spreads' && market.key !== 'totals') continue;

                const outcome = market.outcomes[0];
                const oppositeOutcome = market.outcomes[1];
                if (!outcome || !oppositeOutcome) continue;

                const externalId = `${game.id}-${market.key}-${outcome.name}`;

                // Duplicate check
                const { data: existing } = await supabase
                    .from("predictions")
                    .select("id")
                    .eq("external_id", externalId)
                    .single();

                if (existing) {
                    skippedCount++;
                    continue;
                }

                const question = this.generateQuestion(market.key, game, outcome);
                const yesMultiplier = this.decimalToMultiplier(outcome.price);
                const noMultiplier = this.decimalToMultiplier(oppositeOutcome.price);

                const { error: insertError } = await supabase.from("predictions").insert({
                    question,
                    category: 'Sports',
                    expires_at: game.commence_time,
                    yes_multiplier: yesMultiplier,
                    no_multiplier: noMultiplier,
                    external_id: externalId,
                    odds_source: bookie.title,
                    raw_odds: game,
                    resolved: false,
                    yes_percent: 50,
                    volume: 0
                });

                if (!insertError) {
                    addedCount++;
                    logs.push(`INGESTED: ${question}`);
                } else {
                    console.error("[sportsService] Insert Error:", insertError);
                    logs.push(`FAILED: ${question} (${insertError.message})`);
                }
            }
        }

        logs.push(`Process Complete. Added: ${addedCount}, Skipped/Duplicates: ${skippedCount}`);
        console.log(`[sportsService] ${logs[logs.length - 1]}`);
        return logs;
    }
};
