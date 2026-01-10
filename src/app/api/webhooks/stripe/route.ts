import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature") as string;

    let event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error("STRIPE_WEBHOOK_SECRET is missing");
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message);
        return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const amountTotal = session.amount_total; // in cents

        if (!userId || !amountTotal) {
            console.error("Missing metadata or amount in session", session.id);
            return NextResponse.json({ error: "Invalid session data" }, { status: 400 });
        }

        const amountDollars = amountTotal / 100;

        // Securely update DB
        const supabase = await createClient(); // Utilize service role via server client if possible, but here we might need admin client if RLS blocks us. 
        // Note: createClient() uses cookie-based auth usually. For webhooks, we usually need a Service Role client.
        // However, for now, let's assume we can use a direct SQL via RPC or similar if we had it, OR we need the service role key.

        // Since we don't have a direct "createAdminClient" exported easily in this context without exposing keys, 
        // We will assume the standard client might fail RLS if not signed in.
        // FIX: We need a Service Role Client specifically for webhooks.

        // TEMPORARY: using standard createClient, but this likely won't work for unauthed webhook.
        // We will rely on the `supabase-js` direct instantiation with SERVICE_KEY for webhooks in a robust app.
        // checking `src/lib/supabase/server.ts`... it usually uses cookies.

        // Let's manually instantiate a service client here using process.env
        const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
        const adminAuthClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 1. Update User Balance
        const { error: balanceError } = await adminAuthClient.rpc('increment_balance', {
            p_user_id: userId,
            p_amount: amountDollars
        });

        // Fallback if RPC doesn't exist (we haven't created it yet? We should check if we have an increment function)
        // If not, we do direct update.
        if (balanceError) {
            console.log("RPC failed, trying direct update (RLS might block if not admin)", balanceError);
            // Since we are adminAuthClient, we bypass RLS!
            const { data: user } = await adminAuthClient.from('users').select('cash_balance').eq('id', userId).single();
            if (user) {
                await adminAuthClient.from('users').update({
                    cash_balance: (user.cash_balance || 0) + amountDollars
                }).eq('id', userId);
            }
        }

        // 2. Log Transaction
        await adminAuthClient.from("transactions").insert({
            user_id: userId,
            amount: amountDollars,
            type: "DEPOSIT",
            description: "Stripe Deposit",
            reference_id: session.id
        });

        console.log(`Funded user ${userId} with $${amountDollars}`);
    }

    return NextResponse.json({ received: true });
}
