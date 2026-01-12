"use server"; // Force refresh 2.0

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag, unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { sportsService } from "@/lib/sports-service";

// ... imports

export async function processDeposit(amount: number) {
    const supabase = await createClient(); // Use logged-in client for ID
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // In a real app, this is where Stripe/Worldpay verification happens.
    // For this simulation/MVP: We trust the client input and just update DB.

    // 1. Log Transaction
    const adminClient = createAdminClient(); // Need admin to write to transactions/update balance safely if we want strictness, 
    // but RLS on 'users' allows update own profile? Maybe. 
    // Safest is Admin for money.

    if (!adminClient) return { success: false, error: "System Error (Admin)" };

    const { error: txError } = await adminClient.from('transactions').insert({
        user_id: user.id,
        amount: amount,
        type: 'DEPOSIT',
        description: 'Simulated Deposit'
    });

    if (txError) return { success: false, error: txError.message };

    // 2. Update Balance
    // We use RPC or raw increment if concurrent, but for MVP fetching+update is 'okay' risk.
    // Better: use rpc 'increment_balance'? We don't have it.
    // We will just read-update-write for now or use `cash_balance = cash_balance + amount` if supabase supports valid sql in update? No.
    // Let's just fetch simulate.

    const { data: profile } = await adminClient.from('users').select('cash_balance').eq('id', user.id).single();
    const newBalance = (profile?.cash_balance || 0) + amount;

    const { error: balError } = await adminClient.from('users')
        .update({ cash_balance: newBalance })
        .eq('id', user.id);

    if (balError) return { success: false, error: balError.message };

    revalidatePath('/', 'layout');
    return { success: true };
}

export async function ingestOdds() {
    const logs = await sportsService.ingestGames();
    revalidatePath("/", "layout");
    return { success: true, logs };
}

