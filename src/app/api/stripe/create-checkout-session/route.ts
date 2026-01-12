import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
    try {
        const { tournamentId } = await req.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Fetch Tournament Details
        const { data: tournament } = await supabase
            .from("tournaments")
            .select("*")
            .eq("id", tournamentId)
            .single();

        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        if (tournament.status !== 'open' && tournament.status !== 'active') {
            // Depending on logic, maybe only 'draft' tournaments can't be joined? 
            // Ideally we allow joining 'open'.
        }

        // 2. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            line_items: [
                {
                    // Provide the exact Price ID (e.g. pr_1234) of the product you want to sell
                    // OR use price_data to create one on the fly (easier for dynamic fees)
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Entry: ${tournament.title}`,
                            description: `Entry fee for tournament ${tournament.title}`,
                        },
                        unit_amount: tournament.entry_fee_cents || 1000, // Default $10 if missing
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            redirect_on_completion: 'if_required',
            return_url: `${req.headers.get("origin")}/tournament/${tournamentId}?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                tournamentId: tournament.id,
                userId: user.id,
            },
            payment_intent_data: {
                metadata: {
                    tournamentId: tournament.id,
                    userId: user.id
                }
            }
        });

        return NextResponse.json({ clientSecret: session.client_secret, sessionId: session.id });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
