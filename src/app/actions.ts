"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPredictions() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .order("created_at", { ascending: false });

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

    revalidatePath("/");
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

    // Default to 24h from now for simplicity
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from("predictions").insert({
        question,
        category,
        description,
        oracle_id,
        oracle_type,
        target_value,
        target_slug,
        expires_at: expiresAt,
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

    const { error } = await supabase.rpc('resolve_prediction', {
        p_id: id,
        p_outcome: outcome
    });

    if (error) {
        console.error("Resolve error:", error);
        return { error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/admin");
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
