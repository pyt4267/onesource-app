import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'edge';

interface GeneratedContent {
    summary: string;
    tiktok: {
        hook: string;
        body: string;
        cta: string;
    };
    xThread: string[];
    linkedin: string;
    note: string;
    watermark: boolean;
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cheerio from 'cheerio';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

/**
 * Extract text from URL using Cheerio
 */
async function extractTextFromUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove scripts, styles, and other non-content elements
        $('script, style, nav, footer, iframe, svg, noscript').remove();

        // Extract text from body or main content
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        return text.substring(0, 20000); // Limit context window just in case
    } catch (error) {
        console.error('Scraping error:', error);
        throw new Error('Failed to extract content from URL');
    }
}

/**
 * Generate content using Gemini 2.5 Flash
 */
async function generateContent(url: string, isPro: boolean, tone: string): Promise<GeneratedContent> {
    const text = await extractTextFromUrl(url);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use 1.5 Flash for stability

    // Authenticated user has access to gemini-2.5-flash as per screenshot, but we stick to 1.5 for basic path unless confirmed.
    // Actually, sticking to 1.5-flash as default is safer.

    const aiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

    const prompt = `
    You are an expert content strategist. Your goal is to repurpose the following text into multiple formats for social media.
    
    Tone: ${tone || "Professional and engaging"}
    
    Source Text:
    ${text.substring(0, 15000)}

    Output exactly valid JSON matching this schema:
    {
        "summary": "Concise summary of the content (markdown supported)",
        "tiktok": {
            "hook": "Attention grabbing hook (max 1 sentence)",
            "body": "Script body (3-4 sentences)",
            "cta": "Call to action"
        },
        "xThread": ["Tweet 1", "Tweet 2", "Tweet 3", "Tweet 4", "Tweet 5"],
        "linkedin": "Professional LinkedIn post with line breaks",
        "note": "Japanese Note.com style article summarizing the content (Markdown)"
    }
    
    Ensure the "note" field involves Japanese translation/summarization even if source is English.
    `;

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const jsonString = response.text();

    let parsed: any;
    try {
        parsed = JSON.parse(jsonString);
    } catch {
        // Fallback or simple cleanup if markdown fences exist
        const cleaned = jsonString.replace(/```json/g, '').replace(/```/g, '');
        parsed = JSON.parse(cleaned);
    }

    return {
        summary: parsed.summary || "Summary generation failed.",
        tiktok: {
            hook: parsed.tiktok?.hook || "Hook failed",
            body: parsed.tiktok?.body || "Body failed",
            cta: parsed.tiktok?.cta || "CTA failed",
        },
        xThread: Array.isArray(parsed.xThread) ? parsed.xThread : ["Thread generation failed"],
        linkedin: parsed.linkedin || "LinkedIn generation failed",
        note: parsed.note || "Note generation failed",
        watermark: !isPro,
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { url, userId, tone } = body;

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        // Check if user can generate
        const canGenResult = await db.canGenerate(userId || null);

        if (!canGenResult.allowed) {
            return NextResponse.json(
                {
                    error: canGenResult.reason,
                    upgradeRequired: true
                },
                { status: 403 }
            );
        }

        // Determine if user is Pro
        let isPro = false;
        if (userId) {
            const user = await db.getUserById(userId);
            isPro = user?.plan === 'pro';
        }

        // Generate content
        const content = await generateContent(url, isPro, tone);

        // Record usage
        await db.recordUsage(userId || null, url, JSON.stringify(content), tone);

        return NextResponse.json({
            success: true,
            content,
            remainingFree: isPro ? null : (canGenResult.remainingFree ?? 0) - 1,
        });
    } catch (error) {
        console.error('Generate error details:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json(
            { error: 'Failed to generate content: ' + (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}
