
import { NextResponse } from 'next/server';
import { SENSUAL_LLM_SYSTEM_PROMPT, DEFAULT_LLM_SYSTEM_PROMPT } from '@/lib/constants';

// Default system prompt (fallback)
const DEFAULT_SYSTEM_PROMPT =
    "You are an expert AI art prompt engineer specialized in the 'Seedream' and 'Midjourney' distinct styles. " +
    "Your task is to enhance the USER PROMPT to be visually stunning and artistic, while respecting the provided CHARACTER CONTEXT. " +
    "\n\n" +
    "RULES:\n" +
    "1. The CHARACTER CONTEXT describes the fixed subject (appearance, style). DO NOT change or contradict these traits.\n" +
    "2. The USER PROMPT describes the specific scene, action, pose, or setting. This is what you must enhance.\n" +
    "3. Your output must be a seamless extension of the context, but return ONLY the enhanced version of the USER PROMPT part.\n" +
    "4. Do NOT include the character description in your output (it is already applied). Focus on the scene, lighting, camera angle, mood, and texture.\n" +
    "5. Style keywords to consider: volumetric lighting, 8k, masterpiece, highly detailed, sharp focus, cinematic, raw photo.\n" +
    "6. If the user prompt is vague (e.g. 'sitting'), make it specific and artistic (e.g. 'sitting elegantly on a velvet armchair, soft rim lighting').\n" +
    "7. Output ONLY the text of the enhanced prompt. No quotes, no explanations.\n" +
    "8. IMPORTANT: Keep your response CONCISE - maximum 80 words. Use comma-separated keywords, not flowery sentences.";

export async function POST(request: Request) {
    try {
        const { prompt, context, systemPrompt, contentMode } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.WAVESPEED_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'WAVESPEED_API_KEY is not configured in .env.local' },
                { status: 500 }
            );
        }

        // Determine system prompt based on content mode
        let finalSystemPrompt = systemPrompt;
        if (!finalSystemPrompt) {
            finalSystemPrompt = (contentMode === 'sensual' || contentMode === 'porn')
                ? SENSUAL_LLM_SYSTEM_PROMPT
                : DEFAULT_LLM_SYSTEM_PROMPT;
        }

        const userMessage = context
            ? `CHARACTER CONTEXT: ${context}\n\nUSER PROMPT: ${prompt}`
            : `USER PROMPT: ${prompt}`;


        // Use Wavespeed LLM API with OpenAI-compatible format
        // Endpoint: https://llm.wavespeed.ai/v1/chat/completions
        const response = await fetch('https://llm.wavespeed.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4.5',
                messages: [
                    {
                        role: 'system',
                        content: finalSystemPrompt,
                    },
                    {
                        role: 'user',
                        content: userMessage,
                    },
                ],
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Wavespeed LLM API Error:', errorData);
            throw new Error(errorData.error?.message || errorData.message || `Failed to fetch from Wavespeed LLM (Status: ${response.status})`);
        }

        const data = await response.json();

        // OpenAI-compatible format: data.choices[0].message.content
        const enhancedPrompt = data.choices?.[0]?.message?.content;

        if (!enhancedPrompt) {
            console.error('Unexpected Wavespeed response format:', data);
            throw new Error('No content generated');
        }

        return NextResponse.json({ enhancedPrompt: enhancedPrompt.trim() });
    } catch (error) {
        console.error('Enhance prompt error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to enhance prompt' },
            { status: 500 }
        );
    }
}
