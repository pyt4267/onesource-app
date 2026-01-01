/**
 * Database abstraction layer
 * 
 * For local development: Uses in-memory storage
 * For production (Cloudflare): Will use D1
 * 
 * This allows us to develop without Cloudflare D1 locally,
 * then switch to D1 when deploying to Cloudflare Pages.
 */

interface User {
    id: string;           // Stripe Customer ID
    email: string;
    plan: 'free' | 'pro';
    stripeSubscriptionId?: string;
    createdAt: number;
}

interface UsageRecord {
    id: number;
    userId: string | null;
    contentUrl: string;
    createdAt: number;
}

// In-memory storage for development
const users: Map<string, User> = new Map();
const usage: UsageRecord[] = [];
let usageIdCounter = 1;

export const db = {
    /**
     * Create or update a user
     */
    async upsertUser(user: Omit<User, 'createdAt'> & { createdAt?: number }): Promise<User> {
        const existingUser = users.get(user.id);
        const newUser: User = {
            ...user,
            createdAt: existingUser?.createdAt || user.createdAt || Date.now(),
        };
        users.set(user.id, newUser);
        return newUser;
    },

    /**
     * Get user by Stripe Customer ID
     */
    async getUserById(id: string): Promise<User | null> {
        return users.get(id) || null;
    },

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<User | null> {
        for (const user of users.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    },

    /**
     * Record a content generation usage
     */
    async recordUsage(userId: string | null, contentUrl: string): Promise<UsageRecord> {
        const record: UsageRecord = {
            id: usageIdCounter++,
            userId,
            contentUrl,
            createdAt: Date.now(),
        };
        usage.push(record);
        return record;
    },

    /**
     * Get monthly usage count for a user (or anonymous)
     */
    async getMonthlyUsageCount(userId: string | null): Promise<number> {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        return usage.filter(
            (u) => u.userId === userId && u.createdAt > thirtyDaysAgo
        ).length;
    },

    /**
     * Check if user can generate content based on their plan
     */
    async canGenerate(userId: string | null): Promise<{ allowed: boolean; reason?: string; remainingFree?: number }> {
        // Pro users have unlimited access
        if (userId) {
            const user = await this.getUserById(userId);
            if (user?.plan === 'pro') {
                return { allowed: true };
            }
        }

        // Free users (including anonymous) get 1 per month
        const monthlyCount = await this.getMonthlyUsageCount(userId);
        const FREE_LIMIT = 1;

        if (monthlyCount >= FREE_LIMIT) {
            return {
                allowed: false,
                reason: 'Free plan limit reached. Upgrade to Pro for unlimited access.',
                remainingFree: 0
            };
        }

        return {
            allowed: true,
            remainingFree: FREE_LIMIT - monthlyCount
        };
    },
};

export type { User, UsageRecord };
