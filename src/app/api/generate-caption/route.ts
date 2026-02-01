import { NextResponse } from 'next/server';
import { ContentMode } from '@/types';

// System prompts for caption generation
const SOCIAL_CAPTION_SYSTEM = `You are a professional social media manager for a lifestyle influencer.

YOUR TASK: Generate an engaging Instagram caption for a photo.

RULES:
1. Keep it short and punchy (1-2 sentences max)
2. Use 2-4 relevant emojis naturally placed
3. Match the vibe: casual, relatable, aspirational
4. NO generic phrases like "living my best life"
5. Be authentic and conversational
6. Include a subtle call-to-action or question occasionally

OUTPUT FORMAT (JSON):
{
  "caption": "Your caption text with emojis",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

Provide 5-8 relevant hashtags. Mix popular and niche tags.
Return ONLY valid JSON, no markdown.`;

const SENSUAL_CAPTION_SYSTEM = `You are a social media manager for a sensual/boudoir content creator.

YOUR TASK: Generate an alluring Instagram caption for an intimate photo.

RULES:
1. Keep it short and mysterious (1-2 sentences max)
2. Use 2-3 elegant emojis (🖤 🌙 ✨ 🔥 💋)
3. Be suggestive but tasteful - never explicit
4. Create intrigue and desire
5. Confident but not desperate

OUTPUT FORMAT (JSON):
{
  "caption": "Your caption text with emojis",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

Provide 5-8 relevant hashtags for sensual/boudoir content.
Return ONLY valid JSON, no markdown.`;

export async function POST(request: Request) {
    try {
        const {
            influencerName,
            imageDescription,
            contentMode = 'social'
        }: {
            influencerName: string;
            imageDescription: string;
            contentMode?: ContentMode;
        } = await request.json();

        const apiKey = process.env.WAVESPEED_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'WAVESPEED_API_KEY is not configured' },
                { status: 500 }
            );
        }

        const isSensual = contentMode === 'sensual' || contentMode === 'porn';
        const systemPrompt = isSensual ? SENSUAL_CAPTION_SYSTEM : SOCIAL_CAPTION_SYSTEM;

        const userMessage = `Generate a caption for this photo:
Influencer: ${influencerName}
Scene description: ${imageDescription || 'A beautiful lifestyle photo'}
Content style: ${isSensual ? 'sensual/boudoir' : 'lifestyle/fashion'}`;

        const response = await fetch('https://llm.wavespeed.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4.5',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                max_tokens: 300,
                temperature: 0.9,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Wavespeed LLM API Error:', errorData);
            throw new Error(errorData.error?.message || `LLM API error (${response.status})`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('No caption generated');
        }

        // Parse JSON response - handle markdown code blocks
        try {
            let jsonContent = content.trim();

            // Remove markdown code blocks if present
            if (jsonContent.startsWith('```json')) {
                jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonContent.startsWith('```')) {
                jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const parsed = JSON.parse(jsonContent.trim());
            return NextResponse.json({
                caption: parsed.caption || '',
                hashtags: parsed.hashtags || [],
            });
        } catch {
            // Fallback if JSON parsing fails - try to extract caption manually
            console.warn('Failed to parse caption JSON, attempting extraction');

            // Try to extract caption from the content
            const captionMatch = content.match(/"caption"\s*:\s*"([^"]+)"/);
            const hashtagsMatch = content.match(/"hashtags"\s*:\s*\[([^\]]+)\]/);

            let caption = captionMatch ? captionMatch[1] : content.trim();
            let hashtags: string[] = [];

            if (hashtagsMatch) {
                try {
                    hashtags = JSON.parse(`[${hashtagsMatch[1]}]`);
                } catch {
                    // Extract hashtags manually
                    hashtags = hashtagsMatch[1].match(/"([^"]+)"/g)?.map((h: string) => h.replace(/"/g, '')) || [];
                }
            }

            return NextResponse.json({
                caption,
                hashtags,
            });
        }
    } catch (error) {
        console.error('Generate caption error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate caption' },
            { status: 500 }
        );
    }
}
