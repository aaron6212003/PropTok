/**
 * Team Logo Utility
 * Maps team names to official logo URLs for NFL, NHL, NBA, and potentially more.
 */

const TEAM_LOGOS: Record<string, string> = {
    // NFL
    "Arizona Cardinals": "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png",
    "Atlanta Falcons": "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png",
    "Baltimore Ravens": "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png",
    "Buffalo Bills": "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png",
    "Carolina Panthers": "https://a.espncdn.com/i/teamlogos/nfl/500/car.png",
    "Chicago Bears": "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png",
    "Cincinnati Bengals": "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png",
    "Cleveland Browns": "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png",
    "Dallas Cowboys": "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
    "Denver Broncos": "https://a.espncdn.com/i/teamlogos/nfl/500/den.png",
    "Detroit Lions": "https://a.espncdn.com/i/teamlogos/nfl/500/det.png",
    "Green Bay Packers": "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png",
    "Houston Texans": "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png",
    "Indianapolis Colts": "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png",
    "Jacksonville Jaguars": "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png",
    "Kansas City Chiefs": "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png",
    "Las Vegas Raiders": "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png",
    "Los Angeles Chargers": "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png",
    "Los Angeles Rams": "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png",
    "Miami Dolphins": "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png",
    "Minnesota Vikings": "https://a.espncdn.com/i/teamlogos/nfl/500/min.png",
    "New England Patriots": "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png",
    "New Orleans Saints": "https://a.espncdn.com/i/teamlogos/nfl/500/no.png",
    "New York Giants": "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png",
    "New York Jets": "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png",
    "Philadelphia Eagles": "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png",
    "Pittsburgh Steelers": "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
    "San Francisco 49ers": "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png",
    "Seattle Seahawks": "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png",
    "Tampa Bay Buccaneers": "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png",
    "Tennessee Titans": "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png",
    "Washington Commanders": "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png",

    // NHL
    "Anaheim Ducks": "https://a.espncdn.com/i/teamlogos/nhl/500/ana.png",
    "Arizona Coyotes": "https://a.espncdn.com/i/teamlogos/nhl/500/ari.png",
    "Boston Bruins": "https://a.espncdn.com/i/teamlogos/nhl/500/bos.png",
    "Buffalo Sabres": "https://a.espncdn.com/i/teamlogos/nhl/500/buf.png",
    "Calgary Flames": "https://a.espncdn.com/i/teamlogos/nhl/500/cgy.png",
    "Carolina Hurricanes": "https://a.espncdn.com/i/teamlogos/nhl/500/car.png",
    "Chicago Blackhawks": "https://a.espncdn.com/i/teamlogos/nhl/500/chi.png",
    "Colorado Avalanche": "https://a.espncdn.com/i/teamlogos/nhl/500/col.png",
    "Columbus Blue Jackets": "https://a.espncdn.com/i/teamlogos/nhl/500/cbj.png",
    "Dallas Stars": "https://a.espncdn.com/i/teamlogos/nhl/500/dal.png",
    "Detroit Red Wings": "https://a.espncdn.com/i/teamlogos/nhl/500/det.png",
    "Edmonton Oilers": "https://a.espncdn.com/i/teamlogos/nhl/500/edm.png",
    "Florida Panthers": "https://a.espncdn.com/i/teamlogos/nhl/500/fla.png",
    "Los Angeles Kings": "https://a.espncdn.com/i/teamlogos/nhl/500/lak.png",
    "Minnesota Wild": "https://a.espncdn.com/i/teamlogos/nhl/500/min.png",
    "Montreal Canadiens": "https://a.espncdn.com/i/teamlogos/nhl/500/mtl.png",
    "Nashville Predators": "https://a.espncdn.com/i/teamlogos/nhl/500/nsh.png",
    "New Jersey Devils": "https://a.espncdn.com/i/teamlogos/nhl/500/nj.png",
    "New York Islanders": "https://a.espncdn.com/i/teamlogos/nhl/500/nyi.png",
    "New York Rangers": "https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png",
    "Ottawa Senators": "https://a.espncdn.com/i/teamlogos/nhl/500/ott.png",
    "Philadelphia Flyers": "https://a.espncdn.com/i/teamlogos/nhl/500/phi.png",
    "Pittsburgh Penguins": "https://a.espncdn.com/i/teamlogos/nhl/500/pit.png",
    "San Jose Sharks": "https://a.espncdn.com/i/teamlogos/nhl/500/sj.png",
    "Seattle Kraken": "https://a.espncdn.com/i/teamlogos/nhl/500/sea.png",
    "St Louis Blues": "https://a.espncdn.com/i/teamlogos/nhl/500/stl.png",
    "Tampa Bay Lightning": "https://a.espncdn.com/i/teamlogos/nhl/500/tb.png",
    "Toronto Maple Leafs": "https://a.espncdn.com/i/teamlogos/nhl/500/tor.png",
    "Vancouver Canucks": "https://a.espncdn.com/i/teamlogos/nhl/500/van.png",
    "Vegas Golden Knights": "https://a.espncdn.com/i/teamlogos/nhl/500/vgk.png",
    "Washington Capitals": "https://a.espncdn.com/i/teamlogos/nhl/500/wsh.png",
    "Winnipeg Jets": "https://a.espncdn.com/i/teamlogos/nhl/500/wpg.png",

    // NBA
    "Atlanta Hawks": "https://a.espncdn.com/i/teamlogos/nba/500/atl.png",
    "Boston Celtics": "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
    "Brooklyn Nets": "https://a.espncdn.com/i/teamlogos/nba/500/bkn.png",
    "Charlotte Hornets": "https://a.espncdn.com/i/teamlogos/nba/500/cha.png",
    "Chicago Bulls": "https://a.espncdn.com/i/teamlogos/nba/500/chi.png",
    "Cleveland Cavaliers": "https://a.espncdn.com/i/teamlogos/nba/500/cle.png",
    "Dallas Mavericks": "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
    "Denver Nuggets": "https://a.espncdn.com/i/teamlogos/nba/500/den.png",
    "Detroit Pistons": "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
    "Golden State Warriors": "https://a.espncdn.com/i/teamlogos/nba/500/gs.png",
    "Houston Rockets": "https://a.espncdn.com/i/teamlogos/nba/500/hou.png",
    "Indiana Pacers": "https://a.espncdn.com/i/teamlogos/nba/500/ind.png",
    "LA Clippers": "https://a.espncdn.com/i/teamlogos/nba/500/lac.png",
    "Los Angeles Lakers": "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
    "Memphis Grizzlies": "https://a.espncdn.com/i/teamlogos/nba/500/mem.png",
    "Miami Heat": "https://a.espncdn.com/i/teamlogos/nba/500/mia.png",
    "Milwaukee Bucks": "https://a.espncdn.com/i/teamlogos/nba/500/mil.png",
    "Minnesota Timberwolves": "https://a.espncdn.com/i/teamlogos/nba/500/min.png",
    "New Orleans Pelicans": "https://a.espncdn.com/i/teamlogos/nba/500/no.png",
    "New York Knicks": "https://a.espncdn.com/i/teamlogos/nba/500/ny.png",
    "Oklahoma City Thunder": "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
    "Orlando Magic": "https://a.espncdn.com/i/teamlogos/nba/500/orl.png",
    "Philadelphia 76ers": "https://a.espncdn.com/i/teamlogos/nba/500/phi.png",
    "Phoenix Suns": "https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
    "Portland Trail Blazers": "https://a.espncdn.com/i/teamlogos/nba/500/por.png",
    "Sacramento Kings": "https://a.espncdn.com/i/teamlogos/nba/500/sac.png",
    "San Antonio Spurs": "https://a.espncdn.com/i/teamlogos/nba/500/sas.png",
    "Toronto Raptors": "https://a.espncdn.com/i/teamlogos/nba/500/tor.png",
    "Utah Jazz": "https://a.espncdn.com/i/teamlogos/nba/500/uta.png",
    "Washington Wizards": "https://a.espncdn.com/i/teamlogos/nba/500/was.png",

    // Common nicknames/shorthand
    "Texans": "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png",
    "Steelers": "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png",
    "Red Wings": "https://a.espncdn.com/i/teamlogos/nhl/500/det.png",
    "Hurricanes": "https://a.espncdn.com/i/teamlogos/nhl/500/car.png",
    "Lakers": "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
    "Warriors": "https://a.espncdn.com/i/teamlogos/nba/500/gs.png",
    "Knicks": "https://a.espncdn.com/i/teamlogos/nba/500/ny.png",
};


