
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Manual Env Load
const envPath = path.resolve(process.cwd(), '.env.local');
require('dotenv').config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTournamentBetting() {
    console.log("Checking tournament betting state...");

    // 1. Find a recent tournament bet
    const { data: bets, error } = await supabase
        .from('votes')
        .select(`
            *,
            prediction:prediction_id (
                id,
                question,
                game_id,
                resolved,
                winning_outcome
            )
        `)
        .not('tournament_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching bets:", error);
        return;
    }

    if (!bets || bets.length === 0) {
        console.log("No tournament bets found.");
        return;
    }

    console.log(`Found ${bets.length} recent tournament bets.`);

    for (const bet of bets) {
        console.log(`\nBet ID: ${bet.id}`);
        console.log(`User: ${bet.user_id}`);
        console.log(`Tournament: ${bet.tournament_id}`);
        console.log(`Prediction: ${bet.prediction?.question} (Resolved: ${bet.prediction?.resolved})`);
        console.log(`Wager: ${bet.wager} on ${bet.side}`);
        console.log(`Result: ${bet.payout > 0 ? 'PAID' : 'PENDING/LOST'}`);

        // Check User Entry Stack
        const { data: entry } = await supabase
            .from('tournament_entries')
            .select('current_stack')
            .eq('user_id', bet.user_id)
            .eq('tournament_id', bet.tournament_id)
            .single();

        console.log(`Current Stack: ${entry ? entry.current_stack : 'ENTRY NOT FOUND'}`);
    }
}

checkTournamentBetting();
