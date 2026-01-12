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

        // 2. Create Stripe Checkout Session (Hosted)
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Entry: ${tournament.title || tournament.name}`, // Fallback if title missing
                            description: `Entry fee for tournament ${tournament.name}`,
                        },
                        unit_amount: tournament.entry_fee_cents || 1000,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.get("origin")}/tournaments/${tournamentId}?success=true`,
            cancel_url: `${req.headers.get("origin")}/tournaments/${tournamentId}?canceled=true`,
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

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
