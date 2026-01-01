import { NextResponse } from 'next/server';
import { constructWebhookEvent, stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(request: Request) {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = constructWebhookEvent(payload, signature);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                if (session.mode === 'subscription' && session.customer && session.subscription) {
                    const customerId = session.customer as string;
                    const subscriptionId = session.subscription as string;

                    // Get customer email
                    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;

                    // Create or update user in database
                    await db.upsertUser({
                        id: customerId,
                        email: customer.email || 'unknown@example.com',
                        plan: 'pro',
                        stripeSubscriptionId: subscriptionId,
                    });

                    console.log(`✅ Pro subscription activated for ${customer.email}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                const user = await db.getUserById(customerId);

                if (user) {
                    const isActive = subscription.status === 'active';
                    await db.upsertUser({
                        ...user,
                        plan: isActive ? 'pro' : 'free',
                        stripeSubscriptionId: isActive ? subscription.id : undefined,
                    });
                    console.log(`📝 Subscription ${subscription.status} for ${user.email}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                const user = await db.getUserById(customerId);

                if (user) {
                    await db.upsertUser({
                        ...user,
                        plan: 'free',
                        stripeSubscriptionId: undefined,
                    });
                    console.log(`❌ Subscription canceled for ${user.email}`);
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}
