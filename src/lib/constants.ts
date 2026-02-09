// Constants and configuration for InfluGen Studio

import { Influencer, AspectRatioOption, RandomPromptElements } from '@/types';

// =================================================================
// NEGATIVE PROMPT - Filters Out AI Artifacts for Photorealism
// =================================================================
// Based on professional photography research (2024 best practices):
// Eliminates AI look by excluding: CGI, plastic skin, overly perfect rendering, duplicate limbs
export const DEFAULT_NEGATIVE_PROMPT = "AI generated, artificial intelligence, computer generated, CGI, 3D render, 3d model, rendered, cartoon, anime, illustration, drawing, painting, digital art, plastic skin, doll-like, mannequin, wax figure, fake looking, synthetic, artificial skin texture, flawless skin, airbrushed, overly smooth, perfect symmetry, unrealistic proportions, distorted anatomy, extra fingers, deformed hands, extra hands, multiple hands, duplicate hands, extra arms, multiple arms, duplicate arms, three arms, four arms, extra legs, multiple legs, duplicate legs, three legs, mutated limbs, malformed limbs, missing limbs, blurry face, low quality, worst quality, jpeg artifacts, watermark, text, logo, oversaturated, neon colors, futuristic, cyberpunk lighting, vignette, dark corners, retro filter";

// Wavespeed API Configuration
export const WAVESPEED_CONFIG = {
    apiEndpoint: 'https://api.wavespeed.ai/api/v3',
    model: 'bytedance/seedream-v4.5' as const,
};

// Default LLM System Prompt for prompt enhancement
export const DEFAULT_LLM_SYSTEM_PROMPT =
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

// Sensual Mode LLM System Prompt for erotic/intimate content
export const SENSUAL_LLM_SYSTEM_PROMPT =
    "You are an expert AI art prompt engineer specialized in sensual, intimate, and erotic photography. " +
    "Your task is to enhance the USER PROMPT to be alluring, artistic, and tastefully provocative, while respecting the CHARACTER CONTEXT. " +
    "\n\n" +
    "RULES:\n" +
    "1. The CHARACTER CONTEXT describes the fixed subject. Maintain these traits while adding sensuality.\n" +
    "2. Focus on: suggestive poses, intimate lighting, bedroom eyes, body curves, skin texture, lingerie details.\n" +
    "3. Style: boudoir photography, intimate atmosphere, warm skin tones, soft focus, sensual gaze.\n" +
    "4. Enhance with: dim ambient lighting, silk sheets, lace details, exposed shoulders, arched back, parted lips.\n" +
    "5. Mood keywords: seductive, intimate, passionate, alluring, provocative, tasteful, sophisticated.\n" +
    "6. AVOID: vulgar, explicit, or crude descriptions. Keep it elegant and artistic.\n" +
    "7. Output ONLY the enhanced prompt text. No quotes, no explanations.\n" +
    "8. IMPORTANT: Maximum 80 words. Use evocative, comma-separated descriptors.";


// Influencers data
export const INFLUENCERS: Influencer[] = [
    {
        id: 'lyra-chenet',
        name: 'Lyra Chenet',
        slug: 'lyra-chenet',
        description: 'French-Laotian lifestyle influencer from Paris. Known for her elegant Parisian aesthetic blended with Southeast Asian heritage.',
        thumbnail: '/influencers/lyra-chenet/lyra1.png',
        avatar: '/influencers/lyra-chenet/lyra1.png',
        basePrompt: 'Young woman, 25 years old, Franco-Laotian mixed heritage (French father, Laotian mother). Delicate Asian-European features with almond-shaped eyes, warm olive skin tone, high cheekbones, soft jawline. Long silky dark brown hair with natural subtle highlights. Elegant and refined facial features blending Southeast Asian beauty with French sophistication. Naturally full lips, expressive dark brown eyes with a gentle, warm gaze. Slender figure with graceful posture. Natural beauty with minimal makeup appearance.',
        defaultReferenceImages: [
            '/influencers/lyra-chenet/lyra1.png',
            '/influencers/lyra-chenet/_01.png',
            '/influencers/lyra-chenet/_03.png',
            '/influencers/lyra-chenet/1 - Copie.png',
            '/influencers/lyra-chenet/2 - Copie.png',
            '/influencers/lyra-chenet/4 - Copie.png',
        ]
    },
    {
        id: 'custom-influencer',
        name: 'Custom',
        slug: 'custom',
        description: 'Empty workspace for a new influencer.',
        thumbnail: '', // No image
        avatar: '', // No image
        basePrompt: '', // No base prompt
        defaultReferenceImages: []
    },
];