// Map of Team Name -> Primary Color Hex
export const TEAM_COLORS: Record<string, string> = {
    // NFL
    "Arizona Cardinals": "#97233F",
    "Atlanta Falcons": "#A71930",
    "Baltimore Ravens": "#241773",
    "Buffalo Bills": "#00338D",
    "Carolina Panthers": "#0085CA",
    "Chicago Bears": "#0B162A",
    "Cincinnati Bengals": "#FB4F14",
    "Cleveland Browns": "#311D00",
    "Dallas Cowboys": "#003594",
    "Denver Broncos": "#FB4F14",
    "Detroit Lions": "#0076B6",
    "Green Bay Packers": "#203731",
    "Houston Texans": "#03202F",
    "Indianapolis Colts": "#002C5F",
    "Jacksonville Jaguars": "#006778",
    "Kansas City Chiefs": "#E31837",
    "Las Vegas Raiders": "#000000",
    "Los Angeles Chargers": "#0080C6",
    "Los Angeles Rams": "#003594",
    "Miami Dolphins": "#008E97",
    "Minnesota Vikings": "#4F2683",
    "New England Patriots": "#002244",
    "New Orleans Saints": "#D3BC8D",
    "New York Giants": "#0B2265",
    "New York Jets": "#125740",
    "Philadelphia Eagles": "#004C54",
    "Pittsburgh Steelers": "#FFB612",
    "San Francisco 49ers": "#AA0000",
    "Seattle Seahawks": "#002244",
    "Tampa Bay Buccaneers": "#D50A0A",
    "Tennessee Titans": "#0C2340",
    "Washington Commanders": "#5A1414",

    // NBA (Selected)
    "Boston Celtics": "#007A33",
    "Brooklyn Nets": "#000000",
    "New York Knicks": "#F58426",
    "Philadelphia 76ers": "#006BB6",
    "Toronto Raptors": "#CE1141",
    "Golden State Warriors": "#1D428A",
    "Los Angeles Lakers": "#552583",
    "Phoenix Suns": "#1D428A",
    "Chicago Bulls": "#CE1141",
    "Cleveland Cavaliers": "#860038",
    "Detroit Pistons": "#C8102E",
    "Indiana Pacers": "#002D62",
    "Milwaukee Bucks": "#00471B",
    "Atlanta Hawks": "#E03A3E",
    "Charlotte Hornets": "#1D1160",
    "Miami Heat": "#98002E",
    "Orlando Magic": "#0077C0",
    "Washington Wizards": "#002B5C",
    "Denver Nuggets": "#0E2240",
    "Minnesota Timberwolves": "#0C2340",
    "Oklahoma City Thunder": "#007AC1",
    "Portland Trail Blazers": "#E03A3E",
    "Utah Jazz": "#002B5C",
    "Dallas Mavericks": "#00538C",
    "Houston Rockets": "#CE1141",
    "Memphis Grizzlies": "#5D76A9",
    "New Orleans Pelicans": "#0C2340",
    "San Antonio Spurs": "#C4CED4",
    "Sacramento Kings": "#5A2D81",
    "LA Clippers": "#C8102E",
};

