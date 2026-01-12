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

/**
 * Extracts team logos from a question string.
 * Example: "Will Detroit Red Wings win against Carolina Hurricanes?"
 * Returns an array of logo URLs found.
 */
export function getTeamLogos(question: string): string[] {
    if (!question) return [];

    const foundLogos: string[] = [];

    // Create a priority list of team names (longer names first to avoid partial matches)
    const teamNames = Object.keys(TEAM_LOGOS).sort((a, b) => b.length - a.length);

    for (const team of teamNames) {
        if (question.toLowerCase().includes(team.toLowerCase())) {
            foundLogos.push(TEAM_LOGOS[team]);
            // If we found 2 logos, we're likely done (home vs away)
            if (foundLogos.length >= 2) break;
        }
    }

    // Deduplicate in case of shorthand vs full name
    return [...new Set(foundLogos)];
}