// Aspect ratio options with calculated resolutions (max 4096)
export const ASPECT_RATIOS: AspectRatioOption[] = [
    { value: '3:4', label: 'Portrait', width: 3072, height: 4096 },
    { value: '1:1', label: 'Square', width: 4096, height: 4096 },
    { value: '4:3', label: 'Landscape', width: 4096, height: 3072 },
    { value: '9:16', label: 'Story', width: 2304, height: 4096 },
    { value: '16:9', label: 'Wide', width: 4096, height: 2304 },
];

// Output count options
export const OUTPUT_OPTIONS = [1, 2, 4, 8] as const;

// Available AI Models with pricing
export const MODELS = [
    { id: 'bytedance/seedream-v4.5/text-to-image', name: 'Seedream 4.5 (Text)', type: 'text-to-image', cost: 0.04 },
    { id: 'bytedance/seedream-v4.5/edit', name: 'Seedream 4.5 (Edit)', type: 'edit', cost: 0.04 },
    { id: 'google/nano-banana-pro/edit', name: 'Nano Banana Pro', type: 'edit', cost: 0.14 },
];


// Advanced Randomization elements for editorial-style prompt generation
export const RANDOM_PROMPT_ELEMENTS: RandomPromptElements = {
    locations: [],
    actions: [],
    styles: [],
    lighting: [],
};

// Dynamic modifiers for enhanced prompt richness
export const CAMERA_MODIFIERS = [
    'shot on Hasselblad X2D 100C, medium format depth',
    'Leica M11 Monochrom aesthetic, high contrast',
    'iPhone 15 Pro Max computational photography, natural processing',
    'vintage Kodak Portra 400 film grain, warm tones',
    'Fujifilm GFX 100S medium format, exceptional detail',
    'Canon EOS R5 with 85mm f/1.2, beautiful bokeh',
    'Sony A7R V with 35mm f/1.4, natural perspective',
    'Nikon Z9 with 50mm f/1.8, classic portrait lens',
    'Leica Q3 with 28mm Summilux, sharp edge-to-edge',
    'Pentax 67 medium format film, analog aesthetic'
];

export const MOOD_MODIFIERS = [
    'melancholic and introspective atmosphere',
    'joyful and carefree energy',
    'mysterious and enigmatic presence',
    'powerful and confident demeanor',
    'vulnerable and intimate feeling',
    'rebellious and defiant attitude',
    'serene and peaceful contentment',
    'passionate and intense emotion',
    'dreamy and ethereal vibe',
    'bold and unapologetic spirit'
];

export const COMPOSITION_MODIFIERS = [
    'rule of thirds composition, balanced frame',
    'symmetrical centered framing, architectural',
    'dynamic diagonal leading lines, movement',
    'intimate extreme close-up, emotional connection',
    'environmental context wide shot, storytelling',
    'negative space left, subject right third',
    'foreground framing with natural elements',
    'overhead flat lay perspective, editorial',
    'low angle hero shot, empowering',
    'candid off-center framing, authentic'
];