// Expanded Nickname Mapping to Full Name Keys for Logo/Color Lookup
const NICKNAME_MAP: Record<string, string> = {
    "Cardinals": "Arizona Cardinals",
    "Falcons": "Atlanta Falcons",
    "Ravens": "Baltimore Ravens",
    "Bills": "Buffalo Bills",
    "Panthers": "Carolina Panthers",
    "Bears": "Chicago Bears",
    "Bengals": "Cincinnati Bengals",
    "Browns": "Cleveland Browns",
    "Cowboys": "Dallas Cowboys",
    "Broncos": "Denver Broncos",
    "Lions": "Detroit Lions",
    "Packers": "Green Bay Packers",
    "Texans": "Houston Texans",
    "Colts": "Indianapolis Colts",
    "Jaguars": "Jacksonville Jaguars",
    "Chiefs": "Kansas City Chiefs",
    "Raiders": "Las Vegas Raiders",
    "Chargers": "Los Angeles Chargers",
    "Rams": "Los Angeles Rams",
    "Dolphins": "Miami Dolphins",
    "Vikings": "Minnesota Vikings",
    "Patriots": "New England Patriots",
    "Saints": "New Orleans Saints",
    "Giants": "New York Giants",
    "Jets": "New York Jets",
    "Eagles": "Philadelphia Eagles",
    "Steelers": "Pittsburgh Steelers",
    "49ers": "San Francisco 49ers",
    "Seahawks": "Seattle Seahawks",
    "Buccaneers": "Tampa Bay Buccaneers",
    "Titans": "Tennessee Titans",
    "Commanders": "Washington Commanders",
    "Celtics": "Boston Celtics",
    "Nets": "Brooklyn Nets",
    "Knicks": "New York Knicks",
    "76ers": "Philadelphia 76ers",
    "Raptors": "Toronto Raptors",
    "Warriors": "Golden State Warriors",
    "Lakers": "Los Angeles Lakers",
    "Suns": "Phoenix Suns",
    "Bulls": "Chicago Bulls",
    "Cavaliers": "Cleveland Cavaliers",
    "Pistons": "Detroit Pistons",
    "Pacers": "Indiana Pacers",
    "Bucks": "Milwaukee Bucks",
    "Hawks": "Atlanta Hawks",
    "Hornets": "Charlotte Hornets",
    "Heat": "Miami Heat",
    "Magic": "Orlando Magic",
    "Wizards": "Washington Wizards",
    "Nuggets": "Denver Nuggets",
    "Timberwolves": "Minnesota Timberwolves",
    "Thunder": "Oklahoma City Thunder",
    "Blazers": "Portland Trail Blazers",
    "Jazz": "Utah Jazz",
    "Mavericks": "Dallas Mavericks",
    "Rockets": "Houston Rockets",
    "Grizzlies": "Memphis Grizzlies",
    "Pelicans": "New Orleans Pelicans",
    "Spurs": "San Antonio Spurs",
    "Kings": "Sacramento Kings",
    "Clippers": "LA Clippers"
};

