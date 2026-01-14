
import { sportsService } from "../lib/sports-service";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function debugNFL() {
    console.log("--- DEBUGGING NFL MARKETS ---");
    const apiKey = process.env.THE_ODDS_API_KEY;
    if (!apiKey) {
        console.error("No API Key");
        return;
    }

    // 1. Get Events
    const eventsUrl = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/events?apiKey=${apiKey}&regions=us`;
    const eventsRes = await fetch(eventsUrl);
    const events = await eventsRes.json();

    if (!events || events.length === 0) {
        console.log("No NFL events found.");
        return;
    }

    const game = events[0];
    console.log(`Checking Game: ${game.home_team} vs ${game.away_team} (ID: ${game.id})`);

    // 2. Fetch Alternate Spreads (Extended Market validation)
    const altUrl = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/events/${game.id}/odds?apiKey=${apiKey}&regions=us&markets=alternate_spreads&oddsFormat=decimal`;
    console.log("Fetching Alternate Spreads:", altUrl);
    const altRes = await fetch(altUrl);
    const altData = await altRes.json();
    console.log(`Alternate Spreads Bookmakers Found: ${altData.bookmakers ? altData.bookmakers.length : 0}`);

    // 3. Fetch Props (Global)
    const markets = "player_pass_tds,player_pass_yds,player_rush_yds,player_reception_yds,player_pass_attempts,player_pass_completions,player_receptions,player_rush_attempts,player_anytime_touchdown";
    const propsUrl = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/events/${game.id}/odds?apiKey=${apiKey}&regions=us,uk,eu,au&markets=${markets}&oddsFormat=decimal`;
    console.log("Fetching Props URL (Global):", propsUrl);

    const propsRes = await fetch(propsUrl);
    const propsData = await propsRes.json();

    if (!propsData.bookmakers || propsData.bookmakers.length === 0) {
        console.log("No bookmakers returned for this game (Global check).");
        return;
    }

    console.log(`Props Bookmakers Found: ${propsData.bookmakers.length}`);
}

debugNFL();