// Instagram Influencer Style Prompts - Ultra-Detailed Professional Quality (user's basePrompt will be prepended)
const ULTRA_DETAILED_PROMPTS = [
    // Black Bodysuit Bedroom Intimate
    `Shot on Canon EOS 5D Mark IV with 50mm f/1.4 lens, natural film grain texture visible, slight subtle chromatic aberration on edges, photorealistic candid Instagram influencer photography with authentic imperfections; vertical smartphone-style composition at slightly elevated angle for flattering perspective; modern minimalist bedroom interior with crisp white linen bedding artfully tousled, warm beige walls, soft ambient lighting from bedside lamp casting gentle shadows, plants in corner, framed minimal art visible; confident sensual pose sitting on edge of unmade bed with legs elegantly crossed at ankle, one hand running fingers slowly through hair creating natural volume and movement, the other hand resting gracefully on upper thigh, shoulders pulled back to accentuate chest and create elegant posture, spine straight projecting self-assured feminine power, slight lean toward camera suggesting intimacy; wearing a sleek black long-sleeve bodysuit in ribbed stretch fabric with deep plunging V-neckline revealing décolletage and inner curves, high-cut legs emphasizing hip-to-waist ratio and elongating legs, form-fitting material hugging every curve, matte finish with subtle texture catching light; hair styled in loose tousled waves falling naturally over bare shoulders with intentional messiness suggesting intimate authenticity, minimal delicate gold chain necklace sitting at collarbone, natural manicure; sultry confident expression with direct unwavering eye contact creating magnetic connection, slight knowing smile playing at corners of lips, mouth barely parted in subtle invitation, eyes soft yet intense; natural glam makeup with dewy luminous skin showing realistic texture with visible pores and natural skin grain, subtle bronzer contouring cheekbones and jawline, natural flush on cheeks, expertly groomed full brows, soft neutral smoky eye in warm browns and taupes with subtle shimmer on lid, separated mascara-coated lashes, nude glossy lips with shine catching light; warm golden hour window light streaming from side creating beautiful rim lighting on hair and highlighting curves, soft fill from bedside lamp preventing harsh shadows, warm creamy color temperature throughout; modern Instagram influencer aesthetic, aspirational yet relatable intimate content, professional photography with natural film grain and authentic skin texture, realistic imperfections, unretouched candid feel, 4K quality`,

    // Orange Bikini Poolside Vacation
    `Shot on Fujifilm X-T4 with 35mm f/2 lens, natural Fujifilm color science with vibrant film-like saturation, visible fine grain texture, candid unposed photography; vertical format ideal for Instagram feed, shot from low flattering angle creating dynamic perspective and emphasizing height; luxury tropical resort infinity pool setting with crystal-clear bright turquoise water creating reflections, pristine white stone deck with modern geometric tiles, lush vibrant palm trees and tropical foliage in soft bokeh background, clear blue sky with wispy clouds; confident standing pose with weight shifted to one hip creating natural S-curve through body, one hand reaching up to adjust oversized designer sunglasses perched on head creating arm extension that flatters figure, other hand resting on hip with fingers splayed, chest forward and shoulders relaxed back, chin slightly lifted projecting carefree confidence; wearing a vibrant burnt orange or coral scoop-neck bikini top with tie-back detail and gold ring hardware accent, matching high-waisted bikini bottom with side ties emphasizing defined waist, modern sporty-chic style with slight ruching for texture, fabric with subtle sheen when wet; hair in natural beachy waves with sun-kissed caramel highlights and natural texture from salt water, oversized tortoiseshell or gold-frame sunglasses pushed up into hair as styling element, layered delicate gold chain necklaces, gold hoop earrings, multiple thin bangles on wrist; playful confident smile with genuine joy, head tilted slightly with eyes sparkling and fully engaging camera, expression radiating carefree vacation happiness and self-assurance, natural laugh lines suggesting authenticity; sun-kissed vacation makeup with heavily bronzed glowing dewy skin showing natural freckles and visible skin texture, warm peach blush, groomed brows, minimal waterproof eye makeup with just mascara and nude shimmer on lids, glossy peachy-coral lips with high shine matching bikini; brilliant midday tropical sunlight creating strong highlights and vibrant saturated colors, slight diffusion from coastal humidity, rim lighting on hair creating golden glow, strong fill from reflected light off white deck and water surface; Instagram beach lifestyle aesthetic, aspirational luxury vacation content, vibrant tropical color palette, ultra-detailed water reflections and authentic skin texture with visible pores, professional candid photography, natural film grain, 4K resolution`,

    // Leopard Print Mini Dress Tropical
    `Shot on Sony A7III with 50mm f/1.8 lens, shallow depth of field with creamy bokeh, subtle film grain, candid natural photography; vertical smartphone composition maintaining portrait orientation at eye level creating intimate natural perspective; lush tropical outdoor setting with giant vivid green banana leaves and monstera plants creating vibrant natural frame, dappled sunlight filtering through canopy, warm natural outdoor lighting with soft shadows; relaxed yet intentional seated pose on low rattan or wooden stool, legs crossed elegantly with top leg showing smooth thigh, torso twisted slightly three-quarters toward camera creating flattering angle and natural waist definition, one hand delicately holding white ceramic coffee cup or coconut drink as lifestyle prop, other hand resting casually on knee, posture upright yet relaxed suggesting effortless confidence; wearing a brown and tan leopard print mini dress in silky satin-like fabric with rich chocolate and caramel tones, plunging V-neckline showing generous décolletage, thin adjustable straps, defined tie waist with trailing ribbons emphasizing curves, sleeveless cut showing toned arms, body-hugging silhouette ending mid-thigh, fabric catching light with subtle sheen; voluminous natural curly or wavy hair styled with maximum volume and texture, warm auburn or chestnut tones, loose tendrils framing face, simple delicate gold jewelry including thin chain necklace and small hoop earrings, natural-looking tan; sultry confident gaze directly into camera lens with eyes slightly narrowed in knowing seductive expression, slight asymmetric smile or subtle pout, lips barely parted, head tilted at flattering angle, overall energy of relaxed sensuality and self-assurance; warm natural glam makeup with glowing bronzed skin showing natural texture and visible pores, defined sculpted contour emphasizing cheekbones and nose bridge, bold full eyebrows brushed up, warm brown smoky eye with bronze and copper tones blended to perfection, subtle shimmer on inner corners, defined lashes, nude-pink lip with matte finish; soft diffused natural daylight filtering through tropical leaves creating dappled light patterns on skin, warm golden color temperature, slight backlight creating rim lighting on hair, lush green bokeh background keeping focus on subject; Instagram fashion content aesthetic, sexy but tasteful and refined, modern influencer editorial style, ultra-detailed fabric texture and botanical elements, authentic skin texture with natural imperfections, professional candid photography with film grain, 4K resolution`,

    // White Crop Top Denim Street
    `Shot on Canon EOS R6 with 50mm f/1.8 lens, natural bokeh, visible subtle film grain, candid street photography; vertical Instagram format at eye level creating natural undistorted perspective; clean urban outdoor setting with modern minimalist architecture in background, smooth concrete wall in neutral tones or white brick, natural bright daylight, urban casual environment; confident relaxed standing pose with hips cocked to one side creating natural body curve, one hand casually tucked into front pocket of jeans creating effortless cool vibe, other hand raised running fingers through hair or adjusting strands behind ear, shoulders relaxed and slightly forward, weight on back leg with front foot slightly forward, posture projecting approachable confidence; wearing a crisp white ribbed knit crop top in form-fitting stretch material showing toned midriff and underboob curve, scoop or square neckline, short sleeves or tank style, paired with high-waisted light wash blue denim jeans with slight distressing and vintage fade, fitted through hips and thighs, modern flattering cut, casual-sexy everyday style; hair styled in effortless loose natural waves with movement and texture or in relaxed messy bun with face-framing pieces, minimal accessories including possibly small gold hoop earrings or delicate stud earrings, simple gold rings, natural sun-kissed skin tone; genuine warm smile with direct eye contact engaging viewer, approachable yet confident energy, eyes bright and sparkling, natural expression of joy or contentment, head tilted slightly creating friendly inviting vibe; fresh natural makeup aesthetic with dewy luminous skin showing visible pores and natural texture, subtle barely-there foundation letting skin grain show, soft pink or peach cream blush on cheeks and nose bridge for youthful flush, groomed natural brows, minimal eye makeup with just mascara, pink glossy tinted lips with natural shine; bright natural outdoor light with slight overexposure creating fresh Instagram aesthetic, soft shadows preserving dimension, warm daylight color temperature, clean modern lighting; casual relatable influencer content, everyday sexy and approachable, modern street style aesthetic, ultra-detailed denim texture and authentic skin with imperfections, professional candid photography, natural film grain, 4K resolution`,

    // Black Lace Bodysuit Boudoir
    `Shot on iPhone 14 Pro mimicking authentic selfie but with professional mirror setup, natural smartphone sensor grain, slight noise in shadows, candid intimate photography; vertical mirror selfie aesthetic format with phone in hand or visible in mirror, shot at arms length angle recreating authentic selfie perspective; modern feminine bedroom or luxurious dressing room interior with large full-length standing mirror with ornate or modern frame, soft warm bedside lamp or string lights creating ambient glow, plush bed with silk or satin sheets barely visible, feminine decor elements, intimate private setting; posed confidently in front of mirror holding phone in one hand positioned to capture full body, body angled to three-quarter position showing curves and creating flattering silhouette, one leg slightly bent with hip popped, free hand resting on hip or running through hair, back slightly arched to emphasize curves, shoulders back, confident sensual posture; wearing an intricate black lace bodysuit with delicate floral or geometric lace pattern throughout, sheer mesh panels on sides revealing skin, high-cut legs elongating silhouette, plunging neckline or deep V showing décolletage, long sleeves or sleeveless depending on style, form-fitting stretchy lace hugging every curve, visible through sheer areas creating tasteful allure; hair styled in soft voluminous romantic curls or waves with intentional bedroom-hair texture, delicate minimal jewelry including thin chain necklace or choker, small earrings, possibly delicate bracelet; sultry confident expression looking at phone camera visible in mirror reflection, eyes intense and engaging, slight seductive pout or knowing smile, lips parted, overall mood of confident intimate allure; evening glam makeup with skin showing realistic texture and visible pores, heavy defined contour creating dramatic shadows, highlighted cheekbones and nose bridge, full arched brows, dramatic smoky eye in charcoal or deep brown with blended crease and shimmer on lid, full false lashes, deep nude or berry matte lip; warm ambient golden lamp light creating intimate moody atmosphere with visible light source, soft shadows adding drama and dimension, some areas falling into darker shadow for mystery and depth, warm orange-gold color temperature; Instagram boudoir intimate content aesthetic, sexy but classy and refined, professional bedroom photography vibe with authentic imperfections, ultra-detailed lace pattern and natural skin texture, smartphone grain, 4K resolution`,

    // Red One-Piece Beach Sunset
    `Shot on Fujifilm XT-5 with 35mm f/2 lens, vibrant Fujifilm color rendering, visible fine grain texture, candid beach photography; vertical format optimized for Instagram from low angle emphasizing subject against expansive beach background; pristine sandy beach location with soft wet sand reflecting sky colors, gentle ocean waves with white foam in background, golden hour sunset light painting sky in oranges and pinks, natural unspoiled coastal setting; playful carefree pose sitting or kneeling in shallow water at surf line with body facing camera, legs extended forward with ankles crossed or slightly apart, upper body leaning back supported on straight arms behind creating open chest and elongated torso, head tilted back toward sky enjoying warm sunlight on face, hair falling back naturally; wearing a vibrant cherry red or scarlet high-cut one-piece swimsuit with sporty-sexy modern design, plunging neckline or scoop neck showing décolletage, thick supportive straps or thin delicate straps, high-cut legs emphasizing length, possibly with cutouts or unique back detail, structured fit flattering figure; natural beach hair slightly damp and textured with salt water creating piecey windswept waves, sun-kissed highlighted strands, skin glistening with water droplets or natural oils, minimal jewelry possibly just small stud earrings or simple necklace; joyful carefree expression with eyes closed or squinting from bright sun, genuine wide smile showing teeth, laughing or serene peaceful face, head thrown back in moment of pure happiness, relaxed natural energy; minimal waterproof makeup aesthetic with bronzed glowing skin showing natural freckles and visible pores sun-kissed tone, natural flush on cheeks from sun, groomed brows, no eye makeup or just waterproof mascara, lips with coral or pink tinted balm with natural glossy shine; warm golden hour sunset light creating dramatic rim lighting on hair and body highlighting silhouette, lens flares from low sun position, saturated warm orange and pink tones throughout, strong fill from light reflecting off water and wet sand, magical hour color temperature; aspirational beach lifestyle aesthetic, Instagram wanderlust vacation content, warm vibrant color palette, ultra-detailed water texture and light effects with natural film grain, professional candid travel photography, 4K resolution`,

    // Sage Green Matching Set Casual
    `Shot on Sony A7IV with 50mm f/1.4 lens, natural background blur, subtle film grain visible, candid lifestyle photography; vertical portrait format at eye level creating natural perspective and slight background compression; neutral modern indoor space or bright outdoor patio setting with minimalist aesthetic, soft natural window light or shaded outdoor area, clean simple background in whites or beiges, contemporary casual environment; relaxed confident standing pose with body weight on back leg and front foot pointed forward, one hand casually raised touching hair or adjusting sunglasses, other arm relaxed at side or hand resting in pocket, hips slightly angled, shoulders relaxed, casual effortless posture projecting approachable confidence; wearing a sage green or muted olive ribbed knit crop tank top in form-fitting stretch material showing toned midriff, scoop or V-neckline, paired with matching high-waisted ribbed shorts or mini skirt in same fabric creating coordinated athleisure set, modern trendy matching outfit, soft matte fabric with visible ribbed texture; hair styled in effortless beach waves with natural movement or sleek high ponytail with face-framing wisps, minimal delicate gold jewelry including thin chain necklace and small hoop earrings, simple gold rings, possibly trendy sunglasses as accessory; warm genuine smile with direct eye contact, friendly approachable expression radiating positive energy, eyes bright and engaged, natural joyful vibe, girl-next-door accessible charm; fresh natural everyday makeup with dewy glowing skin showing visible pores and natural texture, subtle cream blush on cheeks, natural full groomed brows, minimal eye makeup with just mascara and maybe soft brown in crease, pink or peach tinted glossy lips creating fresh-faced look; soft diffused natural window light creating bright airy feel or outdoor shade with bounce light, gentle shadows, warm white or slightly cool daylight color temperature, bright Instagram-optimized exposure; relatable everyday influencer aesthetic, casual sexy and approachable, modern athleisure lifestyle content, ultra-detailed ribbed fabric texture and authentic natural skin with imperfections, professional candid photography with film grain, 4K resolution`,

    // Animal Print Bikini Tropical Paradise
    `Shot on Canon EOS 5D Mark IV with 35mm f/1.4 lens, shallow depth of field, visible film grain, candid tropical photography; vertical Instagram format from slightly below eye level creating dynamic flattering angle; exotic tropical location with vibrant green palm fronds and tropical plants filling frame, lush jungle-like setting or resort garden, bright natural sunlight filtering through leaves, paradise vacation environment with rich saturated colors; confident standing pose with weight on back leg creating natural hip tilt and curve through body, one hand resting on hip with elbow out creating angular silhouette, other hand raised touching or running through hair creating arm extension, chest forward, shoulders back, chin lifted slightly, body slightly angled for most flattering three-quarter view; wearing a brown tan or caramel leopard print bikini top with triangle or bandeau style showing trendy animal print in natural earth tones, matching high-waisted or regular bikini bottom with side ties or statement details, safari-chic beach style, modern flattering cut; natural beachy textured waves with highlights catching sunlight, voluminous with movement and body, gold accessories including layered chain necklaces, gold hoop earrings, possibly thin gold anklet or bracelets, trendy sunglasses pushed up on head, sun-kissed bronzed skin; sultry confident smile with eyes directly engaging camera showing self-assurance, head tilted at flattering angle, expression radiating vacation happiness and sensual confidence, playful yet sophisticated energy; sun-kissed tropical vacation makeup with heavily bronzed glowing skin showing visible pores and natural texture, natural highlight on high points, groomed brows, warm golden eyeshadow or minimal eye makeup, waterproof mascara, glossy nude or coral tinted lips catching light; bright tropical midday sunlight creating vibrant saturated colors and strong highlights, dappled light filtering through palm fronds creating interesting shadows, warm golden color temperature, lush green bokeh background with depth separation; Instagram exotic travel content aesthetic, aspirational tropical luxury, vibrant rich color palette with greens and earth tones, ultra-detailed tropical botanical background and authentic skin texture with imperfections, professional candid travel photography with natural film grain, 4K resolution`,

    // Rust Orange Bodysuit Morning Light
    `Shot on Fujifilm X-T4 with 50mm f/1.8 lens creating beautiful shallow depth of field, natural Fujifilm film simulation, visible subtle grain; vertical portrait format at eye level, candid intimate photography; bright modern minimalist bedroom interior with large window covered by sheer white curtains diffusing morning light, crisp white or cream bedding artfully tousled, minimal contemporary decor, soft peaceful morning atmosphere; sensual intimate kneeling pose on bed facing camera with body upright, hands raised running through hair or resting on thighs, back slightly arched creating elegant curve and emphasizing chest, shoulders back, knees together or slightly apart, confident vulnerable feminine energy; wearing a rust orange or burnt sienna ribbed bodysuit in form-fitting stretch knit material with texture, plunging V or scoop neckline revealing décolletage, long sleeves fitted to arms, high-cut legs, fabric hugging curves and showing silhouette, warm earthy color complementing skin tone; loose tousled bed hair with natural messy texture suggesting intimate authenticity, minimal or no jewelry emphasizing natural beauty, bare skin with warm glow; sultry intimate confident gaze directly at camera with eyes intense and inviting, lips slightly parted in subtitle invitation, expression balancing sensuality with artistic beauty, intimate yet powerful presence; warm natural glam makeup with luminous glowing skin showing realistic texture with visible pores and natural skin grain appearing freshly moisturized, subtle contour defining features, natural pink flush on cheeks, groomed natural brows, warm bronze and copper eyeshadow creating soft smoky effect, separated lashes, nude matte lips; soft diffused morning window light streaming through sheer curtains creating ethereal dreamy glow, wrap-around lighting eliminating harsh shadows, warm peachy-gold color temperature suggesting early morning, gentle rim lighting on edges creating angelic quality; Instagram intimate morning content aesthetic, sexy but tasteful and artistic, professional boudoir photography vibe with authentic imperfections, ultra-detailed fabric ribbing and natural skin texture with visible pores, candid film grain, 4K resolution`,

    // White Bikini Bright Summer Beach
    `Shot on Canon EOS R with 35mm f/2 lens in high-key exposure, slight overexposure, visible subtle film grain, candid summer photography; vertical format optimized for Instagram from slightly elevated angle; ultra-bright beach setting with white or pale sand, brilliant sunlight, possibly white cabana or beach club background, high-key overexposed aesthetic creating dreamy summer vibe; playful carefree pose either standing with arms raised toward sky in joyful gesture, or sitting on sand with legs extended, or playful candid movement captured mid-motion, body language radiating pure summer happiness and freedom; wearing a classic white bikini with bandeau or triangle top and matching bottoms creating clean minimal aesthetic, possibly with gold hardware or ring details, pristine white creating contrast against tan skin, timeless beach style; natural sun-bleached hair with lighter ends from sun exposure, textured from salt water with windswept movement, minimal gold jewelry including simple chain necklace and small earrings, natural sun-kissed bronzed skin glowing with health showing visible pores and freckles; joyful authentic expression with eyes squinting slightly from bright sun or looking directly at camera with big genuine smile showing teeth, face radiating pure happiness and summer freedom, natural laugh lines and expression of joy; minimal or no makeup focusing on natural bronzed beauty with visible skin texture, just bronzed glowing skin with natural flush, possibly tinted lip balm, natural brows, focusing on healthy sunlit glow; brilliant bright midday or afternoon sunlight creating intentional overexposure and high-key aesthetic, lens flares and bright highlights, minimal shadows, vibrant white tones and bright blues, sun-drenched color palette; Instagram summer vibes aesthetic, bright cheerful beach babe content, high-key exposure style, fresh and youthful energy, ultra-detailed sun-drenched atmosphere with natural imperfections, professional candid summer lifestyle photography with film grain, 4K resolution`,
];


