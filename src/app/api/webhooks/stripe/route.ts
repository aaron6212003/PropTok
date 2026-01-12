import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature") as string;

    let event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.error("STRIPE_WEBHOOK_SECRET is missing");
            // Don't fail the request yet, try to see if it works without signature (local dev sometimes)
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const tournamentId = session.metadata?.tournamentId;
        const type = session.metadata?.type;
        const amountTotal = session.amount_total; // in cents

        if (!userId) {
            console.error("Missing userId in session metadata", session.id);
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const supabase = createAdminClient();
        if (!supabase) {
            console.error("Webhook Error: No Admin Client");
            return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
        }

        const amountDollars = (amountTotal || 0) / 100;

        // CASE A: TOURNAMENT ENTRY
        if (tournamentId || type === 'tournament_entry') {
            const tId = tournamentId || session.metadata?.id;
            const { error: entryError } = await supabase.rpc('join_tournament_atomic', {
                p_user_id: userId,
                p_tournament_id: tId,
                p_session_id: session.id,
                p_payment_intent: session.payment_intent,
                p_stack: 1000 // Default stack
            });

            if (entryError) {
                console.error("Error creating tournament entry:", entryError);
            } else {
                console.log(`User ${userId} successfully joined tournament ${tId}`);
            }
        }

        // CASE B: WALLET DEPOSIT
        if (type === 'deposit') {
            // 1. Update Balance Atomically
            const { error: balanceError } = await supabase.rpc('increment_balance', {
                p_user_id: userId,
                p_amount: amountDollars
            });

            if (balanceError) {
                console.error("RPC increment_balance failed, falling back to direct update:", balanceError);
                // Fallback direct update (Admin client bypasses RLS)
                const { data: user } = await supabase.from('users').select('cash_balance').eq('id', userId).single();
                if (user) {
                    await supabase.from('users').update({
                        cash_balance: (user.cash_balance || 0) + amountDollars
                    }).eq('id', userId);
                }
            }

            // 2. Log Transaction
            await supabase.from("transactions").insert({
                user_id: userId,
                amount: amountDollars,
                type: "DEPOSIT",
                description: "Stripe Deposit",
                reference_id: session.id
            });

            console.log(`Successfully funded user ${userId} with $${amountDollars}`);
        }
    }

    return NextResponse.json({ received: true });
}
