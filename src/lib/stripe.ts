import Stripe from 'stripe';

// Avoid throwing explicitly to allow build to pass if env vars aren't fully loaded yet
const rawKey = process.env.STRIPE_SECRET_KEY;
const stripeKey = (rawKey || 'sk_test_placeholder').trim();

if (!rawKey) {
    console.warn("⚠️ STRIPE_SECRET_KEY is missing. Using placeholder. Payments will fail.");
}

export const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-01-27.acacia' as any, // Suppress strict version check to avoid build errors
    typescript: true,
});
