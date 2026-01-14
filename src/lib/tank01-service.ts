
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
    async getNBABoxScore(gameId: string) {
        // Tank01 GameID might format differently. 
        // For now, let's assume we search by game date/team or just try to match the names.
        // Actually best way: Get Games for Date -> Find Match -> Get Stats.

        // Simpler for v1: We need to know the Tank01 GameID.
        // But we don't have it linked to The Odds API ID.
        // Strategy: Fetch "Games for Date", fuzzy match teams, then get stats.
        return null;
    },

    async getPlayerStats(playerName: string, team: string, gameDate: string) {
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
            const games = data.body || [];

            // Find the game involving this team
            // Note: Tank01 uses strict team abbreviations usually (LAL, BOS).
            // We might need a mapper or just search all games.

            for (const game of games) {
                if (game.home.includes(team) || game.away.includes(team)) {
                    // Found the game. Now find the player in the box score.
                    // Note: 'getNBAGamesForDate' might not have full stats. 
                    // Usually need 'getNBABoxScore' with gameID.

                    const gameId = game.gameID;
                    return await this.fetchBoxScoreDetails(gameId, playerName);
                }
            }

            return null; // Game not found
        } catch (e) {
            console.error("Tank01 Exception:", e);
            return null;
        }
    },

    async fetchBoxScoreDetails(tankGameId: string, playerName: string) {
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
            const stats = json.body?.playerStats; // Check API structure

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

        } catch (e) {
            console.error("Box Score Fetch Error:", e);
            return null;
        }
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

    normalizeName(name: string) {
        return name.toLowerCase().replace(/[^a-z]/g, '');
    }
};
