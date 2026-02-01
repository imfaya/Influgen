// Constants and configuration for InfluGen Studio

import { Influencer, AspectRatioOption, RandomPromptElements } from '@/types';

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

// Ultra-detailed complete editorial prompts (user's basePrompt will be prepended)
const ULTRA_DETAILED_PROMPTS = [
    // Hammam / Spa Setting
    `Ultra-realistic editorial photography, vertical portrait format, full-body shot from head to feet, camera positioned at eye level with gentle 35-50mm lens perspective creating natural proportions; candlelit hammam interior with intricate Moroccan zellige tile walls in deep turquoise and gold, warm steam rising dramatically through the frame, ornate brass lanterns casting dancing shadows on marble surfaces; the model reclining gracefully on a plush velvet daybed draped with ivory silk, body forming an elegant S-curve, one leg bent at the knee with foot resting flat, the other leg extended languidly, torso angled toward camera, one arm draped behind head fingers loosely intertwined with hair, the other arm resting along her hip, posture simultaneously relaxed and sculptural; wearing a luxurious silk robe in champagne gold loosely draped revealing one shoulder, fabric pooling artistically around her curves, catching the warm candlelight with subtle sheen; head tilted slightly back against an embroidered cushion, face turned three-quarters toward camera, eyes half-lidded with a serene contemplative expression, lips naturally parted in soft contentment, no smile; refined spa-fresh makeup with dewy luminous skin, warm honey-toned complexion glowing from within, minimal contour, natural flush on cheeks, groomed natural brows, no eyeshadow, subtle mascara, lips in nude mauve; dried eucalyptus bundles and brass water vessels visible in soft focus background; ambient lighting from dozens of tea light candles creating warm golden pools of light, steam diffusing the illumination into a dreamy haze, rim lighting on hair and shoulders from lanterns behind, deep shadows adding mystery and depth; warm amber and cream color palette, intimate luxurious atmosphere, high-end spa editorial aesthetic, ultra-detailed, photorealistic skin texture, professional beauty photography quality, Vogue Wellness magazine style, 8K resolution`,

    // Infinity Pool at Dawn
    `Ultra-realistic lifestyle editorial photography, horizontal composition converted to vertical crop focusing on subject, shot from slightly below eye level with 50mm lens creating intimate perspective; infinity pool edge overlooking misty mountain valley at dawn, pink and gold sunrise colors reflecting on still water surface, soft morning fog rolling through distant peaks, minimalist modern architecture with clean concrete edges; the model seated at pool edge with legs dangling gracefully in crystal-clear water creating subtle ripples, body turned three-quarters toward camera, weight resting on one arm positioned behind her, the other hand delicately holding a champagne flute with bubbles catching the light, spine elongated with elegant posture, shoulders relaxed and open toward viewer, subtle lean forward suggesting casual intimacy; wearing a flowing silk slip dress in pale blush pink with delicate spaghetti straps, fabric wet at the hem and clinging subtly to thighs, falling in graceful folds across lap, catching golden sunrise light with luminous sheen; fresh rose petals scattered across the water surface in soft pinks and creams, some floating nearby, others drifting toward the infinity edge; head tilted with genuine serene smile, eyes soft and dreamy gazing just past camera, expression of blissful contentment and peaceful luxury, lips in relaxed natural curve; natural morning-fresh makeup with glowing dewy skin, minimal coverage letting natural beauty show, soft peachy blush, clean groomed brows, subtle champagne shimmer on lids, fresh pink lips; lighting is magical golden hour dawn, soft directional light from rising sun creating warm rim lighting on hair and shoulders, gentle fill from reflected water, misty atmosphere diffusing harsh shadows; ethereal dreamy color palette of blush pink and soft gold, elevated luxury lifestyle aesthetic, aspirational vacation mood, ultra-detailed water reflections and fabric texture, photorealistic, professional travel and lifestyle photography, Conde Nast Traveler cover quality, 8K resolution`,

    // Minimalist Studio Sofa
    `Ultra-realistic editorial studio photography, vertical format, full-body shot from head to feet, camera positioned slightly above and in front of the subject with a gentle top-down angle using a natural 35-50mm lens perspective; minimalist high-end photography studio with seamless warm beige backdrop, large modular contemporary sofa in cream boucle fabric with clean architectural lines; the model lying on her side in a relaxed elongated pose across the sofa, one leg bent and tucked slightly forward creating visual interest, the other leg extended gracefully toward camera, torso subtly twisted three-quarters toward viewer, one arm bent with hand resting casually in her hair fingers threading through strands, the other arm relaxed along her body following the curve of her waist, posture soft intimate and elegant; head resting lightly against the sofa arm cushion, face turned toward the camera with calm dreamy expression, eyes open and engaging with soft focus, lips softly parted with hint of contentment, no smile maintaining editorial elegance; wearing a minimalist black one-piece bodysuit with clean contemporary lines and modern high-cut leg, architectural neckline, matte fabric with subtle texture, no visible logos or embellishments, modern fashion aesthetic; refined natural-glam makeup with luminous healthy skin, warm neutral complexion with natural undertones, soft sculpted contour enhancing bone structure, subtle creamy highlight on high points, expertly groomed natural brows, neutral matte eyeshadow blending seamlessly, light feathery mascara, no harsh eyeliner, muted nude-rose lipstick applied with soft edges; background is seamless warm beige creating monochrome minimalist setting with no distractions, subtle gradient from lit to shadow areas adding depth; lighting is soft natural daylight simulation from large windows camera left, diffused through sheer panels, sculpting the body with gentle graduated shadows that enhance curves naturally, warm creamy color temperature throughout, calm editorial mood; high-fashion minimalism aesthetic, ultra-detailed fabric and skin texture, photorealistic quality, no artificial flash look, no filters, luxury fashion magazine editorial style, 8K resolution`,

    // Parisian Apartment Morning
    `Ultra-realistic lifestyle editorial photography, vertical portrait format shot at slight upward angle with 50mm lens creating elegant proportions, natural morning atmosphere; grand Parisian apartment with tall French windows, ornate white moldings and ceiling medallions, herringbone oak parquet floors catching morning light, sheer white curtains billowing gently in breeze, antique gilt-framed mirror visible in background; the model standing in contrapposto pose near the window, weight elegantly shifted to one leg creating natural S-curve through the body, hip tilted gracefully, one hand raised adjusting tousled morning hair, the other arm relaxed at her side holding a small espresso cup on saucer, shoulders angled toward camera with open relaxed posture, spine elongated with dancer-like grace; wearing an oversized mens style white cotton shirt barely buttoned with sleeves rolled to elbows, hem falling to mid-thigh, collar open revealing collarbones, fabric catching backlight with translucent glow at edges; head turned three-quarters toward camera with genuine soft smile, eyes bright and warm with morning contentment, expression intimate and unguarded as if sharing a private moment, natural laugh lines suggesting authenticity, lips in relaxed happy curve; minimal fresh-from-bed makeup with naturally glowing skin, no foundation letting freckles and natural texture show, subtle rosy flush on cheeks from sleep, natural brows slightly tousled, no eye makeup, lips in natural pink; soft diffused morning light streaming through sheer curtains, creating beautiful rim lighting around hair and silhouetting figure through thin fabric, warm golden tones mixing with cool shadows, gentle graduated light across face, dreamy atmospheric haze from dust particles in light beams; romantic Parisian color palette of cream whites soft golds and warm grays, intimate lifestyle editorial mood, effortless aspirational morning routine aesthetic, ultra-detailed fabric transparency and light effects, photorealistic, luxury lifestyle magazine quality, 8K resolution`,

    // Desert Golden Hour
    `Ultra-realistic fashion editorial photography, vertical full-length composition, camera at hip height shooting slightly upward with 85mm portrait lens creating flattering compression and beautiful background separation; dramatic desert landscape at golden hour with towering orange sand dunes creating sweeping curved lines against deep blue gradient sky, single twisted acacia tree silhouette in far background, fine sand particles visible catching golden light; the model walking toward camera mid-stride on dune ridge, body angled three-quarters with confident forward motion, one leg extended in elegant step weight shifting naturally, arms relaxed with subtle swing, hair and fabric caught mid-movement by desert breeze, spine straight with shoulders back projecting quiet strength and grace; wearing a flowing burnt sienna silk maxi dress with deep V-neckline and dramatic side slit revealing leg mid-stride, fabric billowing and rippling in the wind creating dynamic movement, thin delicate straps, gold thread details catching sunset light along hem; multiple fine gold chain necklaces of varying lengths, small hoop earrings, no other accessories, dress hem gathering fine sand; head held high chin slightly lifted with powerful serene expression, eyes gazing directly into camera with intensity and calm confidence, slight knowing smile playing at corners of lips, wind-tousled hair streaming dramatically behind; warm bronzed makeup with glowing sun-kissed skin, subtle contour emphasizing bone structure, warm peachy blush, bold defined brows, copper and gold smoky eyeshadow, subtle shimmer on lids and high points, terracotta lip color; lighting is pure golden hour magic fifteen minutes before sunset, warm directional light from low sun position creating long dramatic shadows on sand, rim lighting on hair and dress creating golden halo effect, fill from reflected light off sand dunes, rich warm color temperature throughout; cinematic desert color palette of burnt orange deep sienna and golden amber against deepening blue sky, epic fashion editorial mood, luxury bohemian adventuress aesthetic, ultra-detailed fabric movement and sand texture, photorealistic, high-fashion campaign quality, 8K resolution`,

    // Venetian Palace
    `Ultra-realistic high-fashion editorial photography, vertical portrait format, camera at eye level with 50mm lens creating natural elegant perspective; opulent Venetian palazzo interior with elaborate frescoed ceiling visible above, walls covered in faded silk damask in dusty rose and gold, massive baroque gilt mirror reflecting soft light, terrazzo floor with intricate marble inlays, antique crystal chandelier casting prismatic light; the model seated on an ornate carved gilt settee upholstered in worn velvet, body angled sideways on seat with legs crossed elegantly at ankle and tucked to one side, torso twisted toward camera with one arm draped along settee back, the other hand resting in lap, spine curved gracefully with shoulders parallel to viewer, posture simultaneously relaxed and regal; wearing an architectural haute couture gown in deep emerald silk with corseted bodice structured boning and full dramatic skirt pooling on floor, off-shoulder neckline revealing elegant decolletage, fabric catching light with rich jewel-tone luminosity; statement antique emerald and diamond drop earrings, no other jewelry, hair styled in elegant low chignon with loose tendrils framing face; head tilted slightly with aristocratic poise, expression serene and enigmatic with hint of Mona Lisa mystery, eyes half-lidded gazing just past camera with quiet intensity, lips in subtle knowing expression neither smile nor pout; polished sophisticated makeup with luminous porcelain skin, sculpted contour creating shadows under cheekbones, subtle highlight on brow bone and cupids bow, perfectly groomed arched brows, smoky eye in deep forest green and gold, precise winged liner, defined lashes, deep berry lip with satin finish; lighting from ornate chandelier above creating soft overall illumination with gentle sparkle, additional light from tall windows camera left wrapped in sheer drapes, subtle fill from reflected gilt surfaces, warm golden color temperature with cool shadows; old-world glamour color palette of emerald forest green dusty rose and antique gold, editorial high-fashion meets fine art aesthetic, timeless aristocratic elegance, ultra-detailed fabric texture and architectural elements, photorealistic, Vogue Italia cover quality, 8K resolution`,

    // Modern Penthouse Night
    `Ultra-realistic editorial photography, vertical composition, shot from slightly below eye level with 35mm lens capturing both subject and dramatic cityscape beyond; ultra-modern penthouse apartment at night with floor-to-ceiling glass walls overlooking glittering city skyline, sleek minimal interior with white marble floors polished to mirror finish, low contemporary modular sofa in charcoal velvet, single architectural floor lamp providing warm accent light, city lights creating multicolored bokeh beyond; the model standing near the glass wall silhouetted against city lights, body in relaxed confident stance with weight shifted to one hip, one hand pressed lightly against cool glass surface fingers splayed, the other arm bent with hand resting on hip, shoulders squared toward camera with slight forward lean suggesting engagement, reflection visible in glass creating ghostly double image; wearing a sleek minimalist black slip dress in heavy silk with thin straps and low cowl back, fabric skimming body curves in straight clean lines, falling to mid-calf, subtle side slit, contemporary understated luxury; delicate diamond tennis bracelet only jewelry, modern strappy black heels with architectural heel visible; head turned to look at camera over shoulder, expression confident and alluring with slight smile, eyes bright catching reflections of city lights, sultry sophisticated gaze, red lips adding pop of color; polished evening makeup with flawless matte skin, sculpted contour, subtle highlight, dramatic eye with smoky gradient from charcoal to silver, precise cat-eye liner, full false lashes, bold classic red lip with clean edges; complex lighting combining warm lamp light from interior creating pool of golden illumination, cool blue city light from window casting dramatic shadows, rim lighting from city glow defining figure edges, reflections adding depth and dimension; contemporary urban color palette of cool blues warm golds and dramatic blacks, sophisticated metropolitan night lifestyle aesthetic, modern luxury editorial mood, ultra-detailed reflections glass texture and city bokeh, photorealistic, luxury lifestyle magazine night shoot quality, 8K resolution`,

    // Greenhouse Garden
    `Ultra-realistic botanical editorial photography, vertical format, camera at eye level with 50mm lens creating natural intimate perspective; Victorian-era glass greenhouse conservatory with aged iron framework painted in weathered white, tall arched windows with some panes of vintage wavy glass, lush tropical plants throughout including giant monstera palm fronds hanging vines and blooming orchids, terracotta pots arranged organically, vintage botanical prints on one wall, comfortable weathered teak bench; the model seated casually on the bench surrounded by greenery, body angled three-quarters with legs crossed casually one foot tucked behind opposite ankle, leaning back slightly with weight on hands placed on bench behind her, arms framing her torso, relaxed open posture suggesting peaceful contentment, head tilted slightly with curious engaging expression; wearing a romantic floral print midi dress in soft botanical colors of sage green dusty pink and cream, puffed short sleeves, sweetheart neckline with subtle ruching, flowing A-line skirt draped naturally across lap and bench, delicate fabric with subtle sheen; minimal gold jewelry with tiny botanical-inspired pendant, hair loosely styled in soft romantic waves falling naturally, tucked behind ear on one side revealing profile; expression genuinely warm and approachable with natural smile reaching eyes, gentle gaze at camera with friendly intimacy, lips in relaxed happy curve, overall mood of joyful serenity in nature; fresh natural makeup with dewy glowing skin, subtle rosy blush suggesting healthy vitality, soft peachy highlight, natural groomed brows, minimal eyeshadow in soft pink, light mascara, lips in natural rose pink; lighting is diffused natural daylight filtering through glass ceiling and walls creating bright even illumination, dappled shadows from leaves creating interesting patterns on skin and dress, warm white light temperature, steam and moisture in air creating soft atmosphere; fresh natural color palette of sage green dusty pink botanical cream and weathered white, romantic garden editorial aesthetic, joyful feminine energy, ultra-detailed botanical textures plant life and fabric, photorealistic, lifestyle magazine garden feature quality, 8K resolution`,

    // Yacht at Sea
    `Ultra-realistic luxury lifestyle editorial photography, vertical composition, camera at deck level shooting slightly upward with 35mm lens capturing sweeping ocean vista; pristine white mega-yacht deck gleaming in Mediterranean sunlight, polished teak wood flooring with white non-slip sections, sleek chrome railings, plush white outdoor cushions on built-in seating, infinite azure ocean stretching to horizon where it meets pale blue sky; the model reclining on the yachts sun deck cushions, body stretched lengthwise in elegant diagonal composition, one leg extended fully other bent with foot flat knees falling slightly open, upper body propped on elbows creating elongated torso line, shoulders back chest open, head tilted up toward sun with eyes closed in blissful expression; wearing a designer one-piece swimsuit in classic nautical navy with thick white straps and subtle gold hardware at shoulders, high-cut leg flattering torso, structured modern silhouette; stylish oversized tortoiseshell sunglasses pushed up on head, delicate gold anchor pendant necklace, multiple thin gold bangles on one wrist, natural beach-textured waves in hair with salt spray texture; expression of pure relaxed pleasure, face tilted to sun with peaceful smile, eyes closed in contentment, lips parted slightly breathing ocean air, ultimate leisure and luxury embodied; sun-kissed yacht club makeup with glowing bronzed dewy skin, subtle shimmer on high points, natural flush, groomed brows, no eyeshadow to accommodate sunglasses, peachy coral lip with glossy finish; brilliant high-noon Mediterranean sunlight, slightly diffused by thin clouds creating flattering illumination without harsh shadows, strong fill from light reflecting off white deck surfaces, rim lighting from sun highlighting hair, subtle shadows preserving dimension; crisp nautical color palette of pristine white navy blue and infinite azure ocean, luxury yacht lifestyle editorial aesthetic, aspirational leisure and freedom, ultra-detailed water texture yacht materials and skin, photorealistic, Boat International style quality, 8K resolution`,

    // Art Gallery Opening
    `Ultra-realistic fashion editorial photography, vertical full-length composition, camera at eye level with 50mm lens creating elegant undistorted perspective; contemporary art gallery opening night, stark white walls displaying large-scale abstract expressionist paintings in bold colors, polished concrete floors, minimal track lighting creating dramatic spots on artwork, other elegantly dressed guests visible as soft blur in background; the model standing centered in gallery space, body in powerful confident stance weight distributed evenly feet slightly apart in stable grounded posture, one arm bent with champagne glass held at chest height, the other arm relaxed at side with hand slightly turned out, shoulders squared yet relaxed projecting quiet confidence, spine straight with regal bearing; wearing an avant-garde asymmetrical designer gown in electric cobalt blue with architectural pleating on bodice one bare shoulder dramatic floor-length skirt with structured volume at hip, fashion-forward statement piece, fabric with subtle iridescent sheen catching light; bold geometric modern gold earrings complementing gowns architectural nature, no other jewelry, hair in sleek sophisticated low ponytail with center part, gel-slicked edges accentuating bone structure; expression poised and intelligent with confident half-smile suggesting cultured engagement, direct eye contact with camera projecting self-assured power, chin slightly raised, lips in composed subtle curve; polished editorial makeup with flawless matte skin, sculpted contour defining cheekbones and jawline, subtle highlight, bold precisely groomed brows, graphic eye makeup with cobalt blue liner extending into artistic wing complementing dress, voluminous separated lashes, bold fuchsia lip providing unexpected pop; gallery lighting with dramatic spots creating interesting highlights and shadows, accent light on face from reflected artwork colors adding subtle dimension, overall brightness of white gallery providing fill; contemporary art-world color palette of stark white bold cobalt electric fuchsia and gold accents, high-fashion meets contemporary art aesthetic, cultured sophisticated power dressing, ultra-detailed fabric architecture and gallery setting, photorealistic, fashion week coverage quality, 8K resolution`,
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
