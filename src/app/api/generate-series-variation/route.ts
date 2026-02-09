import { NextResponse } from 'next/server';
import { ContentMode } from '@/types';
import { getUserApiKey } from '@/lib/getUserApiKey';

// System prompt for generating pose/angle variations
const SERIES_VARIATION_SYSTEM = `You are a professional photography director planning a photo series.

YOUR TASK: Given a scene description, generate a natural variation for the next shot in the series.

CRITICAL RULES:
1. KEEP the same location, outfit, and lighting
2. CHANGE ONLY: camera angle, pose, expression, or framing
3. Be specific and visual in your description
4. Variations should feel like a natural continuation of a photoshoot
5. Maximum 25 words

VARIATION IDEAS:
- Different camera angle (closer, wider, from the side, from above)
- Different pose (sitting → standing, leaning, walking)
- Different expression (smiling → pensive, laughing, looking away)
- Different framing (full body → portrait, detail shot)
- Different interaction with environment (touching hair, holding props)

OUTPUT: Return ONLY the variation description, no explanation.

Example:
Input: "sitting at a café, wearing a white dress, morning light"
Output: "leaning forward with coffee cup, soft smile, close-up portrait shot, same café setting"`;

export async function POST(request: Request) {
    try {
        const {
            originalPrompt,
            seriesContext,
            contentMode = 'social'
        }: {
            originalPrompt: string;
            seriesContext?: { location?: string; outfit?: string; lighting?: string };
            contentMode?: ContentMode;
        } = await request.json();

        // Get user's API key (falls back to env var if not configured)
        const apiKey = await getUserApiKey();

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Aucune clé API Wavespeed configurée. Veuillez configurer votre clé dans les paramètres.' },
                { status: 500 }
            );
        }

        // Build context from series info
        let contextDescription = originalPrompt || 'A lifestyle photoshoot';
        if (seriesContext) {
            const parts = [];
            if (seriesContext.location) parts.push(`Location: ${seriesContext.location}`);
            if (seriesContext.outfit) parts.push(`Outfit: ${seriesContext.outfit}`);
            if (seriesContext.lighting) parts.push(`Lighting: ${seriesContext.lighting}`);
            if (parts.length > 0) {
                contextDescription += `\n\nContext:\n${parts.join('\n')}`;
            }
        }

        const isSensual = contentMode === 'sensual' || contentMode === 'porn';
        const moodHint = isSensual
            ? 'Make the variation sensual and alluring while keeping the same intimate setting.'
            : 'Keep it natural and lifestyle-appropriate.';

        const userMessage = `Current scene: ${contextDescription}

${moodHint}

Generate the next shot variation:`;

        const response = await fetch('https://llm.wavespeed.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4.5',
                messages: [
                    { role: 'system', content: SERIES_VARIATION_SYSTEM },
                    { role: 'user', content: userMessage },
                ],
                max_tokens: 100,
                temperature: 0.8,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Wavespeed LLM API Error:', errorData);
            throw new Error(errorData.error?.message || `LLM API error (${response.status})`);
        }

        const data = await response.json();
        const variationPrompt = data.choices?.[0]?.message?.content;

        if (!variationPrompt) {
            throw new Error('No variation generated');
        }

        return NextResponse.json({
            variationPrompt: variationPrompt.trim(),
        });
    } catch (error) {
        console.error('Generate series variation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate variation' },
            { status: 500 }
        );
    }
}
