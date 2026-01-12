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

        if (tournamentId && userId) {
            const supabase = createAdminClient();

            if (!supabase) {
                console.error("Webhook Error: Admin Client failed to initialize. Check SUPABASE_SERVICE_ROLE_KEY.");
                return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
            }

            // 1. Mark as Paid or Create Entry
            // We assume entry exists or we upsert it.
            // But usually we join first? Or join on pay?
            // "Upsert" is safest.
            const { error } = await supabase
                .from("tournament_entries")
                .upsert({
                    tournament_id: tournamentId,
                    user_id: userId,
                    paid: true,
                    stripe_checkout_session_id: session.id,
                    stripe_payment_intent_id: session.payment_intent,
                    current_stack: 500, // Or whatever default starting stack
                    // Ensure we don't reset stack if they re-paid? Unlikely for one-time payment
                }, { onConflict: 'user_id, tournament_id' });

            if (error) {
                console.error("Error updating tournament entry:", error);
            } else {
                console.log(`User ${userId} paid for Tournament ${tournamentId}`);
            }
        }
    }

    return NextResponse.json({ received: true });
}
