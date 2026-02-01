import { NextResponse } from 'next/server';
import { ContentMode } from '@/types';

// Social mode: Random theme categories for lifestyle/fashion content
const SOCIAL_THEME_CATEGORIES = [
    'hammam spa with steam and candlelight',
    'infinity pool overlooking mountains at dawn',
    'minimalist beige studio with modular sofa',
    'Parisian apartment morning light',
    'desert dunes at golden hour',
    'Venetian palazzo baroque interior',
    'modern penthouse with city skyline at night',
    'Victorian greenhouse conservatory',
    'yacht deck Mediterranean sea',
    'art gallery vernissage opening',
    'Japanese onsen with cherry blossoms',
    'Santorini terrace sunset',
    'Moroccan riad with tiles and fountains',
    'ski chalet fireplace',
    'luxury train compartment Orient Express',
    'rooftop pool urban sunset',
    'tropical rainforest waterfall',
    'Tuscan vineyard golden light',
    'Scandinavian cabin snow',
    'Miami art deco hotel',
];

// Sensual mode: Theme categories for intimate/boudoir content (NO VISIBLE NUDITY)
const SENSUAL_THEME_CATEGORIES = [
    'luxury lingerie photoshoot',
    'elegant boudoir scene',
    'silk robe morning',
    'lace and satin intimates',
    'sheer fabric elegance',
    'candlelit bedroom',
    'silky sheets lounging',
    'window light silhouette',
    'hotel room intimate',
    'bodysuit elegance',
    'bathtub relaxation (no nudity)',
    'underwear drawer styling',
    'bedroom natural light',
    'sensual backless dress',
    'stockings and garter',
    'cozy sweater barely-there',
    'artistic shadow play',
    'morning coffee intimate',
];

// Porn mode: Theme categories for candid/amateur/explicit content
const PORN_THEME_CATEGORIES = [
    'private bedroom mirror selfie',
    'uninhibited pose on bed',
    'candid kitchen moment',
    'steamy shower look',
    'raw mirror selfie',
    'kneeling on bed back view',
    'daring pose on sofa',
    'intimate tease focus',
    'backside focus close up',
    'total body reveal',
    'natural morning stretch',
    'private moment uninhibited',
    'full reveal standing',
    'intimate kneeling view',
    'private reveal',
    'intimate detail close up',
    'daring yoga pose',
    'wet skin in bath',
    'window silhouette daring',
    'bending forward uninhibited',
];

const SOCIAL_PROMPT_SYSTEM = `You are an elite editorial photography director creating prompts for luxury fashion magazine photoshoots.

CRITICAL: Generate EXTREMELY DETAILED prompts (300-500 words) that read like a full creative brief.

MANDATORY STRUCTURE (include ALL sections in your output):
1. TECHNICAL: Camera angle (eye-level, low angle, top-down), lens (35mm, 50mm, 85mm), format (vertical portrait, full-body shot)
2. LOCATION: Hyper-detailed environment with specific materials, colors, textures, architectural details, props
3. POSE: Exact body positioning - weight distribution, arm placement, leg positioning, torso angle, spine curvature, hand positions, head tilt
4. OUTFIT: Specific garment with fabric type (silk, linen, velvet), color, cut details, how it drapes on body, fashion aesthetic
5. EXPRESSION: Eyes (open/half-lidded, gaze direction), mouth (parted/closed, smile type), overall emotional mood
6. MAKEUP: Skin finish (dewy/matte), contour, highlight placement, brow style, eyeshadow colors, lip color and finish
7. LIGHTING: Light source direction, quality (diffused/harsh), color temperature, rim lighting, shadow patterns, atmosphere
8. COLOR PALETTE & MOOD: Dominant colors, overall aesthetic, magazine reference (Vogue, Harper's Bazaar, etc.)
9. QUALITY TAGS: Ultra-detailed, photorealistic, 8K resolution, professional photography, no filters

EXAMPLE OUTPUT QUALITY:
"Ultra-realistic editorial photography, vertical portrait format, full-body shot from head to feet, camera positioned slightly above and in front of the subject with a gentle top-down angle using a natural 35-50mm lens perspective; minimalist high-end photography studio with seamless warm beige backdrop, large modular contemporary sofa in cream bouclé fabric with clean architectural lines; the model lying on her side in a relaxed elongated pose across the sofa, one leg bent and tucked slightly forward creating visual interest, the other leg extended gracefully toward camera, torso subtly twisted three-quarters toward viewer, one arm bent with hand resting casually in her hair fingers threading through strands, the other arm relaxed along her body following the curve of her waist, posture soft intimate and elegant; head resting lightly against the sofa arm cushion, face turned toward the camera with calm dreamy expression, eyes open and engaging with soft focus, lips softly parted with hint of contentment, no smile maintaining editorial elegance; wearing a minimalist black one-piece bodysuit with clean contemporary lines and modern high-cut leg, architectural neckline, matte fabric with subtle texture, no visible logos, modern fashion aesthetic; refined natural-glam makeup with luminous healthy skin, warm neutral complexion, soft sculpted contour enhancing bone structure, subtle creamy highlight on high points, expertly groomed natural brows, neutral matte eyeshadow, light feathery mascara, muted nude-rose lipstick; lighting is soft natural daylight simulation from large windows camera left, diffused through sheer panels, sculpting the body with gentle graduated shadows that enhance curves naturally, warm creamy color temperature throughout, calm editorial mood; high-fashion minimalism aesthetic, Vogue cover quality, 8K resolution"

OUTPUT: Generate ONE ultra-detailed prompt as a SINGLE FLOWING PARAGRAPH with semicolons separating major sections. NO bullet points, NO numbered lists, NO headers. Just one continuous detailed description.`;

