import { createAdminClient } from "./supabase/admin";

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
            // Outcome name is usually 'Over' or 'Under'
            return `Will ${game.home_team} vs ${game.away_team} go ${outcome.name.toUpperCase()} ${outcome.point} total points?`;
        }
        return `Will ${team} win?`;
    },

    async fetchLiveOdds(sport: string) {
        const apiKey = process.env.THE_ODDS_API_KEY;
        console.log(`[sportsService] Fetching ${sport}... (Key length: ${apiKey?.length || 0})`);

        if (!apiKey) {
            console.error("[sportsService] CRITICAL: THE_ODDS_API_KEY is missing from process.env.");
            return { error: "API Key Missing", data: [] };
        }

        try {
            const url = `${BASE_URL}/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`[sportsService] API Error (${response.status}) for ${sport}:`, errorData);
                return { error: `API Error ${response.status}`, data: [] };
            }

            const data = await response.json();
            console.log(`[sportsService] Received ${Array.isArray(data) ? data.length : 0} events for ${sport}`);

            if (!Array.isArray(data)) {
                return { error: "API returned non-array data", data: [] };
            }

            return { data };
        } catch (error: any) {
            console.error(`[sportsService] Network/Fetch error for ${sport}:`, error);
            return { error: error.message, data: [] };
        }
    },

    async ingestGames() {
        console.log("[sportsService] Starting Ingestion Process...");
        const logs: string[] = [];

        // Expanded Sports List
        const sports = [
            "americanfootball_nfl",
            "basketball_nba",
            "icehockey_nhl",
            "soccer_epl",
            "soccer_uefa_champions_league"
        ];

        const sportCategoryMap: Record<string, string> = {
            "americanfootball_nfl": "NFL",
            "basketball_nba": "NBA",
            "icehockey_nhl": "NHL",
            "soccer_epl": "Soccer",
            "soccer_uefa_champions_league": "Soccer"
        };

        const allFetchedGames: any[] = [];

        for (const sport of sports) {
            const res = await this.fetchLiveOdds(sport);
            if (res.error) {
                logs.push(`${sport} Error: ${res.error}`);
            } else {
                allFetchedGames.push(...(res.data || []));
            }
        }

        logs.push(`Total games fetched across all sports: ${allFetchedGames.length}`);

        const supabase = createAdminClient();
        if (!supabase) {
            const msg = "Ingestion Aborted: Admin client could not be initialized (Check SUPABASE_SERVICE_ROLE_KEY).";
            console.error(`[sportsService] ${msg}`);
            logs.push(msg);
            return logs;
        }

        let addedCount = 0;
        let skippedCount = 0;

        // Dedup bookmaker priority
        const preferredBookies = ["draftkings", "fanduel", "betmgm", "betrivers", "williamhill_us"];

        for (const game of allFetchedGames) {
            const bookie = game.bookmakers.find((b: { key: string }) => preferredBookies.includes(b.key)) || game.bookmakers[0];

            if (!bookie) {
                skippedCount++;
                continue;
            }

            for (const market of bookie.markets) {
                // Support H2H, Spreads, and Totals
                if (!['h2h', 'spreads', 'totals'].includes(market.key)) continue;

                const outcomes = market.outcomes;
                if (outcomes.length < 2) continue;

                // For simple markets, we take the first outcome as "YES" and its natural opposite as "NO" logic
                // In PropTok, every prop is a YES/NO.
                // For H2H: "Will Lakers win?" (Outcome: Lakers)
                // For Spreads: "Will Lakers cover -4.5?" (Outcome: Lakers)
                // For Totals: "Will it go Over 220.5?" (Outcome: Over)

                const primaryOutcome = outcomes[0];
                const secondaryOutcome = outcomes[1];

                const externalId = `${game.id}-${market.key}-${primaryOutcome.name}`.replace(/\s+/g, '-').toLowerCase();

                const category = sportCategoryMap[game.sport_key] || 'Sports';

                // Duplicate check
                const { data: existing } = await supabase
                    .from("predictions")
                    .select("id, category")
                    .eq("external_id", externalId)
                    .single();

                if (existing) {
                    // FIX: If existing game has generic 'Sports' category, update it to specific (e.g. 'NBA')
                    if (existing.category === 'Sports' && category !== 'Sports') {
                        await supabase
                            .from("predictions")
                            .update({ category, odds_source: bookie.title }) // Keep odds fresh too
                            .eq("id", existing.id);
                        logs.push(`UPDATED CATEGORY: ${externalId} -> ${category}`);
                    }
                    skippedCount++;
                    continue;
                }

                const question = this.generateQuestion(market.key, game, primaryOutcome);
                const yesMultiplier = this.decimalToMultiplier(primaryOutcome.price);
                const noMultiplier = this.decimalToMultiplier(secondaryOutcome.price);
                // category is already defined above

                const { error: insertError } = await supabase.from("predictions").insert({
                    question,
                    category,
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
