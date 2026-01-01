import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_build_fallback', {
    apiVersion: '2025-12-15.clover',
});

export { stripe };

/**
 * Create a Stripe Checkout Session for Pro Plan subscription
 */
export async function createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string) {
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            plan: 'pro',
        },
    });

    return session;
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(email: string) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    return customers.data[0] || null;
}

/**
 * Get subscription status for a customer
 */
export async function getSubscriptionStatus(customerId: string): Promise<'active' | 'canceled' | 'none'> {
    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
    });

    if (subscriptions.data.length > 0) {
        return 'active';
    }

    const canceledSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'canceled',
        limit: 1,
    });

    if (canceledSubs.data.length > 0) {
        return 'canceled';
    }

    return 'none';
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(payload: string, signature: string) {
    return stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
    );
}