// League Mapping for Strict Filtering
const LEAGUE_TEAMS: Record<string, string[]> = {
    'NFL': [
        "Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills", "Carolina Panthers", "Chicago Bears",
        "Cincinnati Bengals", "Cleveland Browns", "Dallas Cowboys", "Denver Broncos", "Detroit Lions", "Green Bay Packers",
        "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Kansas City Chiefs", "Las Vegas Raiders",
        "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins", "Minnesota Vikings", "New England Patriots",
        "New Orleans Saints", "New York Giants", "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers",
        "San Francisco 49ers", "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders"
    ],
    'NBA': [
        "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets", "Chicago Bulls", "Cleveland Cavaliers",
        "Dallas Mavericks", "Denver Nuggets", "Detroit Pistons", "Golden State Warriors", "Houston Rockets", "Indiana Pacers",
        "LA Clippers", "Los Angeles Lakers", "Memphis Grizzlies", "Miami Heat", "Milwaukee Bucks", "Minnesota Timberwolves",
        "New Orleans Pelicans", "New York Knicks", "Oklahoma City Thunder", "Orlando Magic", "Philadelphia 76ers",
        "Phoenix Suns", "Portland Trail Blazers", "Sacramento Kings", "San Antonio Spurs", "Toronto Raptors", "Utah Jazz",
        "Washington Wizards"
    ],
    'NHL': [
        "Anaheim Ducks", "Arizona Coyotes", "Boston Bruins", "Buffalo Sabres", "Calgary Flames", "Carolina Hurricanes",
        "Chicago Blackhawks", "Colorado Avalanche", "Columbus Blue Jackets", "Dallas Stars", "Detroit Red Wings",
        "Edmonton Oilers", "Florida Panthers", "Los Angeles Kings", "Minnesota Wild", "Montreal Canadiens",
        "Nashville Predators", "New Jersey Devils", "New York Islanders", "New York Rangers", "Ottawa Senators",
        "Philadelphia Flyers", "Pittsburgh Penguins", "San Jose Sharks", "Seattle Kraken", "St Louis Blues",
        "Tampa Bay Lightning", "Toronto Maple Leafs", "Vancouver Canucks", "Vegas Golden Knights", "Washington Capitals",
        "Winnipeg Jets"
    ]
};

