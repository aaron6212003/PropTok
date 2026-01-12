import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature || "",
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const tournamentId = session.metadata?.tournamentId;
        const userId = session.metadata?.userId;
        const type = session.metadata?.type; // 'tournament_entry' or 'deposit'

        if (userId) {
            const supabase = createAdminClient();

            if (!supabase) {
                console.error("Webhook Error: No Admin Client");
                return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
            }

            // CASE A: TOURNAMENT ENTRY
            if (tournamentId) {
                const { error } = await supabase
                    .from("tournament_entries")
                    .upsert({
                        tournament_id: tournamentId,
                        user_id: userId,
                        paid: true,
                        stripe_checkout_session_id: session.id,
                        stripe_payment_intent_id: session.payment_intent,
                        current_stack: 1000
                    }, { onConflict: 'user_id, tournament_id' });

                if (error) console.error("Error creating entry:", error);
                else console.log(`User ${userId} joined tournament ${tournamentId}`);
            }
            // CASE B: DEPOSIT
            else if (type === 'deposit') {
                const amountCents = session.amount_total; // e.g., 2500 for $25.00
                const amountDollars = amountCents / 100;

                // 1. Get current
                const { data: u } = await supabase.from('users').select('cash_balance').eq('id', userId).single();
                const current = u?.cash_balance || 0;

                // 2. Increment
                const { error } = await supabase.from('users').update({
                    cash_balance: current + amountDollars
                }).eq('id', userId);

                if (error) console.error("Error processing deposit:", error);
                else console.log(`User ${userId} deposited $${amountDollars}`);
            }
        }
    }

    return NextResponse.json({ received: true });
}
