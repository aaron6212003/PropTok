"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPredictions(onlyOpen: boolean = false) {
    const supabase = await createClient();
    let query = supabase
        .from("predictions")
        .select("*")
        .order("created_at", { ascending: false });

    if (onlyOpen) {
        query = query.eq("resolved", false);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching predictions:", error);
        return [];
    }

    return data;
}

export async function submitVote(predictionId: string, side: 'YES' | 'NO', wager: number, tournamentId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // 1. Determine Wallet (Main Bankroll or Tournament Stack)
    if (tournamentId) {
        // Tournament Logic
        const { data: entry, error: entryError } = await supabase
            .from("tournament_entries")
            .select("current_stack")
            .eq("tournament_id", tournamentId)
            .eq("user_id", user.id)
            .single();

        if (entryError || !entry) return { error: "Not entered in this tournament" };
        if (entry.current_stack < wager) return { error: "Insufficient tournament chips" };

        // Deduct from Tournament Stack
        const { error: deductError } = await supabase
            .from("tournament_entries")
            .update({ current_stack: entry.current_stack - wager })
            .eq("tournament_id", tournamentId)
            .eq("user_id", user.id);

        if (deductError) return { error: "Tournament transaction failed" };

    } else {
        // Main Bankroll Logic
        const { data: userInfo, error: userError } = await supabase
            .from("users")
            .select("bankroll")
            .eq("id", user.id)
            .single();

        if (userError || !userInfo) return { error: "User not found" };
        if (userInfo.bankroll < wager) return { error: "Insufficient funds" };

        // Deduct from Main Bankroll
        const { error: deductError } = await supabase
            .from("users")
            .update({ bankroll: userInfo.bankroll - wager })
            .eq("id", user.id);

        if (deductError) return { error: "Transaction failed" };
    }

    // 2. Check if already voted (in this context? simplified to one-per-prediction for now, ignoring tournament overlap edge case)
    const { data: existingVote } = await supabase
        .from("votes")
        .select("*")
        .eq("user_id", user.id)
        .eq("prediction_id", predictionId)
        .single(); // Note: Ideally we allow one vote per tournament vs main, but schema unique constraint might block.
    // Fix: If schema has unique(user_id, prediction_id), we can't vote twice. 
    // Access: "Already voted" is fine for MVP.

    if (existingVote) return { error: "Already voted on this prediction" };

    // 3. Implied Odds
    const { data: prediction } = await supabase.from("predictions").select("yes_percent").eq("id", predictionId).single();
    let yesProb = (prediction?.yes_percent || 50) / 100;
    yesProb = Math.max(0.01, Math.min(0.99, yesProb));
    const probability = side === 'YES' ? yesProb : (1 - yesProb);
    const multiplier = Number((0.95 / probability).toFixed(2));

    // 4. Insert Vote
    const { error } = await supabase.from("votes").insert({
        user_id: user.id,
        prediction_id: predictionId,
        side: side,
        wager: wager,
        payout_multiplier: multiplier,
        tournament_id: tournamentId || null
    });

    if (error) {
        console.error("Vote error:", error);
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    revalidatePath("/profile", "layout");
    return { success: true };
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

    revalidatePath("/");
    revalidatePath("/admin");
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

    return data;
}

export async function getUserBundles(limit: number = 50, onlyUnacknowledged: boolean = false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

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

    return data;
}

export async function acknowledgeResults() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Batch acknowledge both votes and bundles
    const [votesRes, bundlesRes] = await Promise.all([
        supabase
            .from("votes")
            .update({ acknowledged: true })
            .eq("user_id", user.id)
            .eq("acknowledged", false),
        supabase
            .from("bundles")
            .update({ acknowledged: true })
            .eq("user_id", user.id)
            .eq("acknowledged", false)
    ]);

    if (votesRes.error || bundlesRes.error) {
        return { error: "Failed to acknowledge results" };
    }

    revalidatePath("/profile");
    return { success: true };
}

export async function placeBundleWager(legs: { id: string, side: 'YES' | 'NO', multiplier: number }[], wager: number, tournamentId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // 1. Determine Wallet & Deduct
    if (tournamentId) {
        const { data: entry, error: entryError } = await supabase
            .from("tournament_entries")
            .select("current_stack")
            .eq("tournament_id", tournamentId)
            .eq("user_id", user.id)
            .single();

        if (entryError || !entry) return { error: "Not entered in tournament" };
        if (entry.current_stack < wager) return { error: "Insufficient tournament stack" };

        const { error: deductError } = await supabase.from("tournament_entries")
            .update({ current_stack: entry.current_stack - wager })
            .eq("tournament_id", tournamentId)
            .eq("user_id", user.id);

        if (deductError) return { error: "Tournament transaction failed" };
    } else {
        const { data: userInfo } = await supabase.from("users").select("bankroll").eq("id", user.id).single();
        if (!userInfo || userInfo.bankroll < wager) return { error: "Insufficient funds" };
        const { error: deductError } = await supabase.from("users").update({ bankroll: userInfo.bankroll - wager }).eq("id", user.id);

        if (deductError) return { error: "Transaction failed" };
    }

    // 2. Calculate Combined Multiplier
    const totalMultiplier = legs.reduce((acc, leg) => acc * leg.multiplier, 1);

    // 3. Create Bundle
    const { data: bundle, error: bundleError } = await supabase.from("bundles").insert({
        user_id: user.id,
        wager,
        total_multiplier: totalMultiplier,
        status: 'PENDING',
        tournament_id: tournamentId || null
    }).select().single();

    if (bundleError || !bundle) {
        console.error("Bundle creation error:", bundleError);
        return { error: bundleError?.message || "Failed to create bundle" };
    }

    // 5. Create Legs
    const bundleLegs = legs.map(leg => ({
        bundle_id: bundle.id,
        prediction_id: leg.id,
        side: leg.side,
        multiplier: leg.multiplier
    }));

    const { error: legsError } = await supabase.from("bundle_legs").insert(bundleLegs);
    if (legsError) return { error: "Failed to create bundle legs" };

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

    revalidatePath("/leaderboard");
    revalidatePath("/");
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

    revalidatePath("/");
    revalidatePath("/admin");
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

    if (error) {
        console.error("User Tournament Entries Error:", error);
        return [];
    }

    return data;
}
