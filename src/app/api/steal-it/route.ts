import { NextResponse } from 'next/server';
import { getUserApiKey } from '@/lib/getUserApiKey';

export async function POST(request: Request) {
    try {
        const { imageData } = await request.json();

        if (!imageData) {
            return NextResponse.json(
                { error: 'No image data provided' },
                { status: 400 }
            );
        }

        // Get user's API key (falls back to env var if not configured)
        const apiKey = await getUserApiKey();

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Aucune clé API Wavespeed configurée. Veuillez configurer votre clé dans les paramètres.' },
                { status: 500 }
            );
        }

        // Construct Vision Payload for OpenAI-compatible API
        // Ensure image data is a full data URL
        const imageUrl = imageData.startsWith('data:')
            ? imageData
            : `data:image/jpeg;base64,${imageData}`;

        // System prompt: Pure detailed visual analysis
        const systemPrompt = `You are an expert visual analyst.
Analyze the input image and provide a highly detailed description of:
- Composition and camera angle
- Lighting (direction, color, intensity)
- The pose and action of the subject (ONLY pose/expression, NO physical description)
- Clothing and outfit details
- Background and environment
- Overall mood and style

Rules:
1. Do NOT mention any specific real person names. Use generic terms like "the subject", "a woman", "a man".
2. Do NOT describe physical characteristics of the subject (hair color, hair length, hair style, eye color, skin tone, facial features). Focus exclusively on their POSE, ACTION and EXPRESSION.
3. Be extremely specific about visual details of the SETTING, LIGHTING, and ATTIRE (clothing textures, brands, colors).
4. Do NOT include any intro, outro, or meta-instructions like "EXACT REPLICA", "recreate this", or "this image features".
5. Output ONLY the raw visual description. No quotes.`;

        const response = await fetch('https://llm.wavespeed.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'anthropic/claude-sonnet-4.5', // consistent with codebase
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Analyze this image and generate a prompt to recreate it."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300,
                temperature: 0.5,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Wavespeed API Error:', errorData);
            throw new Error(errorData.error?.message || `Wavespeed API failed: ${response.status}`);
        }

        const data = await response.json();
        const caption = data.choices?.[0]?.message?.content;

        if (!caption) {
            throw new Error("No caption generated");
        }

        return NextResponse.json({ prompt: caption.trim() });

    } catch (error) {
        console.error('Steal It API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to analyze image' },
            { status: 500 }
        );
    }
}