export async function emergencyResetEconomy() {
    const supabase = createAdminClient();

    // DEBUG: Check Environment explicitly
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAdminKey = !!process.env.SUPABASE_ADMIN_KEY;
    const serviceKeyLen = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0;

    if (!supabase) {
        console.error("Admin Client Creation Failed in Action");
        return {
            error: `Admin Access Failed. Keys Detected? ServiceRole: ${hasServiceKey} (Len: ${serviceKeyLen}), Admin: ${hasAdminKey}. URL: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`
        };
    }

    const { error } = await supabase.from('users').update({ cash_balance: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) return { error: "Reset Failed: " + error.message };

    revalidatePath('/', 'layout'); // Refresh EVERYTHING (Header, Profile, etc)
    return { success: true };
}

export async function emergencyRestoreNFL() {
    const supabase = createAdminClient();
    if (!supabase) return { error: "Admin client unavailable" };

    const { data: existing } = await supabase.from('tournaments').select('*').ilike('name', '%NFL%').maybeSingle();

    if (existing) {
        const { error } = await supabase.from('tournaments')
            .update({ owner_id: null, status: 'ACTIVE', entry_fee: 10, starting_stack: 1000, is_public: true })
            .eq('id', existing.id);
        if (error) return { error: "Update Failed: " + error.message };
    } else {
        const { error } = await supabase.from('tournaments').insert({
            name: 'NFL Weekend Showdown',
            description: 'The ultimate NFL battle. $10 Buy-in. 1000 Chips.',
            entry_fee: 10,
            starting_stack: 1000,
            status: 'ACTIVE',
            is_public: true,
            owner_id: null,
            rake_percent: 10
        });
        if (error) return { error: "Insert Failed: " + error.message };
    }

    revalidatePath('/tournaments');
    return { success: true };
}

export async function getPredictions(onlyOpen: boolean = false, tournamentId?: string | null) {
    noStore(); // Ensure fresh data for admin panel updates
    const supabase = await createClient();
    let query = supabase
        .from("predictions")
        .select(`
            *,
            comments:comments(count)
        `)
        .order("created_at", { ascending: false })
        .not('external_id', 'ilike', '%-player_%');

    if (onlyOpen) {
        // const now = new Date().toISOString();
        query = query
            .eq("resolved", false);
        // .gt("expires_at", now); // REMOVED: Allow "Live" games (started but not resolved) to show
    }

    // Filter by Tournament Rules (League Filtering)
    if (tournamentId) {
        const { data: t } = await supabase.from("tournaments").select("allowed_leagues").eq("id", tournamentId).single();

        if (t && t.allowed_leagues && t.allowed_leagues.length > 0) {
            // allowed_leagues is an array like ['NFL', 'NBA']
            // We need to filter predictions where 'category' contains any of these
            // OR checks: category ILIKE '%NFL%' OR category ILIKE '%NBA%'

            // Supabase 'or' syntax: category.ilike.%NFL%,category.ilike.%NBA%
            const orConditions = t.allowed_leagues.map((l: string) => `category.ilike.%${l}%`).join(',');
            query = query.or(orConditions);
        }
    }

    // DIAGNOSTIC START
    // Actually, just execute query and log result size
    const { data: rawData, error } = await query;
    console.log(`[getPredictions LOG] Called with onlyOpen=${onlyOpen}, tournamentId=${tournamentId}`);
    if (error) console.error(`[getPredictions ERROR]`, error);
    else console.log(`[getPredictions SUCCESS] Found ${rawData?.length} raw predictions.`);

    if (error) {
        console.error("Error fetching predictions:", error);
        return [];
    }
    const data = rawData;
    // DIAGNOSTIC END

    // --- DEDUPLICATION LOGIC ---
    // Filter out "mirrored" duplicates (e.g. "Team A vs Team B" and "Team B vs Team A" for same market)
    // We group by the unique GameID + MarketKey prefix of the external_id
    // Format is: {gameId}-{marketKey}-{uniqueIdentifier}
    // We assume the first 2 parts form the unique market group.

    const seenMarkets = new Set();
    const uniqueTranslations = [];

    for (const p of data) {
        // external_id is like: "f123456-h2h-Lakers"
        // We want to extract "f123456-h2h"
        // But some markets like player props have more dashes.
        // Game IDs are usually 32 chars hash or similar.
        // Let's rely on the fact that for h2h/spreads/totals, duplicates are the main issue.

        let shouldInclude = true;

        if (p.category === 'NCAA' || p.category === 'NBA' || p.category === 'NFL') { // Target US Sports mainly
            // Safely handle varying ID formats
            const parts = p.external_id ? p.external_id.split('-') : [];

            if (parts.length >= 2) {
                const marketKey = parts[1]; // 'h2h', 'spreads', 'totals'

                // Only deduplicate the MAIN game lines which are prone to mirroring.
                // Player props are usually distinct enough or "Over/Under" which we want to keep one of.
                if (['h2h', 'spreads', 'totals'].includes(marketKey)) {
                    const gameId = parts[0];
                    const compositeKey = `${gameId}-${marketKey}`; // Group by Game + Market Type

                    if (seenMarkets.has(compositeKey)) {
                        shouldInclude = false;
                    } else {
                        seenMarkets.add(compositeKey);
                    }
                }
            }
        }

        if (shouldInclude) {
            uniqueTranslations.push(p);
        }
    }

    return uniqueTranslations.map((p: any) => ({
        ...p,
        // Map snake_case to camelCase for UI components
        yesMultiplier: p.yes_multiplier,
        noMultiplier: p.no_multiplier,
        yesPercent: p.yes_percent,
        externalId: p.external_id,
        expiresAt: p.expires_at,
        createdAt: p.created_at,
        imageUrl: p.image_url,
        commentCount: p.comments?.[0]?.count || 0
    }));
}

export async function submitVote(predictionId: string, side: 'YES' | 'NO', wager: number, tournamentId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // 1. Check uniqueness (Optional, but good UX)
    const { data: existingVote } = await supabase
        .from("votes")
        .select("id")
        .eq("user_id", user.id)
        .eq("prediction_id", predictionId)
        .maybeSingle();

    if (existingVote) return { error: "Already voted on this prediction" };

    // 2. Fetch Multiplier
    const { data: prediction } = await supabase
        .from("predictions")
        .select("yes_percent, yes_multiplier, no_multiplier")
        .eq("id", predictionId)
        .single();

    if (!prediction) return { error: "Prediction not found" };

    let multiplier: number;
    if (prediction.yes_multiplier && prediction.no_multiplier) {
        multiplier = side === 'YES' ? prediction.yes_multiplier : prediction.no_multiplier;
    } else {
        let yesProb = (prediction.yes_percent || 50) / 100;
        yesProb = Math.max(0.01, Math.min(0.99, yesProb));
        const probability = side === 'YES' ? yesProb : (1 - yesProb);
        multiplier = Number((0.95 / probability).toFixed(2));
    }

    // 3. Call Atomic RPC
    const { data, error } = await supabase.rpc('place_bet', {
        p_user_id: user.id,
        p_prediction_id: predictionId,
        p_amount: wager,
        p_side: side,
        p_multiplier: multiplier,
        p_tournament_id: tournamentId
    });

    if (error) {
        console.error("Place Bet Error:", error);
        return { error: error.message };
    }

    revalidatePath(`/tournaments/${tournamentId}`);
    return { success: true };
}

export async function verifyTournamentPayment(sessionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    try {
        // Retrieve Stripe Session
        // We need 'stripe' instance from lib
        const stripeModule = await import("@/lib/stripe");
        const stripe = stripeModule.stripe;

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const tournamentId = session.metadata?.tournamentId;
            if (!tournamentId) return { error: "Invalid Session Metadata" };

            // Force Update DB (Admin)
            // We use the same admin logic as the webhook to ensure it works
            const { createAdminClient } = await import("@/lib/supabase/admin");
            const adminClient = createAdminClient();

            if (!adminClient) return { error: "Server Configuration Error" };

            await adminClient.from("tournament_entries").upsert({
                tournament_id: tournamentId,
                user_id: user.id,
                paid: true,
                stripe_checkout_session_id: session.id,
                stripe_payment_intent_id: session.payment_intent as string,
                current_stack: 1000 // Default
            }, { onConflict: 'user_id, tournament_id' });

            revalidatePath(`/tournaments/${tournamentId}`);
            return { success: true };
        }
        return { error: "Payment not completed" };
    } catch (e: any) {
        console.error("Verification failed:", e);
        return { error: e.message };
    }
}

