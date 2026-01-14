import { createClient } from '@/lib/supabase/server';
import BetCard from '@/components/profile/bet-card';
import BetSlip from '@/components/feed/bet-slip';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BottomNavBar from '@/components/layout/bottom-nav';
import PropRow from '@/components/game/prop-row';
import BackButton from '@/components/layout/back-button';
import GameMarketsHardrock from '@/components/game/game-markets-hardrock';

export const dynamic = 'force-dynamic';

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id: rawId } = await params;
    const id = decodeURIComponent(rawId);

    // Fetch User & Bankroll for BetSlip
    const { data: { user } } = await supabase.auth.getUser();
    let profile = null;
    if (user) {
        const { data } = await supabase.from("users").select("bankroll, cash_balance").eq("id", user.id).single();
        profile = data;
    }
    const activeBankroll = profile?.cash_balance || 0;

    let predictions: any[] = [];
    let gameId: string | null = null;
    let errorDebug = "";

    try {
        // 1. Try generic search first (matches GameID or legacy)
        // BUGFIX: Use `${id}%` to allow exact matches or different separators (underscores etc)
        let { data, error } = await supabase
            .from('predictions')
            .select('*')
            .ilike('external_id', `${id}%`)
            .eq('resolved', false);

        if (data && data.length > 0) {
            predictions = data;
        } else {
            // 2. Try UUID lookup
            const { data: specific, error: uuidError } = await supabase
                .from('predictions')
                .select('external_id')
                .eq('id', id)
                .single();

            if (specific?.external_id) {
                const parts = specific.external_id.split('-');
                gameId = parts[0];
                const { data: cousins } = await supabase
                    .from('predictions')
                    .select('*')
                    .ilike('external_id', `${gameId}%`); // Relaxed here too
                predictions = cousins || [];
            } else {
                errorDebug = `UUID Lookup failed. ID not found in DB.`;
            }
        }
    } catch (e) {
        errorDebug = JSON.stringify(e);
    }

    // IF NOTHING FOUND: Show DEBUG Dashboard (Instead of 404)
    if (!predictions || predictions.length === 0) {
        // Fetch ANY 5 valid games to show the user
        const { data: recentGames } = await supabase
            .from('predictions')
            .select('external_id, question')
            .limit(20);

        // Extract unique game IDs from recent bets
        const uniqueGameIds = Array.from(new Set(recentGames?.map(p => p.external_id?.split('-')[0]) || [])).slice(0, 5);

        return (
            <main className="min-h-screen bg-black text-white p-6 pt-24 font-mono">
                <BottomNavBar />
                <Link href="/" className="mb-4 inline-block text-brand">← Back to Feed</Link>
                <h1 className="text-2xl font-bold text-red-500 mb-4">⚠️ Game Not Found</h1>

                <div className="bg-zinc-900 p-4 rounded-xl border border-red-500/20 mb-8 text-left">
                    <p className="text-zinc-400 mb-2">We couldn't find bets for ID:</p>
                    <p className="bg-white/10 p-2 rounded text-white font-mono mb-4 break-all">{id || "UNDEFINED"}</p>
                    <p className="text-zinc-500 text-xs">{errorDebug}</p>
                </div>

                <h2 className="text-lg font-bold text-white mb-4">Try These Active Games:</h2>
                <div className="space-y-2">
                    {uniqueGameIds.map(gid => (
                        <Link key={gid} href={`/game/${gid}`} className="block p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700">
                            Game ID: <span className="text-brand">{gid}</span>
                        </Link>
                    ))}
                </div>
            </main>
        );
    }

    // --- DATA GROUPING LOGIC (Hard Rock Style) ---

    // 1. Separate Game Lines (Top Level)
    const gameLines = predictions.filter((p: any) => {
        const eid = p.external_id || "";
        return eid.includes("-h2h-") || eid.includes("-spreads-") || eid.includes("-totals-");
    });

    // 2. Cluster Player Props
    const playerPropList = predictions.filter((p: any) => !gameLines.includes(p));

    // Grouping structure: { CategoryName: { PropType: { PlayerName: [predictions] } } }
    const categorizedProps: Record<string, Record<string, Record<string, any[]>>> = {};

    const CATEGORY_MAP: Record<string, string> = {
        // Force everything into "PLAYER PROPS" to match the UI Design
        // The component expects categorizedProps["PLAYER PROPS"] to exist
        "default": "PLAYER PROPS"
    };

    const SUB_CATEGORY_MAP: Record<string, string> = {
        "player_pass_tds": "PASSING TDS",
        "player_pass_yds": "PASSING YARDS",
        "player_pass_attempts": "PASSING ATTEMPTS",
        "player_pass_completions": "PASSING COMP",
        "player_rush_yds": "RUSHING YARDS",
        "player_rush_attempts": "RUSHING ATTEMPTS",
        "player_reception_yds": "RECEIVING YARDS",
        "player_receptions": "RECEPTIONS",
        "player_anytime_touchdown": "TD SCORERS", // Hardrock style name
        "player_points": "POINTS",
        "player_assists": "ASSISTS",
        "player_rebounds": "REBOUNDS",
        "player_threes": "THREES",
        "player_blocks": "BLOCKS",
        "player_steals": "STEALS",
        "player_points_assists": "PTS + AST",
        "player_points_rebounds": "PTS + REB",
        "player_rebounds_assists": "REB + AST",
        "player_points_rebounds_assists": "PTS + REB + AST",
        "player_double_double": "DOUBLE DOUBLE",
        "player_triple_double": "TRIPLE DOUBLE",
        "player_goals": "GOALS",
        "player_shots_on_goal": "SHOTS ON GOAL",
        "player_power_play_points": "POWER PLAY PTS",
        "player_blocked_shots": "BLOCKED SHOTS"
    };

    playerPropList.forEach(p => {
        const eid = p.external_id || "";
        const parts = eid.split('-');
        // Format: gameId - marketKey - playerName - OverUnder - Line
        const marketKey = parts[1] || "other";

        // EVERYTHING goes to "PLAYER PROPS" top level bucket
        const category = "PLAYER PROPS";

        const subCategory = SUB_CATEGORY_MAP[marketKey] || marketKey.replace('player_', '').replace(/_/g, ' ').toUpperCase();

        // Extract Player Name from question if possible (more reliable for UI)
        let playerName = "Player";
        const match = p.question.match(/Will (.*) record/);
        if (match && match[1]) playerName = match[1];
        else if (p.question.includes("score a Touchdown")) {
            const tdMatch = p.question.match(/Will (.*) score/);
            if (tdMatch) playerName = tdMatch[1];
        } else if (p.question.includes("score a Goal") || p.question.includes("score over")) { // NHL
            // Try to find name before "record" or "score"
            const looseMatch = p.question.split(" record ")[0].replace("Will ", "");
            if (looseMatch && looseMatch.length < 30) playerName = looseMatch;
        }

        if (!categorizedProps[category]) categorizedProps[category] = {};
        if (!categorizedProps[category][subCategory]) categorizedProps[category][subCategory] = {};
        if (!categorizedProps[category][subCategory][playerName]) categorizedProps[category][subCategory][playerName] = [];

        categorizedProps[category][subCategory][playerName].push(p);
    });

    return (
        <main className="relative min-h-screen bg-black text-white">
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center p-4 bg-black/90 backdrop-blur-md border-b border-white/5 shadow-xl">
                <BackButton />
                <h1 className="ml-2 text-lg font-black uppercase tracking-widest">Game Markets</h1>
            </div>

            <div className="p-6 pt-24">
                <GameMarketsHardrock
                    gameLines={gameLines}
                    categorizedProps={categorizedProps}
                />
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-40">
                <BottomNavBar />
            </div>

            <BetSlip cashBalance={activeBankroll} />
        </main>
    );
}