/**
 * Extracts team logos and colors from a question string.
 * Example: "Will Detroit Red Wings win against Carolina Hurricanes?"
 * Returns an array of objects linking logo and color.
 * 
 * @param question The full question text to search
 * @param category Optional category to enforce strict league matching (e.g. 'NFL', 'NCAAB')
 */
export function getTeamLogos(question: string, category?: string): { url: string, color: string, name: string }[] {
    if (!question) return [];

    const found: { url: string, color: string, name: string }[] = [];
    const cleanText = question.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Determine allowed leagues based on category
    // If category is NCAAB/NCAAF, we currently HAVE NO LOGOS, so we should return empty to avoid mismatch.
    let allowedLeagues: string[] = ['NFL', 'NBA', 'NHL']; // Default to all if no category

    if (category) {
        if (category === 'NCAAB' || category === 'NCAAF') {
            // We do not have college logos yet. 
            // Return empty to prevent "Mercer Bears" matching "Chicago Bears"
            return [];
        }
        if (category === 'NFL') allowedLeagues = ['NFL'];
        if (category === 'NBA') allowedLeagues = ['NBA'];
        if (category === 'NHL') allowedLeagues = ['NHL'];
    }

    // Flatten allowed teams for quick lookup
    const allowedTeams = new Set<string>();
    for (const league of allowedLeagues) {
        LEAGUE_TEAMS[league]?.forEach(t => allowedTeams.add(t));
    }

    // 1. Check Full Names
    const teamNames = Object.keys(TEAM_LOGOS).filter(t => allowedTeams.has(t)).sort((a, b) => b.length - a.length);
    for (const team of teamNames) {
        const cleanTeam = team.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanText.includes(cleanTeam)) {
            found.push({
                url: TEAM_LOGOS[team],
                color: TEAM_COLORS[team] || '#ffffff',
                name: team
            });
            if (found.length >= 2) break;
        }
    }

    // 2. If < 2 found, Check Nicknames
    if (found.length < 2) {
        const nicknames = Object.keys(NICKNAME_MAP).sort((a, b) => b.length - a.length);
        for (const nick of nicknames) {
            const fullName = NICKNAME_MAP[nick];

            // STRICT CHECK: Ensure the nickname maps to an ALLOWED team
            if (!allowedTeams.has(fullName)) continue;

            const cleanNick = nick.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cleanText.includes(cleanNick)) {
                if (!found.some(f => f.name === fullName)) {
                    found.push({
                        url: TEAM_LOGOS[fullName],
                        color: TEAM_COLORS[fullName] || '#ffffff',
                        name: fullName
                    });
                }
                if (found.length >= 2) break;
            }
        }
    }

    return found.slice(0, 2);
}
