
const RAPID_API_KEY = process.env.RAPID_API_KEY || "67cd4cf762msh10e868e1591f6b4p10531ba0af1";
const TANK01_BASE_URL = "https://tank01-nba-live-in-game-real-time-statistics.p.rapidapi.com";

// Mapping of our internal prop types to Tank01 stats keys
const STAT_MAPPING: Record<string, string> = {
    'player_points': 'pts',
    'player_assists': 'ast',
    'player_rebounds': 'reb',
    'player_threes': 'tptfgm', // Three PM
    'player_blocks': 'blk',
    'player_steals': 'stl',
    'player_turnovers': 'TOV'
};

export const tank01Service = {
    // In-Memory Cache (Basic Request Scope / Short TTL)
    // Keys: "YYYY-MM-DD" -> { timestamp: number, data: any }
    _gamesCache: new Map<string, { ts: number, data: any }>(),
    // Keys: "GameID" -> { timestamp: number, data: any }
    _boxScoreCache: new Map<string, { ts: number, data: any }>(),

    // TTL in ms (e.g. 5 minutes - effectively static for a single cron run, but refreshes for next run)
    CACHE_TTL: 5 * 60 * 1000,

    async getNBABoxScore(gameId: string) {
        return null;
    },

    async getPlayerStats(playerName: string, team: string, gameDate: string) {
        // Cache Check for Games List
        const cacheKey = `games-${gameDate}`;
        const cached = this._gamesCache.get(cacheKey);
        let games = [];

        if (cached && (Date.now() - cached.ts < this.CACHE_TTL)) {
            games = cached.data;
        } else {
            // Correct endpoint: /getNBAGamesForDate
            const url = `${TANK01_BASE_URL}/getNBAGamesForDate?gameDate=${gameDate}`;
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'X-RapidAPI-Key': RAPID_API_KEY,
                        'X-RapidAPI-Host': 'tank01-nba-live-in-game-real-time-statistics.p.rapidapi.com'
                    }
                });

                if (!response.ok) {
                    console.error("Tank01 Error:", response.status, await response.text());
                    return null;
                }

                const data = await response.json();
                games = data.body || [];
                // Set Cache
                this._gamesCache.set(cacheKey, { ts: Date.now(), data: games });
            } catch (e) {
                console.error("Tank01 Exception:", e);
                return null;
            }
        }

        // Find the game involving this team
        // Note: Tank01 uses strict team abbreviations usually (LAL, BOS).
        // We might need a mapper or just search all games.

        for (const game of games) {
            // Fuzzy match team name if provided, OR if we don't know the team, we might need to search ALL games?
            // sports-service passes "" for team currently.
            // But we can search for the PLAYER in the box score of ALL games?
            // That would be expensive if we fetch box score for every game.
            // BUT wait, sports-service calls this per PROP.
            // It knows the "playerName".

            // Optimization: If we don't know the team, and we have multiple games,
            // we have to check them. But we should Cache the Box Scores!
            // If we check Game A for LeBron and he's not there, we Cache Game A Box Score (PlayerStats).
            // Next time we check Game A for Anthony Davis, we use Cache.

            // Check if game matches team (if provided), otherwise check all games?
            // Current code checks: if (game.home.includes(team) || game.away.includes(team))
            // But 'team' is empty string from sports-service!
            // So this loop runs for EVERY game?
            // If team is "", "".includes("") is true? No, includes("") is true.
            // So it enters for EVERY game.
            // And calls fetchBoxScoreDetails for EVERY game.
            // This is hugely inefficient if we have 10 games.

            // We should try to limit it. 
            // Parsing external_id gave us the GameID from The Odds API (e.g. "c7c2...").
            // We don't have the Tank01 Game ID.

            // However, we can try to match the teams from the prop?
            // We don't have team names easily in getPlayerStats args.

            // For now, Caching fetchBoxScoreDetails is the Critical Fix.
            // It will make the "Check every game" extremely cheap after the first hit.

            if (team && !(game.home.includes(team) || game.away.includes(team))) {
                continue;
            }
            // If team is empty, we proceed (Legacy behavior).

            const gameId = game.gameID;
            const result = await this.fetchBoxScoreDetails(gameId, playerName);
            if (result) return result;
        }

        return null; // Game not found
    },

    async fetchBoxScoreDetails(tankGameId: string, playerName: string) {
        // Cache Check
        const cacheKey = `box-${tankGameId}`;
        const cached = this._boxScoreCache.get(cacheKey);
        let stats = null;

        if (cached && (Date.now() - cached.ts < this.CACHE_TTL)) {
            stats = cached.data;
        } else {
            const url = `${TANK01_BASE_URL}/getNBABoxScore?gameID=${tankGameId}`;
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'X-RapidAPI-Key': RAPID_API_KEY,
                        'X-RapidAPI-Host': 'tank01-nba-live-in-game-real-time-statistics.p.rapidapi.com'
                    }
                });

                const json = await response.json();
                stats = json.body?.playerStats; // Check API structure

                // Set Cache (even if null, to avoid refetching bad games? Maybe not nulls)
                if (stats) {
                    this._boxScoreCache.set(cacheKey, { ts: Date.now(), data: stats });
                }
            } catch (e) {
                console.error("Box Score Fetch Error:", e);
                return null;
            }
        }

        // Tank01 usually returns { teamID: { playerID: { ...stats } } }
        // We need to iterate/search for player name

        if (!stats) return null;

        // Flatten players
        let targetPlayer = null;
        Object.values(stats).forEach((teamPlayers: any) => {
            Object.values(teamPlayers).forEach((p: any) => {
                // Simple name match: "LeBron James"
                // Tank01 might be "LeBron James" or "L. James"
                if (this.normalizeName(p.longName) === this.normalizeName(playerName)) {
                    targetPlayer = p;
                }
            });
        });

        return targetPlayer; // Returns { pts: "25", ast: "5", ... }
    },

    async getNBABettingOdds(gameDate: string) {
        // Endpoint: /getNBABettingOdds?gameDate=YYYY-MM-DD
        const url = `${TANK01_BASE_URL}/getNBABettingOdds?gameDate=${gameDate}&itemFormat=list`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPID_API_KEY,
                    'X-RapidAPI-Host': 'tank01-nba-live-in-game-real-time-statistics.p.rapidapi.com'
                }
            });

            if (!response.ok) {
                console.error("Tank01 Odds Error:", response.status);
                return null;
            }

            const json = await response.json();
            return json.body || []; // Returns list of games with odds
        } catch (e) {
            console.error("Tank01 Odds Exception:", e);
            return null;
        }
    },

    async getNFLBettingOdds(gameDate: string) {
        // Endpoint: /getNFLBettingOdds
        const url = `${TANK01_BASE_URL}/getNFLBettingOdds?gameDate=${gameDate}&itemFormat=list`;

        try {
            // Use NFL Host
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPID_API_KEY,
                    'X-RapidAPI-Host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
                }
            });

            if (!response.ok) return null;
            const json = await response.json();
            return json.body || [];
        } catch (e) {
            console.error("Tank01 NFL Odds Error:", e);
            return null;
        }
    },

    async getNFLTeamRoster(teamAbv: string) {
        // Endpoint: /getNFLTeamRoster?teamAbv=HOU
        const url = `${TANK01_BASE_URL}/getNFLTeamRoster?teamAbv=${teamAbv}&getStats=true`;
        return this._fetchRoster(url);
    },

    async getNBATeamRoster(teamAbv: string) {
        // Endpoint: /getNBATeamRoster?teamAbv=LAL
        const url = `${TANK01_BASE_URL}/getNBATeamRoster?teamAbv=${teamAbv}&statsToGet=averages`;
        return this._fetchRoster(url);
    },

    async _fetchRoster(url: string) {
        try {
            // Dynamic Host Switch
            let host = 'tank01-nba-live-in-game-real-time-statistics.p.rapidapi.com';
            if (url.includes('nfl')) {
                host = 'tank01-nfl-live-in-game-real-time-statistics.p.rapidapi.com';
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPID_API_KEY,
                    'X-RapidAPI-Host': host
                }
            });

            if (!response.ok) return null;
            const json = await response.json();
            return json.body?.roster || [];
        } catch (e) {
            console.warn("Tank01 Roster Fetch Failed:", e);
            return null;
        }
    },

    async getNBAScoreboard(gameDate: string) {
        // Use Cache if available (reuse getNBAGamesForDate cache)
        const cacheKey = `games-${gameDate}`;
        const cached = this._gamesCache.get(cacheKey);

        if (cached && (Date.now() - cached.ts < this.CACHE_TTL)) {
            return cached.data;
        }

        const url = `${TANK01_BASE_URL}/getNBAGamesForDate?gameDate=${gameDate}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPID_API_KEY,
                    'X-RapidAPI-Host': 'tank01-nba-live-in-game-real-time-statistics.p.rapidapi.com'
                }
            });

            if (!response.ok) return [];
            const json = await response.json();
            const games = json.body || [];

            // Cache it
            this._gamesCache.set(cacheKey, { ts: Date.now(), data: games });
            return games;
        } catch (e) {
            console.error("NBA Scoreboard Error:", e);
            return [];
        }
    },

    async getNFLScoreboard(gameDate: string) { // Date or Week? Date is safer for daily ticker
        // NFL Host
        const host = 'tank01-nfl-live-in-game-real-time-statistics.p.rapidapi.com';
        // Note: NFL endpoint might be getNFLGamesForDate 
        const url = `${TANK01_BASE_URL}/getNFLGamesForDate?gameDate=${gameDate}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPID_API_KEY,
                    'X-RapidAPI-Host': host
                }
            });

            if (!response.ok) return [];
            const json = await response.json();
            return json.body || [];
        } catch (e) {
            console.error("NFL Scoreboard Error:", e);
            return [];
        }
    },

    async getNHLScoreboard(gameDate: string) {
        // NHL Host
        const host = 'tank01-nhl-live-in-game-real-time-statistics-nhl.p.rapidapi.com';
        const url = `${TANK01_BASE_URL}/getNHLGamesForDate?gameDate=${gameDate}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPID_API_KEY,
                    'X-RapidAPI-Host': host
                }
            });

            if (!response.ok) return [];
            const json = await response.json();
            return json.body || [];
        } catch (e) {
            console.error("NHL Scoreboard Error:", e);
            return [];
        }
    },

    normalizeName(name: string) {
        return name.toLowerCase().replace(/[^a-z]/g, '');
    }
};
