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

        // --- 1. GAME LINES ---
        if (marketType === 'h2h') {
            return `Will ${team} win against ${team === game.home_team ? game.away_team : game.home_team}?`;
        }
        if (marketType === 'spreads') {
            const points = outcome.point > 0 ? `+${outcome.point}` : outcome.point;
            return `Will ${team} cover ${points} vs ${team === game.home_team ? game.away_team : game.home_team}?`;
        }
        if (marketType === 'totals') {
            // Outcome name is usually 'Over' or 'Under'
            return `Will ${game.home_team} vs ${game.away_team} go ${outcome.name.toUpperCase()} ${outcome.point} points?`;
        }

        // --- 2. PLAYER PROPS ---
        // Format: "Over 25.5" or "Under 25.5"
        // The API returns outcome.name as "Over" or "Under", and description as "LeBron James"
        if (marketType.startsWith('player_')) {
            const player = outcome.description; // API provides player name here
            const line = outcome.point;
            const type = outcome.name; // "Over" or "Under"

            if (!player) return `Will ${team} win?`; // Fallback

            switch (marketType) {
                case 'player_points':
                    return `Will ${player} score ${type} ${line} Points?`;
                case 'player_assists':
                    return `Will ${player} record ${type} ${line} Assists?`;
                case 'player_rebounds':
                    return `Will ${player} grab ${type} ${line} Rebounds?`;
                case 'player_threes':
                    return `Will ${player} make ${type} ${line} Three-Pointers?`;
                case 'player_pass_tds':
                    return `Will ${player} throw ${type} ${line} Touchdowns?`;
                case 'player_rush_yds':
                    return `Will ${player} rush for ${type} ${line} Yards?`;
                case 'player_reception_yds':
                    return `Will ${player} have ${type} ${line} Receiving Yards?`;
                case 'player_anytime_scorer':
                    return `Will ${player} score a Touchdown anytime?`;
                default:
                    return `Will ${player} hit ${type} ${line} in ${marketType.replace('player_', '')}?`;
            }
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
            // Updated to include Player Props markets tailored to each sport
            // Requesting "player_pass_tds" for NBA causes a 422 Error.

            let markets = "h2h,spreads,totals"; // Defaults

            if (sport.includes("basketball_nba")) {
                markets += ",player_points,player_assists,player_rebounds,player_threes";
            } else if (sport.includes("americanfootball_nfl")) {
                markets += ",player_pass_tds,player_rush_yds,player_reception_yds,player_anytime_scorer";
            } else if (sport.includes("icehockey_nhl")) {
                markets += ",player_points,player_assists"; // NHL "points" = goals + assists
            }
            // Soccer typically uses different prop names or just h2h/totals in basic plans.
            // keeping soccer simple for now to avoid 422s.

            const url = `${BASE_URL}/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=${markets}&oddsFormat=decimal`;
            const response = await fetch(url);

            if (!response.ok) {
                // FALLBACK: If API returns 422 (likely due to invalid markets or plan limits), try fetching ONLY basic markets.
                if (response.status === 422 && markets !== "h2h,spreads,totals") {
                    console.warn(`[sportsService] 422 Error for ${sport} (Likely Props restricted). Retrying with basic markets...`);
                    const fallbackUrl = `${BASE_URL}/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal`;
                    const fallbackResponse = await fetch(fallbackUrl);

                    if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        console.log(`[sportsService] Fallback successful for ${sport}: Received ${Array.isArray(fallbackData) ? fallbackData.length : 0} events.`);
                        return { data: fallbackData };
                    }
                }

                const errorData = await response.json().catch(() => ({}));
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
            "soccer_uefa_champions_league",
            "basketball_ncaab",
            "americanfootball_ncaaf"
        ];

        const sportCategoryMap: Record<string, string> = {
            "americanfootball_nfl": "NFL",
            "basketball_nba": "NBA",
            "icehockey_nhl": "NHL",
            "soccer_epl": "Soccer",
            "soccer_uefa_champions_league": "Soccer",
            "basketball_ncaab": "NCAAB",
            "americanfootball_ncaaf": "NCAAF"
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
                // Expanded support to include player props
                const supportedMarkets = [
                    'h2h', 'spreads', 'totals',
                    'player_points', 'player_assists', 'player_rebounds', 'player_threes',
                    'player_pass_tds', 'player_rush_yds', 'player_reception_yds'
                ];

                if (!supportedMarkets.includes(market.key)) continue;

                const outcomes = market.outcomes;
                if (outcomes.length < 2) continue;

                // For simple markets, we take the first outcome as "YES" and its natural opposite as "NO" logic
                const primaryOutcome = outcomes[0];
                const secondaryOutcome = outcomes[1];

                // Ensure unique ID includes player name for props
                // For Game Lines: "id-h2h-Lakers"
                // For Player Props: "id-player_points-LeBron James-Over-25.5"
                let uniqueIdentifier = `${primaryOutcome.name}`;
                if (market.key.startsWith('player_')) {
                    uniqueIdentifier = `${primaryOutcome.description}-${primaryOutcome.name}-${primaryOutcome.point}`;
                }

                const externalId = `${game.id}-${market.key}-${uniqueIdentifier}`.replace(/[^a-z0-9]/gi, '-').toLowerCase();

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