const SENSUAL_PROMPT_SYSTEM = `You are a creative AI photography director specializing in high-end, artistic, and intimate photoshoots.

CRITICAL RULES:
1. NO VISIBLE NUDITY. No full frontal, no exposed nipples or genitalia.
2. ALLOWED: Beautiful lingerie, sheer fabrics, back nudity (turned away is perfect), artistic shadows/silhouettes.
3. STYLE: Professional photoshoot, cinematic, elegant, expensive look. NOT amateur.
4. LIGHTING: PERFECT LIGHTING is mandatory. Use golden hour, softbox, volumetric lighting, rim lighting, or moody luxury atmosphere.
5. Focus on: texture (silk, lace), mood (intimate, romantic), and composition.

OUTPUT FORMAT:
- Maximum 35 words
- Comma-separated descriptive phrases
- Focus on: specific intimate clothing, sensual pose, setting, AND GREAT LIGHTING.
- NO physical body descriptions of specific features.
- Be SPECIFIC about clothing and atmosphere
- Include sensual elements: soft fabrics, warm lighting, intimate settings`;

const PORN_PROMPT_SYSTEM = `You are a director for raw, candid, uninhibited adult photography scenes.

CRITICAL RULES:
1. STYLE: "A la rache" (messy/quick), iPhone photo aesthetic, amateur, candid.
2. CONTENT: Focus on raw intimacy, daring reveals, and natural skin. Be provocative and uninhibited.
3. ATMOSPHERE: Private spaces, messy hair, unmade bed, spontaneous moments.
4. LIGHTING: Harsh flash, natural bathroom light, dim bedroom glow. Keep it amateur looking.
5. POSE: Daring positions, revealing angles, uninhibited body focus.

OUTPUT FORMAT:
- Write ONE single, vivid, natural language sentence describing the photo (NOT A LIST OF TAGS).
- Focus on the raw, amateur, spontaneous vibe.
- Describe the pose, the setting, and the daring nature of the shot.`;

