
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "No Admin Client" });

    // 1. Get resolved votes from last 24h
    const { data: recentVotes } = await supabase
        .from('votes')
        .select(`
            id,
            user_id,
            prediction_id,
            wager,
            payout_multiplier,
            side,
            tournament_id,
            predictions (
                question,
                resolved,
                outcome
            ),
            users (username)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

    // 2. Get Tournament Entries for these users
    const userIds = recentVotes?.map(v => v.user_id) || [];
    const tournamentIds = recentVotes?.map(v => v.tournament_id).filter(Boolean) || [];

    const { data: entries } = await supabase
        .from('tournament_entries')
        .select('*')
        .in('user_id', userIds)
        .in('tournament_id', tournamentIds);

    return NextResponse.json({
        recent_votes: recentVotes,
        related_entries: entries
    });
}
