import { createClient } from '@/lib/supabase/server';
import BetCard from '@/components/profile/bet-card';
import BetSlip from '@/components/feed/bet-slip';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import BottomNavBar from '@/components/layout/bottom-nav';
import PropRow from '@/components/game/prop-row';
import BackButton from '@/components/layout/back-button';
import GameMarketsView from '@/components/game/game-markets-view';

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
        "player_pass_tds": "Passing",
        "player_pass_yds": "Passing",
        "player_pass_attempts": "Passing",
        "player_pass_completions": "Passing",
        "player_pass_interceptions": "Passing",
        "player_rush_yds": "Rushing & Receiving",
        "player_reception_yds": "Rushing & Receiving",
        "player_receptions": "Rushing & Receiving",
        "player_rush_attempts": "Rushing & Receiving",
        "player_anytime_scorer": "Touchdowns",
        "player_points": "Points & Stats",
        "player_assists": "Points & Stats",
        "player_rebounds": "Points & Stats",
        "player_threes": "Points & Stats",
        "player_blocks": "Defense",
        "player_steals": "Defense",
        "player_goals": "Scoring",
        "player_shots_on_goal": "Stats"
    };

    const SUB_CATEGORY_MAP: Record<string, string> = {
        "player_pass_tds": "Passing Touchdowns",
        "player_pass_yds": "Passing Yards",
        "player_rush_yds": "Rushing Yards",
        "player_reception_yds": "Receiving Yards",
        "player_points": "Player Points",
        "player_anytime_scorer": "Anytime Touchdown"
    };

    playerPropList.forEach(p => {
        const eid = p.external_id || "";
        const parts = eid.split('-');
        // Format: gameId - marketKey - playerName - OverUnder - Line
        // Market key is usually parts[1]
        const marketKey = parts[1] || "other";
        const category = CATEGORY_MAP[marketKey] || "Other Props";
        const subCategory = SUB_CATEGORY_MAP[marketKey] || marketKey.replace('player_', '').replace(/_/g, ' ').toUpperCase();

        // Extract Player Name from question if possible (more reliable for UI)
        // "Will LeBron James record Over 25.5 PLAYER POINTS?" -> "LeBron James"
        let playerName = "Player";
        const match = p.question.match(/Will (.*) record/);
        if (match && match[1]) playerName = match[1];
        else if (p.question.includes("score a Touchdown")) {
            const tdMatch = p.question.match(/Will (.*) score/);
            if (tdMatch) playerName = tdMatch[1];
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
                <GameMarketsView
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
