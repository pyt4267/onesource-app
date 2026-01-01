/**
 * Database abstraction layer
 * 
 * Hybrid implementation:
 * - Production: Uses Cloudflare D1 (via process.env.DB binding)
 * - Development (Local): Uses In-Memory Map (unless using wrangler dev with binding)
 */

interface D1Database {
    prepare: (query: string) => D1PreparedStatement;
    dump: () => Promise<ArrayBuffer>;
    batch: (statements: D1PreparedStatement[]) => Promise<D1Result[]>;
    exec: (query: string) => Promise<D1ExecResult>;
}

interface D1PreparedStatement {
    bind: (...values: any[]) => D1PreparedStatement;
    first: <T = unknown>(colName?: string) => Promise<T | null>;
    run: <T = unknown>() => Promise<D1Result<T>>;
    all: <T = unknown>() => Promise<D1Result<T>>;
    raw: <T = unknown>() => Promise<T[]>;
}

interface D1Result<T = unknown> {
    results: T[];
    success: boolean;
    meta: any;
    error?: string;
}

interface D1ExecResult {
    count: number;
    duration: number;
}

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
    generatedContent?: string;
    tone?: string;
    createdAt: number;
}

// === In-Memory Fallback ===
const memoryUsers: Map<string, User> = new Map();
const memoryUsage: UsageRecord[] = [];
let memoryUsageIdCounter = 1;

// === access D1 ===
function getD1(): D1Database | null {
    // @ts-ignore
    return process.env.DB as D1Database || null;
}

export const db = {
    /**
     * Create or update a user
     */
    async upsertUser(user: Omit<User, 'createdAt'> & { createdAt?: number }): Promise<User> {
        const d1 = getD1();
        const now = user.createdAt || Date.now();

        if (d1) {
            // D1 Implementation
            await d1.prepare(`
                INSERT INTO users (id, email, plan, stripe_subscription_id, created_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    email = excluded.email,
                    plan = excluded.plan,
                    stripe_subscription_id = excluded.stripe_subscription_id
            `).bind(user.id, user.email, user.plan, user.stripeSubscriptionId || null, now).run();

            return { ...user, createdAt: now };
        } else {
            // Memory Fallback
            const existingUser = memoryUsers.get(user.id);
            const newUser: User = {
                ...user,
                createdAt: existingUser?.createdAt || now,
            };
            memoryUsers.set(user.id, newUser);
            return newUser;
        }
    },

    /**
     * Get user by Stripe Customer ID
     */
    async getUserById(id: string): Promise<User | null> {
        const d1 = getD1();
        if (d1) {
            const result = await d1.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<any>();
            if (!result) return null;
            return {
                id: result.id,
                email: result.email,
                plan: result.plan as 'free' | 'pro',
                stripeSubscriptionId: result.stripe_subscription_id,
                createdAt: result.created_at
            };
        } else {
            return memoryUsers.get(id) || null;
        }
    },

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<User | null> {
        const d1 = getD1();
        if (d1) {
            const result = await d1.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<any>();
            if (!result) return null;
            return {
                id: result.id,
                email: result.email,
                plan: result.plan as 'free' | 'pro',
                stripeSubscriptionId: result.stripe_subscription_id,
                createdAt: result.created_at
            };
        } else {
            for (const user of memoryUsers.values()) {
                if (user.email === email) return user;
            }
            return null;
        }
    },

    /**
     * Record a content generation usage
     */
    async recordUsage(userId: string | null, contentUrl: string, generatedContent?: string, tone?: string): Promise<UsageRecord> {
        const d1 = getD1();
        const now = Date.now();

        if (d1) {
            await d1.prepare(`
                INSERT INTO usage (user_id, content_url, generated_content, tone, created_at)
                VALUES (?, ?, ?, ?, ?)
            `).bind(userId, contentUrl, generatedContent || null, tone || null, now).run();

            return {
                id: 0,
                userId,
                contentUrl,
                generatedContent,
                tone,
                createdAt: now
            };
        } else {
            const record: UsageRecord = {
                id: memoryUsageIdCounter++,
                userId,
                contentUrl,
                generatedContent,
                tone,
                createdAt: now,
            };
            memoryUsage.push(record);
            return record;
        }
    },

    /**
     * Get history for a user
     */
    async getHistory(userId: string, limit = 20): Promise<UsageRecord[]> {
        const d1 = getD1();
        if (d1) {
            const results = await d1.prepare(`
                SELECT * FROM usage 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `).bind(userId, limit).all<any>();

            if (!results.results) return [];

            return results.results.map(r => ({
                id: r.id,
                userId: r.user_id,
                contentUrl: r.content_url,
                generatedContent: r.generated_content,
                tone: r.tone,
                createdAt: r.created_at
            }));
        } else {
            return memoryUsage
                .filter(u => u.userId === userId)
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, limit);
        }
    },

    /**
     * Get monthly usage count for a user (or anonymous)
     */
    async getMonthlyUsageCount(userId: string | null): Promise<number> {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000); // approx

        const d1 = getD1();
        if (d1) {
            if (!userId) return 0; // Anonymous limit handled elsewhere or session?

            const result = await d1.prepare(`
                SELECT COUNT(*) as count FROM usage 
                WHERE user_id = ? AND created_at > ?
            `).bind(userId, thirtyDaysAgo).first<{ count: number }>();

            return result?.count || 0;
        } else {
            return memoryUsage.filter(
                (u) => u.userId === userId && u.createdAt > thirtyDaysAgo
            ).length;
        }
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
