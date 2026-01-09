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
                price: number; // Decimal odds from API usually
                point?: number;
            }>;
        }>;
    }>;
}

export const sportsService = {
    /**
     * Convert American Odds to PropTok Multipliers
     * The Odds API usually returns decimals by default, but let's be safe.
     */
    decimalToMultiplier(decimal: number): number {
        // PropTok takes a tiny 5% vig on the multiplier for platform stability if we want
        // but for now let's just use the direct sportsbook multiplier
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

    /**
     * Map a market outcome to a PropTok Question
     */
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

    /**
     * Ingest live games from the API
     */
    async fetchLiveOdds(sport: string = "americanfootball_nfl") {
        if (!ODDS_API_KEY) {
            console.warn("THE_ODDS_API_KEY is missing. Ingestion skipped.");
            return [];
        }

        try {
            const url = `${BASE_URL}/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal`;
            const response = await fetch(url);
            const data: SportsMarket[] = await response.json();

            if (!Array.isArray(data)) {
                console.error("The Odds API error:", data);
                return [];
            }

            return data;
        } catch (error) {
            console.error("Failed to fetch sports odds:", error);
            return [];
        }
    },

    async ingestGames() {
        // Fetch both NFL and NBA to ensure we have data
        const nflGames = await this.fetchLiveOdds("americanfootball_nfl");
        const nbaGames = await this.fetchLiveOdds("basketball_nba");
        const games = [...nflGames, ...nbaGames];

        const supabase = createAdminClient();
        if (!supabase) {
            console.error("Sports Ingestion Failed: Could not create admin client");
            return [];
        }
        const results = [];

        for (const game of games) {
            // Find the best bookmaker (usually DraftKings or FanDuel for US)
            const bookie = game.bookmakers.find(b => ["draftkings", "fanduel", "betmgm"].includes(b.key)) || game.bookmakers[0];
            if (!bookie) continue;

            for (const market of bookie.markets) {
                // Focus on primary outcomes for YES/NO translation
                // For spreads/totals, outcomes[0] is typically 'Over' or 'Team1'
                // We'll create a prediction for each major outcome where appropriate.

                // For MVP: Let's just do Spreads and Totals as they map best to PropTok questions
                if (market.key === 'h2h') continue; // Moneyline is simpler, but let's stick to spreads for now

                const outcome = market.outcomes[0];
                const oppositeOutcome = market.outcomes[1];
                if (!outcome || !oppositeOutcome) continue;

                const externalId = `${game.id}-${market.key}-${outcome.name}`;

                // Check if already exists
                const { data: existing } = await supabase
                    .from("predictions")
                    .select("id")
                    .eq("external_id", externalId)
                    .single();

                if (existing) continue;

                const question = this.generateQuestion(market.key, game, outcome);
                const yesMultiplier = this.decimalToMultiplier(outcome.price);
                const noMultiplier = this.decimalToMultiplier(oppositeOutcome.price);

                const { error } = await supabase.from("predictions").insert({
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

                if (!error) {
                    results.push(question);
                } else {
                    console.error("Ingestion insert error:", error);
                }
            }
        }

        return results;
    }
};