export async function createPrediction(formData: FormData) {
    const supabase = await createClient();

    const question = formData.get("question") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;

    // Oracle Config
    const oracle_id = formData.get("oracle_id") as string | null;
    const oracle_type = formData.get("oracle_type") as string | null;
    const target_value = formData.get("target_value") ? Number(formData.get("target_value")) : null;
    const target_slug = formData.get("target_slug") as string | null;

    // Expiration
    let expiresAt = formData.get("expires_at") as string;
    if (!expiresAt) {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else {
        expiresAt = new Date(expiresAt).toISOString();
    }

    // Initial Odds
    const initialPercent = Number(formData.get("initial_percent") || 50);
    const safePercent = Math.max(1, Math.min(99, initialPercent)); // Clamp 1-99

    // Calculate Multipliers based on User Input
    const prob = safePercent / 100;
    const yesMultiplier = Number((0.95 / prob).toFixed(2));
    const noMultiplier = Number((0.95 / (1 - prob)).toFixed(2));

    const { error } = await supabase.from("predictions").insert({
        question,
        category,
        description,
        oracle_id,
        oracle_type,
        target_value,
        target_slug,
        expires_at: expiresAt,
        yes_percent: safePercent, // Use the user-defined percent
        volume: 0,
        yes_multiplier: yesMultiplier,
        no_multiplier: noMultiplier
    });

    if (error) {
        console.error("Create error:", error);
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
    return { success: true };
}

export async function deletePrediction(id: string) {
    const supabase = await createClient(); // Keep standard client for auth check
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Verify Authentication
    if (!user) return { error: "Not authenticated" };

    // 2. Use RPC Function (Security Definer) to bypass RLS
    // This runs as superuser on the database side, so we don't need the Service Key here
    const { error } = await supabase.rpc('delete_prediction_force', { target_id: id });

    if (error) {
        console.error("Delete prop error FULL:", error);
        return { error: `DB Error: ${error.message} (Code: ${error.code})` };
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
    return { success: true };
}

export async function resolvePrediction(id: string, outcome: 'YES' | 'NO') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // Call the Security Definer RPC function (no service key needed)
    const { error } = await supabase.rpc('resolve_prediction', {
        p_id: id,
        p_outcome: outcome
    });

    if (error) {
        console.error("Resolve error:", error);
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/profile", "layout");
    revalidatePath("/admin", "layout");
    return { success: true };
}

export async function autoResolvePrediction(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const { data: prediction, error: fetchError } = await supabase
        .from("predictions")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError || !prediction) return { error: "Prediction not found" };
    if (prediction.resolved) return { error: "Already resolved" };

    // 1. Crypto Price
    if (prediction.oracle_type === "crypto_price_gt") {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${prediction.oracle_id}&vs_currencies=usd`);
            const data = await response.json();
            const price = data[prediction.oracle_id]?.usd;

            if (!price) return { error: "Could not fetch current price" };

            const outcome = price > prediction.target_value ? "YES" : "NO";
            return await resolvePrediction(id, outcome);
        } catch (e) {
            console.error(e);
            return { error: "Oracle fetch failed" };
        }
    }

    // 2. NFL / Game Date
    if (prediction.game_date) {
        const gameTime = new Date(prediction.game_date);
        const now = new Date();

        if (now < gameTime) return { error: "Game has not started/finished yet" };

        // Semi-random consistent outcome for simulation
        const seed = prediction.oracle_id?.length || 0;
        const outcome = (seed % 2 === 0) ? "YES" : "NO";
        return await resolvePrediction(id, outcome);
    }

    return { error: "No automated resolution logic for this market type" };
}

export async function undoResolvePrediction(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase.rpc('undo_resolve_prediction', {
        p_id: id
    });

    if (error) {
        console.error("Undo error:", error);
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/profile", "layout");
    revalidatePath("/admin", "layout");
    return { success: true };
}


export async function getLeaderboard() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("win_rate", { ascending: false })
        .order("streak", { ascending: false })
        .limit(50);

    if (error) {
        console.error("Leaderboard fetch error:", error);
        return [];
    }

    return data;
}

export async function getUserVotes(limit: number = 50, onlyUnacknowledged: boolean = false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // If fetching for recap, ensure we get FRESH data by bypassing cache
    if (onlyUnacknowledged) {
        noStore();
    }

    let query = supabase
        .from("votes")
        .select(`
            *,
            tournament:tournaments(name),
            predictions:prediction_id (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (onlyUnacknowledged) {
        query = query.eq("acknowledged", false);
    }

    if (limit > 0) {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching user votes:", error);
        return [];
    }

    // JS-side filter to be resilient to missing columns during migration
    return (data || []).filter((v: any) => v.hidden_by_user !== true);
}

export async function getUserBundles(limit: number = 50, onlyUnacknowledged: boolean = false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    if (onlyUnacknowledged) {
        noStore();
    }

    let query = supabase
        .from("bundles")
        .select(`
            *,
            tournament:tournaments(name),
            legs:bundle_legs (
                *,
                prediction:predictions (
                    question,
                    category,
                    resolved,
                    outcome
                )
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (onlyUnacknowledged) {
        query = query.eq("acknowledged", false);
    }

    if (limit > 0) {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching bundles:", error);
        return [];
    }

    // JS-side filter to be resilient to missing columns during migration
    return (data || []).filter((b: any) => b.hidden_by_user !== true);
}

export async function acknowledgeResults() {
    // 1. Authenticate user as usual
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // 2. Use ADMIN client if available to bypass RLS, otherwise fallback to standard client
    const admin = createAdminClient();
    const client = admin || supabase;

    console.log(`Acknowledging results for user: ${user.id} using ${admin ? 'ADMIN' : 'USER'} client`);

    // Batch acknowledge both votes and bundles
    const [votesRes, bundlesRes] = await Promise.all([
        client
            .from("votes")
            .update({ acknowledged: true })
            .eq("user_id", user.id)
            .eq("acknowledged", false),
        client
            .from("bundles")
            .update({ acknowledged: true })
            .eq("user_id", user.id)
            .eq("acknowledged", false)
    ]);

    if (votesRes.error || bundlesRes.error) {
        console.error("Acknowledge Error:", votesRes.error || bundlesRes.error);
        return { error: "Failed to acknowledge results. Check RLS policies." };
    }

    // Force revalidate everything
    revalidatePath("/", "layout");
    revalidatePath("/profile", "layout");

    return { success: true };
}

export async function placeBundleWager(legs: { id: string, side: 'YES' | 'NO', multiplier: number }[], wager: number, tournamentId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // Calculate Multiplier
    const totalMultiplier = legs.reduce((acc, leg) => acc * leg.multiplier, 1);

    // Call Atomic RPC
    const { data, error } = await supabase.rpc('place_bundle', {
        p_user_id: user.id,
        p_wager: wager,
        p_total_multiplier: totalMultiplier,
        p_tournament_id: tournamentId || null,
        p_legs: legs.map(l => ({
            prediction_id: l.id,
            side: l.side,
            multiplier: l.multiplier
        }))
    });

    if (error) {
        console.error("RPC Bundle Error:", error);
        return { error: error.message };
    }

    if (data?.error) {
        return { error: data.error };
    }

    revalidatePath("/", "layout");
    revalidatePath("/profile", "layout");
    return { success: true };
}

export async function adminHardReset() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // Delete all votes, bundles (cascade handles legs), and reset cash
    await supabase.from("votes").delete().eq("user_id", user.id);
    await supabase.from("bundles").delete().eq("user_id", user.id);
    await supabase.from("users").update({
        bankroll: 1000,
        win_rate: 0,
        streak: 0,
        best_streak: 0
    }).eq("id", user.id);

    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
    return { success: true };
}

// Hard Reset Tools (Bypass RLS)
export async function clearDatabase() {
    const supabase = await createClient(); // Standard client for auth check
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // Use RPC Function (Security Definer) to bypass RLS without Env Vars
    const { error } = await supabase.rpc('admin_wipe_data');

    if (error) {
        console.error("Clear DB Error:", error);
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
    return { success: true };
}

// --- Tournament Actions ---

export async function getTournament(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return null;
    return data;
}

export async function getTournamentLeaderboard(tournamentId: string) {
    noStore(); // Force fresh data
    const supabase = await createClient();

    // Join entries with users to get usernames/avatars
    const { data, error } = await supabase
        .from("tournament_entries")
        .select(`
            *,
            users:user_id (
                username,
                avatar_url
            )
        `)
        .eq("tournament_id", tournamentId)
        .order("current_stack", { ascending: false });

    if (error) {
        console.error("Tournament Leaderboard Error:", error);
        return [];
    }

    return data;
}



export async function createTournament(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Login required" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const entryFee = Number(formData.get("entry_fee"));
    const maxPlayersRaw = Number(formData.get("max_players"));

    // 101 represents "Unlimited" in our UI, mapped to NULL in DB
    const maxPlayers = maxPlayersRaw > 100 ? null : maxPlayersRaw;

    // Standard Game Config
    const startingStack = 1000;
    const rakePercent = 10;

    const { data, error } = await supabase
        .from("tournaments")
        .insert({
            name,
            description,
            entry_fee: entryFee,
            starting_stack: startingStack,
            rake_percent: rakePercent,
            max_players: maxPlayers,
            status: 'ACTIVE',
            is_public: true,
            owner_id: user.id // Explicitly set owner for User-Hosted
        })
        .select("id")
        .single();

    if (error) return { error: error.message };

    revalidatePath("/tournaments");
    return { success: true, id: data.id };
}

export async function createFeaturedTournament(formData: FormData) {
    const supabase = await createClient(); // Check Auth first
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Login required" };

    // FORCE FIX: Use Standard Client.
    // We assume RLS is open enough (via fix_framework.sql) to allow this.
    // If not, it will fail at DB level, but at least passes Config check.
    const adminSupabase = supabase;

    // const adminSupabase = createAdminClient();
    // if (!adminSupabase) return { error: "Server Configuration Error (Admin Key)" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const entryFee = Number(formData.get("entry_fee"));
    const startingStack = Number(formData.get("starting_stack")) || 1000;
    const maxPlayersRaw = Number(formData.get("max_players"));
    const maxPlayers = maxPlayersRaw > 0 ? maxPlayersRaw : null; // 0 or empty means unlimited

    const { data, error } = await adminSupabase
        .from("tournaments")
        .insert({
            name,
            description,
            entry_fee: entryFee,
            starting_stack: startingStack,
            rake_percent: 10,
            max_players: maxPlayers,
            status: 'ACTIVE',
            is_public: true,
            owner_id: null, // System Owned (Featured)
            start_time: new Date().toISOString(),
            filter_category: formData.get("filter_category") || 'All'
        })
        .select("id")
        .single();

    if (error) {
        console.error("Create Featured Tournament Error:", error);
        return { error: `DB Error: ${error.message} (${error.code})` };
    }

    revalidatePath("/tournaments");
    return { success: true, id: data.id };
}

export async function acceptTos(ip: string, region: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Login required" };

    const { error } = await supabase.rpc('accept_tos', {
        p_ip: ip,
        p_region: region
    });

    if (error) {
        console.error("TOS Accept Error:", error);
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
}

export async function getUserTournamentEntries() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from("tournament_entries")
        .select(`
            *,
            tournament:tournament_id (
                id,
                name,
                status
            )
        `)
        .eq("user_id", user.id);

    return data;
}

export async function getAllTournaments() {
    const supabase = await createClient();

    // 1. Fetch Tournaments (Raw)
    const { data: tournaments, error: tError } = await supabase
        .from('tournaments')
        .select('*');

    if (tError) {
        console.error("Server Action Fetch Error:", tError);
        return { error: tError.message };
    }

    if (!tournaments || tournaments.length === 0) return { data: [] };

    // 2. Fetch Owners manually (Bypass Missing FK Relationship error)
    const ownerIds = Array.from(new Set(tournaments.map(t => t.owner_id).filter(Boolean)));

    let profilesMap: Record<string, any> = {};

    if (ownerIds.length > 0) {
        const { data: owners } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .in('id', ownerIds);

        if (owners) {
            owners.forEach(o => profilesMap[o.id] = o);
        }
    }

    // 3. Merge Data
    const joinedData = tournaments.map(t => ({
        ...t,
        owner: t.owner_id ? profilesMap[t.owner_id] : null
    }));

    return { data: joinedData };
}

export async function deleteTournaments(tournamentIds: string[]) {
    const supabase = await createClient();

    // 1. Try "God Mode" RPC First (Bypasses RLS)
    const { error: rpcError } = await supabase.rpc('force_delete_tournaments', { tournament_ids: tournamentIds });

    if (!rpcError) {
        revalidatePath('/tournaments');
        revalidatePath('/profile/admin');
        return { success: true };
    }

    console.warn("RPC Failed, trying standard delete...", rpcError);

    // 2. Fallback: Standard Delete (Will work if own + cascade is fixed)
    await supabase.from('tournament_entries').delete().in('tournament_id', tournamentIds);
    const { error } = await supabase.from('tournaments').delete().in('id', tournamentIds);

    if (error) {
        console.error("Delete Tournament Error:", error);
        return { error: "Failed to delete: " + error.message };
    }

    revalidatePath('/tournaments');
    revalidatePath('/profile/admin');
    return { success: true };
}

export async function joinTournament(tournamentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Login required" };

    const admin = createAdminClient();
    if (!admin) return { error: "System Error" };

    // 1. Fetch Tournament & Balance
    const { data: tournament } = await admin.from("tournaments").select("*").eq("id", tournamentId).single();
    const { data: profile } = await admin.from("users").select("cash_balance").eq("id", user.id).single();

    if (!tournament) return { error: "Tournament not found" };

    // Check if already joined
    const { data: existing } = await supabase.from("tournament_entries").select("user_id").eq("tournament_id", tournamentId).eq("user_id", user.id).single();
    if (existing) return { error: "You have already joined this tournament." };

    const entryFee = tournament.entry_fee || 0;
    const currentCash = profile?.cash_balance || 0;

    // 2. Check Funds
    if (currentCash < entryFee) {
        return { error: `Insufficient Funds. This tournament costs $${entryFee}. Deposit funds in your wallet.` };
    }

    // 3. Process Payment (Deduct Cash)
    const { error: payError } = await admin.from("users")
        .update({ cash_balance: currentCash - entryFee })
        .eq("id", user.id);

    if (payError) return { error: "Payment processing failed." };

    // 4. Add to Pot
    await admin.from("tournaments")
        .update({ pot_size: (tournament.pot_size || 0) + entryFee })
        .eq("id", tournamentId);

    // 5. Log Transaction
    await admin.from("transactions").insert({
        user_id: user.id,
        amount: -entryFee,
        type: 'ENTRY_FEE',
        description: `Join: ${tournament.name}`
    });

    // 6. Join (Add Chips)
    const { error: joinError } = await supabase.from("tournament_entries").insert({
        tournament_id: tournamentId,
        user_id: user.id,
        current_stack: tournament.starting_stack || 1000
    });

    if (joinError) return { error: "Failed to join tournament." };

    revalidatePath("/tournaments");
    return { success: true };
}

// --- Social Actions ---

export async function getComments(predictionId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("comment_details")
        .select("*")
        .eq("prediction_id", predictionId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching comments:", error);
        return [];
    }

    return data;
}

export async function postComment(predictionId: string, text: string, parentId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("comments").insert({
        prediction_id: predictionId,
        user_id: user.id,
        text,
        parent_id: parentId || null
    });

    if (error) return { error: error.message };

    revalidatePath("/", "layout");
    return { success: true };
}

export async function likeComment(commentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Check if liked
    const { data: existing } = await supabase
        .from("comment_likes")
        .select("*")
        .eq("comment_id", commentId)
        .eq("user_id", user.id)
        .single();

    if (existing) {
        // Unlike
        const { error } = await supabase
            .from("comment_likes")
            .delete()
            .eq("comment_id", commentId)
            .eq("user_id", user.id);
        if (error) return { error: error.message };
    } else {
        // Like
        const { error } = await supabase
            .from("comment_likes")
            .insert({
                comment_id: commentId,
                user_id: user.id
            });
        if (error) return { error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
}

export async function hideBet(id: string, isBundle: boolean) {
    console.log(`[hideBet] Initializing for ID: ${id}, isBundle: ${isBundle}`);
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error("[hideBet] Auth failure:", authError);
        return { error: `Authentication failed: ${authError?.message || 'No user session'}` };
    }

    console.log(`[hideBet] User authenticated: ${user.id}`);

    const table = isBundle ? "bundles" : "votes";

    // First, check if the row exists and belongs to the user
    const { data: existing, error: checkError } = await supabase
        .from(table)
        .select("id, user_id")
        .eq("id", id)
        .single();

    if (checkError) {
        console.error(`[hideBet] Lookup error in ${table}:`, checkError);
        return { error: `Could not find this bet in the database (${checkError.message})` };
    }

    if (existing.user_id !== user.id) {
        console.warn(`[hideBet] Ownership mismatch. User ${user.id} tried to hide bet ${id} belonging to ${existing.user_id}`);
        return { error: "You do not have permission to hide this bet (Owner mismatch)" };
    }

    const { error: dbError } = await supabase
        .from(table)
        .update({ hidden_by_user: true })
        .eq("id", id);

    if (dbError) {
        console.error(`[hideBet] Update error in ${table}:`, dbError);
        if (dbError.code === '42703') {
            return { error: "Development update required: 'hidden_by_user' column missing in database." };
        }
        return { error: `Database update failed: ${dbError.message}` };
    }
    revalidatePath("/profile");
    return { success: true };
}


// Removed duplicate joinTournament. Using the one above.

export async function adminResetTournament(tournamentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase.rpc('admin_reset_tournament', {
        p_tournament_id: tournamentId
    });

    if (error) {
        console.error("Reset Tournament Error:", error);
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
    revalidatePath("/profile", "layout");
    return { success: true };
}

export async function updateProfile(formData: FormData) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: "Not authenticated" };

        const username = formData.get("username") as string;
        const avatarFile = formData.get("avatar") as File | null;

        const updates: any = {};

        // 1. Handle Username
        if (username) {
            // Check uniqueness
            const { data: existing } = await supabase
                .from("users")
                .select("id")
                .eq("username", username)
                .neq("id", user.id)
                .single();

            if (existing) return { error: "Username already taken" };

            updates.username = username;
        }

        // 2. Handle Avatar
        if (avatarFile && avatarFile.size > 0) {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Storage
            const { error: uploadError } = await supabase
                .storage
                .from('avatars')
                .upload(filePath, avatarFile);

            if (uploadError) {
                console.error("Upload error:", uploadError);
                return { error: "Failed to upload image" };
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('avatars')
                .getPublicUrl(filePath);

            updates.avatar_url = publicUrl;
        }

        if (Object.keys(updates).length === 0) return { success: true };

        // 3. Update User Table
        console.log("Updating profile for user:", user.id, updates);

        // Removed updated_at to ensure compatibility with all schema versions
        const { error, data } = await supabase
            .from("users")
            .upsert({
                id: user.id,
                ...updates
            }, { onConflict: 'id' }).select();

        if (error) {
            console.error("Profile Update Error:", error);
            return { error: error.message };
        }

        console.log("Profile Update Success:", data);

        revalidatePath("/", "layout");
        revalidatePath("/profile", "layout");

        return { success: true };
    } catch (e: any) {
        console.error("Server Action Panic:", e);
        return { error: "Server error: " + (e.message || "Unknown") };
    }
}

export async function getWalletData() {
    noStore();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const [userRes, transactionsRes] = await Promise.all([
        supabase.from("users").select("cash_balance, bankroll").eq("id", user.id).single(),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
    ]);

    return {
        cash_balance: userRes.data?.cash_balance || 0,
        play_balance: userRes.data?.bankroll || 0,
        transactions: transactionsRes.data || []
    };
}

export async function redeemPromoCode(code: string) {
    const supabase = await createClient(); // Use standard client, we rely on RLS or we upgrade to Admin if needed
    // Actually, for updating user cash, we should use Admin Client to be safe from RLS issues.

    const admin = createAdminClient();
    if (!admin) return { error: "System Error: Admin unavailable" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // 1. Fetch Code
    // We use ADMIN to read codes because they might be hidden/RLS protected
    const { data: promo, error: promoError } = await admin
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .single();

    if (promoError || !promo) return { error: "Invalid Code" };
    if (!promo.is_active) return { error: "Code Inactive" };
    if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) return { error: "Code Depleted" };

    // 2. Check Redemption
    const { data: existing } = await admin
        .from('promo_redemptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('code_id', promo.id)
        .single();

    if (existing) return { error: "Already Redeemed" };

    // 3. Execute Transaction 
    // A. Add Balance (Try RPC first, else direct update)
    const { error: balanceError } = await admin.rpc('increment_user_balance', {
        user_uuid: user.id,
        amount: promo.value
    });

    if (balanceError) {
        // Fallback: Get current -> Update
        const { data: u } = await admin.from('users').select('cash_balance').eq('id', user.id).single();
        const newBal = (u?.cash_balance || 0) + promo.value;
        const { error: updateError } = await admin.from('users').update({ cash_balance: newBal }).eq('id', user.id);
        if (updateError) return { error: "Failed to credit funds" };
    }

    // B. Record Redemption
    await admin.from('promo_redemptions').insert({
        user_id: user.id,
        code_id: promo.id
    });

    // C. Increment Count
    await admin.from('promo_codes').update({ used_count: promo.used_count + 1 }).eq('id', promo.id);

    revalidatePath('/', 'layout');
    return { success: true, value: promo.value };
}

export async function createPromoCode(code: string, value: number, maxUses: number = 1) {
    const admin = createAdminClient();
    if (!admin) return { error: "System Error: Admin unavailable" };

    // Ideally check if caller is admin, but admin client bypasses RLS anyway.
    // In a real app we'd check session user role.

    const { error } = await admin.from('promo_codes').insert({
        code: code.toUpperCase().trim(),
        value,
        max_uses: maxUses
    });

    if (error) return { error: "Failed to create code: " + error.message };

    revalidatePath('/profile/admin');
    return { success: true };
}
