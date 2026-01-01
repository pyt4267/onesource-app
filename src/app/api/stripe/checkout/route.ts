import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(request: Request) {
    try {
        const { origin } = new URL(request.url);
        const priceId = process.env.STRIPE_PRICE_ID;

        if (!priceId) {
            return NextResponse.json(
                { error: 'Stripe Price ID not configured' },
                { status: 500 }
            );
        }

        const session = await createCheckoutSession(
            priceId,
            `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            `${origin}/`
        );

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
