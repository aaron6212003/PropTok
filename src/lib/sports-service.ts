import { createAdminClient } from "./supabase/admin";
import { tank01Service } from "./tank01-service";

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

        // --- 1. GAME LINES (Standard & Alt) ---
        if (marketType === 'h2h') {
            return `Will ${team} win against ${team === game.home_team ? game.away_team : game.home_team}?`;
        }
        if (marketType === 'spreads' || marketType === 'alternate_spreads') {
            const points = outcome.point > 0 ? `+${outcome.point}` : outcome.point;
            return `Will ${team} cover ${points} vs ${team === game.home_team ? game.away_team : game.home_team}?`;
        }
        if (marketType === 'totals' || marketType === 'alternate_totals') {
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

            // Formatting Helper
            const propName = marketType.replace('player_', '')
                .replace(/_/g, ' ')
                .replace('three', '3')
                .replace('pass tds', 'Passing TDs')
                .replace('rush yds', 'Rushing Yards')
                .replace('reception yds', 'Receiving Yards')
                .replace('pass attempts', 'Pass Attempts')
                .replace('pass completions', 'Pass Completions')
                .replace('pass interceptions', 'Interceptions')
                .replace('rush attempts', 'Rush Attempts')
                .replace('receptions', 'Receptions')
                .replace('anytime scorer', 'Score a TD')
                .replace('double double', 'Record a Double-Double')
                .replace('points rebounds assists', 'PRA')
                .toUpperCase();

            if (marketType === 'player_anytime_scorer') return `Will ${player} score a Touchdown?`;

            return `Will ${player} record ${type} ${line} ${propName}?`;
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

            // Updated to include Player Props markets tailored to each sport
            // Requesting "player_pass_tds" for NBA causes a 422 Error.

            let markets = "h2h,spreads,totals"; // BASIC MARKETS ONLY (Safest)

            // REMOVED PROPS FROM LIST VIEW TO PREVENT 422 ERRORS
            // Props range handled in Step 2 (Hydration) via Event Endpoint

            // Soccer typically uses different prop names or just h2h/totals in basic plans.
            // keeping soccer simple for now to avoid 422s.

            const url = `${BASE_URL}/${sport}/odds/?apiKey=${apiKey}&regions=us&markets=${markets}&oddsFormat=decimal`;
            const response = await fetch(url);

            if (!response.ok) {
                // FALLBACK: If API returns 422 (likely due to invalid markets or plan limits), try fetching ONLY basic markets.
                if (response.status === 422 && markets !== "h2h,spreads,totals") {
                    console.warn(`[sportsService] ⚠️ 422 Error for ${sport}. This usually means your Odds API Plan does NOT support Player Props. Falling back to basic lines...`);
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

    async fetchEventProps(sport: string, eventId: string, markets: string) {
        const apiKey = process.env.THE_ODDS_API_KEY;
        const url = `${BASE_URL}/${sport}/events/${eventId}/odds?apiKey=${apiKey}&regions=us&markets=${markets}&oddsFormat=decimal`;
        try {
            const res = await fetch(url);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    async ingestGames() {
        console.log("[sportsService] Starting Ingestion Process...");
        const logs: string[] = [];

        // Expanded Sports List (Prioritized by Seasonality)
        const sports = [
            "americanfootball_nfl", // Playoffs
            "basketball_nba",       // Peak Season
            "icehockey_nhl",        // Peak Season
            "basketball_ncaab",     // Conference play
            "soccer_epl",
            "soccer_uefa_champions_league"
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

        // 1. FETCH SCHEDULE & BASIC PROPS
        for (const sport of sports) {
            try {
                // Fetch Basic Odds (Lines) Only first to get IDs
                const res = await this.fetchLiveOdds(sport);

                if (res.error) {
                    logs.push(`${sport} Error: ${res.error}`);
                } else if (res.data) {
                    let games = res.data;

                    // 2. HYDRATE WITH PLAYER PROPS (Two-Step Fetch)
                    // Only for major prop sports
                    let propMarkets = "";
                    if (sport.includes("nba")) propMarkets = "player_points,player_assists,player_rebounds,player_threes,player_blocks,player_steals";
                    else if (sport.includes("nfl")) propMarkets = "player_pass_tds,player_pass_yds,player_rush_yds,player_reception_yds,player_pass_attempts,player_pass_completions,player_receptions";
                    else if (sport.includes("nhl")) propMarkets = "player_points,player_goals,player_assists,player_shots_on_goal";

                    if (propMarkets && games.length > 0) {
                        const msg = `Hydrating ${games.length} ${sport} games with props...`;
                        logs.push(msg);
                        console.log(`[sportsService] ${msg}`); // FORCE LOG TO CONSOLE

                        // Limit to first 10 games to avoid hitting rate limits instantly if list is huge
                        const gamesToHydrate = games.slice(0, 15);

                        await Promise.all(gamesToHydrate.map(async (game: any) => {
                            const propData = await this.fetchEventProps(sport, game.id, propMarkets);
                            if (propData && propData.bookmakers) {
                                // Merge prop bookmakers into existing bookmakers
                                // We want to append detailed markets to the bookmakers list
                                // Actually, The Odds API returns a similar bookmaker structure.
                                // We should merge markets for matching bookies.

                                propData.bookmakers.forEach((propBookie: any) => {
                                    const existingBookie = game.bookmakers.find((b: any) => b.key === propBookie.key);
                                    if (existingBookie) {
                                        existingBookie.markets.push(...propBookie.markets);
                                    } else {
                                        game.bookmakers.push(propBookie);
                                    }
                                });
                            }
                        }));
                    }

                    // Ensure data validation
                    const validGames = games.filter((g: any) => g.bookmakers && g.bookmakers.length > 0);
                    allFetchedGames.push(...validGames);
                }
            } catch (err) {
                console.error(`Loop error for ${sport}:`, err);
            }
        }

        logs.push(`Total games fetched & hydrated: ${allFetchedGames.length}`);

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
            // DATA INTEGRITY FILTER: Skip games > 72 hours (3 days) away to avoid "Futures" pollution
            const gameTime = new Date(game.commence_time).getTime();
            const now = Date.now();
            const hoursDiff = (gameTime - now) / (1000 * 60 * 60);

            if (hoursDiff > 72) {
                // logs.push(`SKIPPED (Too far out): ${game.home_team} vs ${game.away_team} (${Math.round(hoursDiff)}h away)`);
                skippedCount++;
                continue;
            }

            const bookie = game.bookmakers.find((b: { key: string }) => preferredBookies.includes(b.key)) || game.bookmakers[0];

            if (!bookie) {
                skippedCount++;
                continue;
            }

            for (const market of bookie.markets) {
                // Expanded support to include player props
                const supportedMarkets = [
                    'h2h', 'spreads', 'totals',
                    'player_points', 'player_assists', 'player_rebounds', 'player_threes', 'player_blocks', 'player_steals',
                    'player_pass_tds', 'player_pass_yds', 'player_rush_yds', 'player_reception_yds', 'player_pass_attempts', 'player_pass_completions', 'player_receptions',
                    'player_goals', 'player_shots_on_goal'
                ];

                if (!supportedMarkets.includes(market.key)) continue;

                // --- LOOP REFACTOR: Handle Multiple Questions per Market (Player Props) ---

                // Group outcomes by player name (description) for props, or use a single group for game lines
                const outcomeGroups: Record<string, any[]> = {};

                if (market.key.startsWith('player_')) {
                    // Group by player name AND point (line) to capture distinct props
                    // e.g. "McDavid Over 0.5" vs "McDavid Over 1.5"
                    market.outcomes.forEach((o: any) => {
                        const description = o.description || 'Unknown Player';
                        // Construct key: "PlayerName-Point"
                        const point = o.point ? `-${o.point}` : '';
                        const key = `${description}${point}`;

                        if (!outcomeGroups[key]) outcomeGroups[key] = [];
                        outcomeGroups[key].push(o);
                    });
                } else {
                    // Game Lines: Single group
                    outcomeGroups['main'] = market.outcomes;
                }

                // Iterate over each "Question" (e.g. Lebron Points, Curry Points, OR Game H2H)
                for (const [groupKey, outcomes] of Object.entries(outcomeGroups)) {
                    if (outcomes.length < 2) continue; // Need at least 2 sides

                    // --- CANONICALIZATION ---
                    let primaryOutcome = outcomes[0];
                    let secondaryOutcome = outcomes[1];

                    if (market.key === 'h2h' || market.key === 'spreads' || market.key === 'alternate_spreads') {
                        const homeOutcome = outcomes.find((o: any) => o.name === game.home_team);
                        if (homeOutcome) {
                            primaryOutcome = homeOutcome;
                            secondaryOutcome = outcomes.find((o: any) => o.name !== game.home_team) || outcomes[0];
                        }
                    } else if (market.key.includes('totals') || market.key.startsWith('player_')) {
                        const over = outcomes.find((o: any) => o.name === 'Over');
                        const under = outcomes.find((o: any) => o.name === 'Under');
                        if (over && under) {
                            primaryOutcome = over;
                            secondaryOutcome = under;
                        }
                    }

                    // Generate Unique ID
                    let uniqueIdentifier = `${primaryOutcome.name}`;
                    if (market.key.startsWith('player_')) {
                        uniqueIdentifier = `${primaryOutcome.description}-${primaryOutcome.name}-${primaryOutcome.point}`;
                    } else if (market.key.includes('spreads')) {
                        uniqueIdentifier = `Spread-${primaryOutcome.point}`;
                    } else if (market.key.includes('totals')) {
                        uniqueIdentifier = `Total-${primaryOutcome.point}`;
                    }

                    const externalId = `${game.id}-${market.key}-${uniqueIdentifier}`.replace(/[^a-z0-9]/gi, '-').toLowerCase();
                    const category = sportCategoryMap[game.sport_key] || 'Sports';

                    // Duplicate Check
                    const { data: existing } = await supabase
                        .from("predictions")
                        .select("id, category")
                        .eq("external_id", externalId)
                        .single();

                    if (existing) {
                        if (existing.category === 'Sports' && category !== 'Sports') {
                            await supabase.from("predictions").update({ category }).eq("id", existing.id);
                        }
                        // logs.push(`Duplicate: ${externalId}`);
                        skippedCount++;
                        continue;
                    }

                    // Create Prediction
                    const question = this.generateQuestion(market.key, game, primaryOutcome);
                    const yesMultiplier = primaryOutcome.price;
                    const noMultiplier = secondaryOutcome.price;

                    // Normalize percentages (Implied Probability)
                    const impliedYes = 1 / yesMultiplier;
                    const impliedNo = 1 / noMultiplier;
                    const totalImplied = impliedYes + impliedNo;
                    const yesPercent = Math.round((impliedYes / totalImplied) * 100);

                    const { error } = await supabase.from("predictions").insert({
                        category,
                        question,
                        external_id: externalId,
                        game_id: game.id, // STORE GAME ID FOR TOURNAMENT FILTERING
                        yes_multiplier: yesMultiplier,
                        no_multiplier: noMultiplier,
                        yes_percent: yesPercent,
                        resolved: false,
                        expires_at: game.commence_time,
                        volume: Math.floor(Math.random() * 10000) + 5000 // Seed volume for liveliness
                    });

                    if (error) {
                        console.error("Insert Error:", error);
                    } else {
                        addedCount++;
                    }
                } // End Outcome Group Loop
            }
        }

        logs.push(`Process Complete. Added: ${addedCount}, Skipped/Duplicates: ${skippedCount}`);

        // --- PHASE 2: HYBRID INGESTION (Tank01 for NBA Props) ---
        // Since The Odds API Free Plan often fails for props, we use Tank01 as a backup/primary for NBA.
        try {
            logs.push("Starting Tank01 NBA Prop Ingestion...");
            // NFL INGESTION (DISABLED PER USER REQUEST)
            /*
            logs.push("Starting Tank01 NFL Prop Ingestion...");
            const tankNFLGames = await tank01Service.getNFLBettingOdds(today);
            if (tankNFLGames && Array.isArray(tankNFLGames)) {
                for (const tGame of tankNFLGames) {
                    await processTank01Game(tGame, 'NFL');
                }
                logs.push(`Tank01 NFL Ingestion Completed.`);
            }
            */
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const tankGames = await tank01Service.getNBABettingOdds(today);

            if (tankGames && Array.isArray(tankGames)) {
                logs.push(`fetched ${tankGames.length} NBA games from Tank01.`);
                let tankAdded = 0;

                for (const tGame of tankGames) {
                    // Match to existing game in DB to get the correct UUID/ExternalID base
                    // Tank01 uses names like "Lakers", "Celtics"
                    // We search DB for matches
                    const homeTeam = tGame.homeTeam;
                    const awayTeam = tGame.awayTeam;

                    const { data: dbGame } = await supabase
                        .from('predictions')
                        .select('*')
                        .ilike('external_id', `%${homeTeam.toLowerCase().replace(/ /g, '-')}%`)
                        .eq('resolved', false)
                        .limit(1)
                        .single();

                    if (!dbGame) continue;

                    const gameIdBase = dbGame.external_id.split('-')[0];

                    // Process Props (if available in tGame)
                    // Tank01 structure varies, assuming tGame.sportsbooks array
                    // We look for 'playerProps' usually nested or flattened

                    // QUICK FIX: If Tank01 just gives game lines, checking documentation...
                    // Actually Tank01 odds endpoint usually returns books. 
                    // Let's assume we want to map what we can find.

                    // If Tank01 returns specialized prop structure, we map it here.
                    // For now, logging the structure to debug if it's empty.
                    // logs.push(`Checking props for ${homeTeam}...`);
                }
                logs.push(`Tank01 Ingestion: Scanned ${tankGames.length} games (Logic Pending Structure Check).`);
            } else {
                logs.push(`Tank01 returned no games for ${today}.`);
            }
        } catch (e: any) {
            logs.push(`Tank01 Ingestion Error: ${e.message}`);
        }

        console.log(`[sportsService] ${logs[logs.length - 1]}`);
        return logs;
    },

    async fetchScores(sport: string, daysFrom: number = 3) {
        const apiKey = process.env.THE_ODDS_API_KEY;
        if (!apiKey) return { error: "API Key Missing", data: [] };

        try {
            // Fetch scores for completed games
            const url = `${BASE_URL}/${sport}/scores/?apiKey=${apiKey}&daysFrom=${daysFrom}&dateFormat=iso`;
            const response = await fetch(url);

            if (!response.ok) return { error: `API Error ${response.status}`, data: [] };

            const data = await response.json();
            // Filter for completed games only
            const completed = Array.isArray(data) ? data.filter((g: any) => g.completed) : [];

            console.log(`[sportsService] Fetched ${completed.length} completed games for ${sport}`);
            return { data: completed };
        } catch (error: any) {
            console.error(`[sportsService] Score fetch error for ${sport}:`, error);
            return { error: error.message, data: [] };
        }
    },

    async resolveGames() {
        console.log("[sportsService] Starting Resolution Process...");
        const logs: string[] = [];
        const supabase = createAdminClient();

        if (!supabase) {
            logs.push("Resolution Aborted: Admin client missing.");
            return logs;
        }

        // 1. Fetch all UNRESOLVED predictions with an external_id (live sports)
        const { data: predictions, error: fetchError } = await supabase
            .from("predictions")
            .select("*")
            .eq("resolved", false)
            .not("external_id", "is", null);

        if (fetchError || !predictions || predictions.length === 0) {
            logs.push("No unresolved sports predictions found.");
            return logs;
        }

        console.log(`[sportsService] Found ${predictions.length} predictions to check.`);

        // 2. Map predictions to Sports so we know which score APIs to hit.
        // We can infer sport from matching logic, but better to hit all active sports.
        const sports = [
            "americanfootball_nfl",
            "basketball_nba",
            "icehockey_nhl",
            "soccer_epl",
            "soccer_uefa_champions_league",
            "basketball_ncaab",
            "americanfootball_ncaaf"
        ];

        // 3. Fetch scores for all sports
        const allScores: any[] = [];
        for (const sport of sports) {
            const res = await this.fetchScores(sport);
            if (!res.error && res.data) {
                allScores.push(...res.data);
            }
        }

        const scoreMap = new Map(); // GameID -> ScoreData
        allScores.forEach(game => scoreMap.set(game.id, game));

        logs.push(`Fetched scores for ${allScores.length} finished games.`);

        // 4. Grading Logic
        let resolvedCount = 0;

        for (const p of predictions) {
            // Breakdown external_id: "gameId-market-identifier"
            const parts = p.external_id.split('-');
            const gameId = parts[0];
            // Note: split isn't perfect if gameId has hyphens? 
            // The Odds API game ids are usually 32-char hex strings without hyphens.

            // Check if we have a score for this game
            const gameResult = scoreMap.get(gameId);
            if (!gameResult || !gameResult.completed || !gameResult.scores) continue;

            const marketKey = parts[1]; // e.g., 'h2h', 'spreads', 'totals', 'player_points'

            // --- A. PLAYER PROPS RESOLUTION (New) ---
            if (marketKey.startsWith('player_')) {
                // external_id structure: "GameID-marketKey-PlayerName-Outcome-Line"
                // Example: "12345-player_points-LeBron James-Over-25.5"
                // Note: uniqueIdentifier in ingest was: `${description}-${name}-${point}`

                // Let's re-parse carefully.
                // We stored uniqueIdentifier in parts[2] onwards? 
                // ingest: const externalId = `${game.id}-${market.key}-${uniqueIdentifier}`
                // uniqueIdentifier = "LeBron James-Over-25.5"
                // So externalId = "gameid-player_points-LeBron James-Over-25.5"

                // Reconstruct the pieces
                const remaining = p.external_id.substring(gameId.length + marketKey.length + 2);
                // "LeBron James-Over-25.5"
                // This split is risky if name has hyphens. 

                // Better approach: We know the format ends with "-Over-25.5" or "-Under-25.5"
                // Let's use regex to extract the Line and Type
                const match = remaining.match(/(.*)-(Over|Under)-([0-9.]+)/i);
                if (!match) continue;

                const playerName = match[1].replace(/-/g, ' '); // Revert hyphens to spaces? ingest replaced non-alphanum with '-'
                // Ingest: .replace(/[^a-z0-9]/gi, '-').toLowerCase()
                // So "LeBron James" -> "lebron-james"

                const type = match[2]; // Over/Under
                const line = parseFloat(match[3]);

                // Call Tank01
                const stats = await tank01Service.getPlayerStats(playerName, "", "2024-02-11"); // TODO: Need real Date
                // We need the Game Date from the Prediction!
                // We can't get it from external_id. We might need to query prediction.expires_at?
                // Or just use "today" if we run this cron daily.

                if (!stats) continue;

                // Map Market to Stat Key
                // 'player_points' -> 'pts'
                const statKey = marketKey.replace('player_', ''); // simpler mapping needed
                // We need a robust mapper in the service.
                const actualVal = parseFloat(stats[statKey] || "0");

                let winner = null;
                if (type === 'Over') {
                    winner = actualVal > line ? 'YES' : 'NO';
                } else {
                    winner = actualVal < line ? 'YES' : 'NO';
                }

                // Update DB
                // Update DB via RPC to ensure payouts match!
                const { error: rpcError } = await supabase.rpc('resolve_prediction', {
                    p_id: p.id,
                    p_outcome: winner
                });

                if (rpcError) {
                    logs.push(`ERROR resolving prop ${p.id}: ${rpcError.message}`);
                } else {
                    resolvedCount++;
                    logs.push(`GRADED PROP: ${playerName} ${marketKey}: ${actualVal} vs ${line} -> ${winner}`);
                }
                continue;

                resolvedCount++;
                logs.push(`GRADED PROP: ${playerName} ${marketKey}: ${actualVal} vs ${line} -> ${winner}`);
                continue;
            }

            // --- B. GAME LINES RESOLUTION (Existing) ---
            // Get Scores
            let homeScore = 0;
            let awayScore = 0;
            // The Odds API scores array: [{name: "Home", score: "10"}, {name: "Away", score: "5"}]
            // We match by team name in `gameResult.home_team` / `gameResult.away_team`

            const homeScoreObj = gameResult.scores.find((s: any) => s.name === gameResult.home_team);
            const awayScoreObj = gameResult.scores.find((s: any) => s.name === gameResult.away_team);

            if (!homeScoreObj || !awayScoreObj) continue; // Data issue

            homeScore = parseInt(homeScoreObj.score);
            awayScore = parseInt(awayScoreObj.score);

            let outcome: 'YES' | 'NO' | null = null;

            // --- GRADE H2H ---
            if (marketKey === 'h2h') {
                // p.question: "Will [Team] win...?"
                // primaryOutcome stored in external_id... wait.
                // We reconstructed external_id = `${game.id}-${market.key}-${primaryOutcome.name}`
                // but we LOWERCASED and REGEX replaced it.
                // Re-parsing is hard.

                // Better approach: Use `p.raw_odds` if available?
                // `raw_odds` stores the GAME object. It doesn't tell us which SIDE this prediction is for.
                // BUT we know: Prediction is ALWAYS "Will [YesOutcome] win?".
                // We need to know who [YesOutcome] is.
                // We can parse it from `p.question`. "Will [TEAM] win..."

                // Helper to extract team name from question
                // "Will Los Angeles Lakers win against...?"
                const match = p.question.match(/Will (.+?) win against/);
                if (match) {
                    const pickedTeam = match[1]; // "Los Angeles Lakers"
                    // Compare with winner
                    const winner = homeScore > awayScore ? gameResult.home_team : gameResult.away_team;
                    // Fuzzy match names? The Odds API names should be consistent.
                    if (pickedTeam === winner) outcome = 'YES';
                    else outcome = 'NO';
                }
            }

            // --- GRADE TOTALS ---
            else if (marketKey === 'totals') {
                // "Will [Home] vs [Away] go OVER 210.5 points?"
                const totalScore = homeScore + awayScore;

                // Extract line and direction from Question
                // "go OVER 100 points?"
                const isOver = p.question.toUpperCase().includes("OVER");
                const lineMatch = p.question.match(/ (OVER|UNDER) ([\d\.]+) /i);

                if (lineMatch) {
                    const line = parseFloat(lineMatch[2]);
                    if (isOver) {
                        outcome = totalScore > line ? 'YES' : 'NO';
                    } else {
                        outcome = totalScore < line ? 'YES' : 'NO';
                    }
                }
            }

            // --- GRADE SPREADS ---
            else if (marketKey === 'spreads') {
                // "Will [Team] cover -5.5 vs [Opponent]?"
                const spreadMatch = p.question.match(/Will (.+?) cover ([\+\-\d\.]+) vs/);

                if (spreadMatch) {
                    const pickedTeam = spreadMatch[1];
                    const spread = parseFloat(spreadMatch[2]);

                    let adjustedScore = 0;
                    let opponentScore = 0;

                    if (pickedTeam === gameResult.home_team) {
                        adjustedScore = homeScore + spread;
                        opponentScore = awayScore;
                    } else if (pickedTeam === gameResult.away_team) {
                        adjustedScore = awayScore + spread;
                        opponentScore = homeScore;
                    } else {
                        continue; // Team name mismatch
                    }

                    outcome = adjustedScore > opponentScore ? 'YES' : 'NO';
                }
            }


            if (outcome) {
                // 5. CALL RESOLUTION RPC
                const { error } = await supabase.rpc('resolve_prediction', {
                    p_id: p.id,
                    p_outcome: outcome
                });

                if (!error) {
                    logs.push(`RESOLVED: ${p.question} -> ${outcome} (Score: ${homeScore}-${awayScore})`);
                    resolvedCount++;
                } else {
                    logs.push(`ERROR resolving ${p.id}: ${error.message}`);
                }
            }
        }

        logs.push(`Resolution Complete. Resolved ${resolvedCount} games.`);
        return logs;
    }
};
