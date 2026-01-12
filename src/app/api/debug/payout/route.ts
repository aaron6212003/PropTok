import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get('id');

    if (!tournamentId) return NextResponse.json({ error: "No ID" });

    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "No Admin" });

    // 1. Get Tournament & Entries
    const { data: tournament } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single();
    const { data: entries } = await supabase.from('tournament_entries').select('*, users(*)').eq('tournament_id', tournamentId);

    if (!tournament || !entries) return NextResponse.json({ error: "Data not found" });

    // 2. Calculate Pot
    // Assuming all 'entries' are PAID. We should filter by 'paid' = true ideally, but if not set default to true for testing
    const paidEntries = entries.filter(e => e.paid);
    const entryFee = tournament.entry_fee_cents || 0;
    const poolCents = paidEntries.length * entryFee;

    // 3. Determine Winner (Highest Stack)
    const winner = paidEntries.sort((a, b) => b.current_stack - a.current_stack)[0];

    if (!winner) return NextResponse.json({ error: "No winner found" });

    // 4. Distribute (Simulation)
    const winnerCut = Math.floor(poolCents * 0.90);
    const hostCut = Math.floor(poolCents * 0.05); // If user hosted
    const platformCut = poolCents - winnerCut - hostCut;

    // 5. Execute Payout Logic (Update Cash Balance)
    // We update the User's cash_balance. 
    // NOTE: This assumes we trust the 'users' table or have a 'transactions' table.

    // Add to Winner
    const { error: winErr } = await supabase.rpc('increment_balance', {
        user_id: winner.user_id,
        amount: winnerCut
    }).catch(async () => {
        // Fallback if RPC doesn't exist
        const { data: u } = await supabase.from('users').select('cash_balance').eq('id', winner.user_id).single();
        return supabase.from('users').update({ cash_balance: (u?.cash_balance || 0) + winnerCut }).eq('id', winner.user_id);
    });

    // Log Payout
    const { data: payout, error: pErr } = await supabase.from('tournament_payouts').insert({
        tournament_id: tournamentId,
        winner_user_id: winner.user_id,
        pool_cents: poolCents,
        winner_cents: winnerCut,
        host_cents: hostCut,
        platform_cents: platformCut,
        status: 'COMPLETED'
    }).select().single();

    // Close Tournament
    await supabase.from('tournaments').update({ status: 'COMPLETED' }).eq('id', tournamentId);

    return NextResponse.json({
        success: true,
        winner: winner.users?.username,
        pool: poolCents,
        payout_log: payout,
        error: winErr || pErr
    });
}
