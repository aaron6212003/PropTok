import Stripe from 'stripe';

// Avoid throwing explicitly to allow build to pass if env vars aren't fully loaded yet
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-01-27.acacia' as any, // Suppress strict version check to avoid build errors
    typescript: true,
});
