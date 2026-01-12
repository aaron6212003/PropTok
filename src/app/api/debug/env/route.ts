import { NextResponse } from 'next/server';

export async function GET() {
    const key = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    return NextResponse.json({
        hasStripeKey: !!key,
        keyLength: key ? key.length : 0,
        keyStart: key ? key.substring(0, 8) : 'MISSING',
        keyEnd: key ? key.substring(key.length - 4) : 'MISSING',
        hasWebhookSecret: !!webhookSecret,
        NODE_ENV: process.env.NODE_ENV,
    });
}
