import { NextResponse } from 'next/server';

export async function GET() {
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const stripe = process.env.STRIPE_SECRET_KEY;

    return NextResponse.json({
        serviceRolePrefix: serviceRole ? serviceRole.substring(0, 10) : 'MISSING',
        anonPrefix: anon ? anon.substring(0, 10) : 'MISSING',
        stripePrefix: stripe ? stripe.substring(0, 7) : 'MISSING',
    });
}