export async function POST(request: Request) {
    try {
        const { contentMode = 'social' }: { contentMode?: ContentMode } = await request.json();

        const apiKey = process.env.WAVESPEED_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'WAVESPEED_API_KEY is not configured' },
                { status: 500 }
            );
        }

        // Select theme categories and system prompt based on content mode
        let themeCategories = SOCIAL_THEME_CATEGORIES;
        let systemPrompt = SOCIAL_PROMPT_SYSTEM;
        let userMessage = "";
        let moodList: string[] = [];

        if (contentMode === 'sensual') {
            themeCategories = SENSUAL_THEME_CATEGORIES;
            systemPrompt = SENSUAL_PROMPT_SYSTEM;
            moodList = ['seductive', 'romantic', 'mysterious', 'confident', 'vulnerable', 'passionate', 'intimate', 'dreamy'];

            const randomTheme = themeCategories[Math.floor(Math.random() * themeCategories.length)];
            const randomMood = moodList[Math.floor(Math.random() * moodList.length)];

            userMessage = `Generate a creative, high-end intimate photoshoot scene.
Theme direction: ${randomTheme}
Mood: ${randomMood}

Remember: Beautiful lighting, professional quality, partial/back nudity ok but NO visible explicit nudity.`;

        } else if (contentMode === 'porn') {
            themeCategories = PORN_THEME_CATEGORIES;
            systemPrompt = "You are a helpful assistant.";
            moodList = ['daring', 'uninhibited', 'raw', 'naughty', 'spontaneous', 'wild', 'teasing'];

            const randomTheme = themeCategories[Math.floor(Math.random() * themeCategories.length)];
            const randomMood = moodList[Math.floor(Math.random() * moodList.length)];

            userMessage = `Acting as a director for raw, uninhibited, candid photography: 
Generate ONE single, vivid, natural language sentence for a photo scene.
Theme: ${randomTheme}
Mood: ${randomMood}
Aesthetic: iPhone quality, flash on, raw, very daring and provocative.
One sentence only.`;


        } else {
            // Social default
            themeCategories = SOCIAL_THEME_CATEGORIES;
            systemPrompt = SOCIAL_PROMPT_SYSTEM;
            moodList = ['serene', 'powerful', 'intimate', 'playful', 'mysterious', 'dreamy', 'bold', 'romantic'];

            const randomTheme = themeCategories[Math.floor(Math.random() * themeCategories.length)];
            const randomMood = moodList[Math.floor(Math.random() * moodList.length)];

            userMessage = `Generate an ULTRA-DETAILED editorial photography prompt (300-500 words).

SETTING: ${randomTheme}
MOOD: ${randomMood}

Include ALL of these in your response:
- Camera angle and lens (35mm, 50mm, or 85mm)
- Hyper-detailed environment description with textures, colors, props
- Exact pose description (body positioning, arms, legs, torso, hands, head)
- Specific outfit with fabric type and how it drapes
- Facial expression and eye direction
- Detailed makeup description
- Professional lighting setup
- Color palette and magazine-quality aesthetic

Write as ONE FLOWING PARAGRAPH with semicolons separating sections. NO lists, NO bullet points.`;
        }

        let apiUrl = 'https://llm.wavespeed.ai/v1/chat/completions';
        let apiModel = 'anthropic/claude-sonnet-4.5';
        let apiAuthToken = apiKey;

        // Use Cerebras for Porn mode (Uncensored / Specialized)
        if (contentMode === 'porn') {
            const cerebrasKey = process.env.CEREBRAS_API_KEY;
            if (cerebrasKey) {
                apiUrl = 'https://api.cerebras.ai/v1/chat/completions';
                apiModel = 'llama3.3-70b'; // Revert to Llama 3.3 (more permissive)
                apiAuthToken = cerebrasKey;
            } else {
                console.warn("CEREBRAS_API_KEY missing, falling back to Wavespeed");
            }
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiAuthToken}`,
            },
            body: JSON.stringify({
                model: apiModel,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: userMessage,
                    },
                ],
                max_tokens: 1500,
                temperature: 1.0, // Maximum creativity
                stream: false,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('LLM API Error Status:', response.status);
            console.error('LLM API Error Body:', errorData);
            throw new Error(errorData.error?.message || `LLM API error (${response.status})`);
        }

        const data = await response.json();
        console.log("Cerebras Raw Response:", JSON.stringify(data, null, 2));

        let generatedPrompt = data.choices?.[0]?.message?.content;

        // Handle cases where the model might return a slightly different structure or empty content
        if (!generatedPrompt && data.choices?.[0]?.text) {
            generatedPrompt = data.choices[0].text;
        }

        if (!generatedPrompt) {
            throw new Error('No prompt generated by Cerebras');
        }

        return NextResponse.json({ prompt: generatedPrompt.trim() });
    } catch (error) {
        console.error('Generate random prompt error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate prompt' },
            { status: 500 }
        );
    }
}

