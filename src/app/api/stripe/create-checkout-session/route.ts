import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
    try {
        const { tournamentId, amount, type } = await req.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let lineItem;
        let metadata = { userId: user.id } as any;
        let successUrl = `${req.headers.get("origin")}/profile?deposit_success=true`;
        let cancelUrl = `${req.headers.get("origin")}/wallet?canceled=true`;

        // CASE A: TOURNAMENT ENTRY
        if (tournamentId) {
            const { data: tournament } = await supabase
                .from("tournaments")
                .select("*")
                .eq("id", tournamentId)
                .single();

            if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

            lineItem = {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Entry: ${tournament.name}`,
                        description: `Entry fee for tournament`,
                    },
                    unit_amount: tournament.entry_fee_cents || 1000,
                },
                quantity: 1,
            };

            metadata.tournamentId = tournament.id;
            metadata.type = 'tournament_entry';
            successUrl = `${req.headers.get("origin")}/tournaments/${tournamentId}?success=true&session_id={CHECKOUT_SESSION_ID}`;
            cancelUrl = `${req.headers.get("origin")}/tournaments/${tournamentId}?canceled=true`;
        }
        // CASE B: GENERIC DEPOSIT
        else if (type === 'deposit' && amount) {
            lineItem = {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Wallet Deposit`,
                        description: `Add funds to your account`,
                    },
                    unit_amount: amount, // Amount in cents passed from client
                },
                quantity: 1,
            };
            metadata.type = 'deposit';
        } else {
            return NextResponse.json({ error: "Invalid Request. Missing tournamentId or deposit amount." }, { status: 400 });
        }

        // 2. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            line_items: [lineItem],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: metadata,
            payment_intent_data: {
                metadata: metadata
            }
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
