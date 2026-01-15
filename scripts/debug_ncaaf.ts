
import { sportsService } from '../src/lib/sports-service';

async function verifyNCAAF() {
    console.log("Checking NCAAF Odds availability...");

    try {
        const response = await fetch("https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds?apiKey=" + process.env.THE_ODDS_API_KEY + "&regions=us&markets=h2h,spreads,totals&oddsFormat=decimal");
        const data = await response.json();

        console.log("API Status:", response.status);
        if (Array.isArray(data)) {
            console.log(`Found ${data.length} NCAAF games.`);
            data.forEach(g => {
                console.log(`- ${g.home_team} vs ${g.away_team} (${g.commence_time})`);
            });
        } else {
            console.log("Error:", data);
        }
    } catch (e) {
        console.error(e);
    }
}

verifyNCAAF();