// Generate a random prompt SCENE only (no base prompt included)
export function generateRandomPrompt(): string {
    const randomIndex = Math.floor(Math.random() * ULTRA_DETAILED_PROMPTS.length);
    return ULTRA_DETAILED_PROMPTS[randomIndex];
}

// Generate a series continuation prompt (keeps context but changes pose)
export function generateSeriesContinuationPrompt(
    basePrompt: string, // This is now just the previous user prompt context
    context: { location?: string; outfit?: string; lighting?: string }
): string {
    const poses = [
        'different angle, slight head tilt',
        'turned slightly to the side',
        'looking over shoulder',
        'closer portrait shot',
        'full body shot',
        'candid moment captured',
    ];

    const pose = poses[Math.floor(Math.random() * poses.length)];

    let prompt = '';
    if (context.location) prompt += `${context.location}, `;
    if (context.outfit) prompt += `${context.outfit}, `;
    if (context.lighting) prompt += `${context.lighting}, `;
    prompt += `${pose}, consistent appearance`;

    return prompt;
}

// Validation constants
export const MAX_PROMPT_LENGTH = 10000; // Effectively unlimited
export const MAX_UPLOAD_SIZE_MB = 10;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
export const RATE_LIMIT_MAX = 50; // Increased limit
export const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
