import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const user = await db.getUserById(userId);

        // Check if user exists and is Pro
        // Feature Requirement: Save & History = Pro Only
        if (!user || user.plan !== 'pro') {
            return NextResponse.json({
                error: 'History is a Pro feature.',
                upgradeRequired: true
            }, { status: 403 });
        }

        const history = await db.getHistory(userId);

        return NextResponse.json({
            success: true,
            history
        });
    } catch (error) {
        console.error('History API error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
