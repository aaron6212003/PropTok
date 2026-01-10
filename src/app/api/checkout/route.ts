import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if using placeholder key
        // Check if using placeholder key
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key || key === 'sk_test_placeholder' || key.includes('placeholder')) {
            const status = key ? `Invalid (Value: ${key.substring(0, 5)}...)` : "Missing";
            console.error(`Stripe Config Error: ${status}`);
            return NextResponse.json({
                error: `Payment System Error: Key is ${status}. Check Vercel Env Vars.`
            }, { status: 500 });
        }

        // --- DIAGNOSTIC START ---
        // Log key status safely
        console.log(`[Checkout] Key Status: ${key ? 'Present' : 'MISSING'}, Length: ${key?.length}`);
        if (key && key.startsWith('sk_test_')) {
            console.log(`[Checkout] Valid Test Key Prefix Detected: ${key.substring(0, 8)}...`);
        } else if (key && key.startsWith('sk_live_')) {
            console.log(`[Checkout] Valid Live Key Prefix Detected: ${key.substring(0, 8)}...`);
        } else {
            console.warn(`[Checkout] WARNING: Key does not start with sk_test_ or sk_live_. Value: ${key?.substring(0, 5)}...`);
        }
        // --- DIAGNOSTIC END ---

        const body = await req.json();
        const { amount } = body;

        if (!amount || amount < 5) {
            return NextResponse.json({ error: "Minimum deposit is $5" }, { status: 400 });
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "PropTok Wallet Deposit",
                            description: "Add funds to your PropTok account",
                            images: ["https://proptok.vercel.app/icon.png"], // Optional: Replace with real logo
                        },
                        unit_amount: amount * 100, // Amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/wallet?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/wallet/deposit?canceled=true`,
            metadata: {
                userId: user.id,
                type: "DEPOSIT"
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
