import { NextResponse } from 'next/server';
import { ContentMode } from '@/types';
import { getUserApiKey } from '@/lib/getUserApiKey';
import { CAMERA_MODIFIERS, MOOD_MODIFIERS, COMPOSITION_MODIFIERS } from '@/lib/constants';
import {
    SHOOTING_DIRECTIONS,
    DIRECTION_LOCATIONS,
    DIRECTION_STYLE_SEEDS,
    type ShootingDirectionId,
} from '@/lib/shootingDirections';

// ============================================================================
// PROMPT ENGINEERING SYSTEMS
// ============================================================================

const SOCIAL_PROMPT_SYSTEM = `You are an elite Instagram influencer photography director specializing in modern, sexy, trendy content.
Create an ULTRA-DETAILED prompt (300-500 words) based on the provided creative elements.

**CRITICAL: PHOTOREALISM REQUIREMENTS**
Your prompts MUST look like real professional photography, NOT AI-generated content:
- START with camera specs: "Shot on [Canon EOS 5D/R6, Fujifilm X-T4/XT-5, Sony A7III/A7IV, iPhone 14 Pro] with [35mm/50mm/85mm] f/1.4-2 lens"
- Add film characteristics: "natural film grain visible", "subtle chromatic aberration", "Fujifilm color science"
- Include natural imperfections: "visible pores", "natural skin texture", "realistic texture", "authentic imperfections"
- Use candid terminology: "candid photography", "unposed", "natural moment", "authentic"
- AVOID fantasy elements: NO auroras with palm trees, NO perfect circles in sand, NO overly perfect/surreal scenes
- Keep scenes REALISTIC and achievable: real beaches, real bedrooms, real pools - nothing impossible

**PHOTOGRAPHY STYLE: BALANCED MIX (50% candid / 50% professional shooting)**
- Mix natural candid moments with intentional posed shots
- Can be either spontaneous unposed OR carefully composed professional shots
- Balance between authentic candid energy and polished influencer aesthetic

**CRITICAL: VISUAL COHERENCE — THIS IS NON-NEGOTIABLE**
Pick ONE clear location/context and make EVERY element serve it naturally:
- If location is a STUDIO: no fog machines, no poetry books, no surrealist props — only what a real studio session would contain
- If location is a STREET: no lighting equipment visible, candid energy only
- If location is a BEDROOM/APARTMENT: cosy intimate props only, nothing that doesn't belong in a real home
- NEVER mix incompatible worlds (e.g. smoke machines in a minimalist studio, random animals, unexplained objects floating)
- Every prop, accessory, and background detail must have a LOGICAL reason to be there
- Ask yourself: "Would a real photographer actually have this in this shot?" — if no, remove it
- ONE setting, ONE vibe, ONE coherent visual story. Resist the urge to add "interesting" elements that break reality.

AESTHETIC DIRECTION:
- Instagram influencer vibe: confident, sexy but tasteful, modern and trendy
- Outfits: bikinis, bodysuits, crop tops, mini dresses, trendy athleisure, form-fitting pieces
- Poses: confident, showing curves, hands in hair, hip tilted, direct eye contact
- Makeup: glam but natural with "dewy skin showing visible pores", "natural skin texture", defined brows, glossy lips
- Settings: realistic beaches, pools, bedrooms, tropical locations, urban backgrounds - NOTHING FANTASTICAL
- Lighting: natural golden hour, bright sun, soft window light, Instagram-optimized

MANDATORY STRUCTURE (Single flowing paragraph):
1. TECHNICAL: Start with "Shot on [camera] with [lens], [film characteristics]", then camera angle, mention photography style (candid OR professional shooting)
2. LOCATION: One coherent REALISTIC setting with specific details — only include what logically belongs there
3. POSE: Confident sensual pose showing curves - weight on hip, hands in hair, body angled (can be natural unposed OR intentional posed)
4. OUTFIT: Sexy trendy pieces - describe fabric, cut, color, how it fits the body
5. EXPRESSION: Confident sultry or playful - direct eye contact, slight smile, approachable energy
6. MAKEUP & HAIR: Instagram glam - "dewy skin with visible pores and natural texture", defined features, beachy waves or sleek styles
7. LIGHTING: Natural bright or golden - emphasize how light hits skin and creates glow
8. VIBE: End with "professional [candid OR shooting] photography, natural film grain, authentic skin texture with visible pores, 4K"

BE SPECIFIC: Describe exact pose details, fabric textures, lighting direction, expression nuances, SKIN TEXTURE.
STAY CONSISTENT: Every detail must belong to the same location and session. No surprise props.
STAY REAL: NO fantasy elements, NO impossible scenes, NO overly perfect rendering.
OUTPUT: One continuous ultra-detailed paragraph only. NO lists.`;

const SENSUAL_PROMPT_SYSTEM = `You are a creative director for high-end intimate photography.
Create a suggestive, artistic scene description (max 50 words).

**PHOTOGRAPHY STYLE: MOSTLY CANDID (70% candid / 30% professional)**
- PRIORITIZE authentic candid moments and natural spontaneity
- Occasionally allow intentional intimate poses, but keep it mostly natural
- Focus on unposed, authentic intimate energy

Focus on mood, lighting, and texture. NO EXPLICIT NUDITY.`;

const PORN_PROMPT_SYSTEM = `You are a director for raw, candid, uninhibited amateur photography.
Create a vivid, specific sentence describing a raw photo scene.

**PHOTOGRAPHY STYLE: 100% CANDID ONLY**
- ONLY authentic candid moments - NO professional shooting, NO posed shots
- Must be spontaneous, unposed, natural amateur aesthetic
- Focus on genuine raw moments, smartphone snapshots, amateur flash photography
- Emphasize: "candid", "unposed", "spontaneous", "amateur", "raw moment", "authentic"

Focus on the spontaneous, amateur, flash-photography aesthetic.`;

// ============================================================================
// COMBINATORIAL RANDOMIZATION POOLS (TRUE RANDOMIZE)
// ============================================================================

// --- SOCIAL MODE POOLS ---
const SOCIAL_LOCATIONS = [
    // Travel & Luxury (Europe)
    'Private Yacht Deck in Monaco', 'Santorini Cliffside Terrace', 'Parisian Haussmann Balcony',
    'Swiss Alps Infinity Pool', 'Amalfi Coast Lemon Grove', 'Lake Como Vintage Boat',
    'London Victorian Conservatory', 'Icelandic Black Sand Beach', 'Foggy Scottish Highlands',
    'Venice Grand Canal Gondola', 'Barcelona Gaudi Rooftop', 'Prague Castle Gardens',
    'Croatian Coastal Villa', 'Norwegian Fjord Edge', 'Amsterdam Canal Houseboat',
    'Vienna Opera House Balcony', 'Versailles Palace Gardens', 'Cinque Terre Cliffside',

    // Asia - East
    'Tokyo Cherry Blossom Park', 'Kyoto Zen Garden in Autumn', 'Seoul Gangnam Boutique Street',
    'Shanghai Bund Waterfront', 'Singapore Marina Bay Gardens', 'Kyoto Bamboo Forest Grove',
    'Osaka Dotonbori Canal Daytime', 'Beijing Forbidden City Courtyard', 'Hong Kong Victoria Peak',
    'Tokyo Traditional Tea House', 'Nara Deer Park Temple', 'Taipei Mountain Temple',

    // Asia - Southeast
    'Bali Rice Terrace Temple', 'Bangkok Floating Market', 'Phuket Beach Sunset',
    'Angkor Wat Stone Ruins', 'Hanoi Old Quarter Street', 'Singapore Botanical Garden',
    'Bali Infinity Pool Jungle', 'Manila Bay Sunset', 'Kuala Lumpur Colonial Quarter',
    'Vietnamese Halong Bay Boat', 'Balinese Monkey Forest', 'Thai Island Beach Cave',

    // Asia - South & Central
    'Mumbai Bollywood Studio', 'Jaipur Pink City Palace', 'Taj Mahal Reflecting Pool',
    'Delhi Lotus Temple Garden', 'Goa Beach Shack Sunset', 'Kerala Houseboat Backwaters',
    'Kathmandu Temple Square', 'Maldives Overwater Villa', 'Sri Lanka Tea Plantation',

    // Middle East
    'Dubai Traditional Souk', 'Marrakech Riad Courtyard', 'Istanbul Bosphorus Terrace',
    'Abu Dhabi Desert Dunes', 'Cairo Pyramids Overlook', 'Petra Rose City Ruins',
    'Santorini Blue Dome Church', 'Tel Aviv Beach Promenade', 'Cappadocia Hot Air Balloon',
    'Dead Sea Salt Shore', 'Oman Mountain Fort', 'Jerusalem Old City Stone Alley',

    // Africa
    'Cape Town Table Mountain Vista', 'Marrakech Souk Alley', 'Zanzibar Beach Villa',
    'Serengeti Safari Jeep', 'Victoria Falls Overlook', 'Sahara Desert Camp',
    'Moroccan Hammam Spa', 'South African Vineyard', 'African Savanna Sunset',
    'Ethiopian Highlands Cliff', 'Seychelles Private Island', 'Kenya Maasai Village',

    // North America - Urban
    'New York Penthouse Loft', 'Brooklyn Brownstone Steps', 'Los Angeles Sunset Boulevard',
    'Miami Art Deco District', 'San Francisco Golden Gate', 'Chicago Rooftop Skyline',
    'Toronto CN Tower View', 'Vancouver Seawall Path', 'Montreal Old Port Cobblestone',
    'Seattle Pike Place Market', 'Austin Music Venue', 'Manhattan Fire Escape',
    'Hollywood Hills Villa Pool', 'Boston Brownstone Library', 'Philadelphia Historic Street',

    // North America - Nature
    'Joshua Tree Desert Sunset', 'Grand Canyon Rim', 'Yosemite Valley Floor',
    'Yellowstone Hot Springs', 'Niagara Falls Mist', 'Alaska Glacier Bay',
    'Arizona Red Rock Canyon', 'California Redwood Forest', 'Hawaiian Volcanic Beach',
    'Colorado Rocky Mountain Peak', 'Canadian Rockies Lake', 'Mexican Cenote Cave',

    // Latin America
    'Tulum Jungle Beach Club', 'Rio de Janeiro Beach Overlook', 'Buenos Aires Tango Hall',
    'Cartagena Colonial Balcony', 'Patagonia Glacier Lake', 'Machu Picchu Stone Terrace',
    'Havana Vintage Car Street', 'Costa Rica Rainforest Canopy', 'Amazon River Lodge',
    'Mexican Hacienda Courtyard', 'Chilean Wine Valley', 'Brazilian Colonial Square',
    'Iguazu Falls Rainbow Spray', 'Bolivia Salt Flats Mirror', 'Cuban Colonial Rooftop',

    // Oceania
    'Sydney Opera House Steps', 'Great Barrier Reef Boat', 'New Zealand Fjord',
    'Bora Bora Overwater Bungalow', 'Australian Outback Rock', 'Fiji Island Beach',
    'Melbourne Coffee Lane', 'Tahitian Waterfall Pool', 'Queenstown Mountain View',

    // Urban Classic & Refined
    'Marble Hotel Lobby', 'Vintage Record Store', 'Art Gallery White Walls',
    'Brutalist Concrete Stairwell', 'Industrial Loft with Exposed Brick', 'Classic Theater Balcony',
    'Parisian Café Terrace', 'London Underground Platform', 'New York Public Library',

    // Nature & Surreal
    'Lavender Field in Provence', 'Salt Flats at Sunset', 'Deep Mossy Forest',
    'Secluded Waterfall Lagoon', 'Lunar Landscape Iceland', 'Glass House in Rainforest',
    'Underwater Glass Tunnel', 'Blooming Cherry Blossom Park', 'Antelope Canyon Light Beams',
    'Aurora Borealis Night', 'Tulip Fields Netherlands', 'Sunflower Field Endless',
    'Misty Mountain Temple', 'Frozen Ice Cave Blue', 'Desert Oasis Palm Trees',
    'Cliffside Monastery Balcony', 'Autumn Forest Path', 'Spring Meadow Wildflowers'
];

const SOCIAL_STYLES = [
    // Classic Luxury
    'Old Money Aesthetic', 'Golden Age Hollywood', 'Vogue Italia High Drama',
    'Minimalist Calvin Klein Vibe', 'Maximalist Gucci Style', 'French Riviera Elegance',

    // Vintage & Retro
    'Vintage 70s Kodachrome', '90s Supermodel Grunge', '90s Minimalism',
    'Film Noir Cinematic', '80s Power Dressing', '60s Mod Fashion',
    'Art Deco Glamour', 'Roaring 20s Flapper', 'Victorian Gothic',

    // Modern Street & Urban
    'Streetwear Hypebeast', 'Urban Street Style', 'Tokyo Street Fashion',
    'Berlin Underground', 'Brooklyn Hipster Indie', 'LA Skater Aesthetic',
    'Miami Vice Pastel', 'Contemporary Streetwear', 'Paris Fashion Week Front Row',

    // Cultural & Regional
    'K-Pop Idol Glam', 'African Heritage Style', 'Indian Bridal Opulence',
    'Japanese Harajuku Style', 'Scandi Minimalist', 'Mediterranean Bohemian',
    'Brazilian Carnival Vibrant', 'Mexican Folklorico Vibrant', 'Russian Imperial Luxe',

    // Nature & Dreamy
    'Cottagecore Romantic', 'Ethereal Fairycore', 'Dark Academia',
    'Pastel Dreamscape', 'Witchy Forest Dweller', 'Mermaidcore Ocean Vibes',
    'Naturalist Earthy', 'Celestial Stargazer', 'Botanical Garden Editorial',

    // Artistic & Cinematic
    'Wes Anderson Symmetric', 'Bohemian Chic', 'Monochrome Everything',
    'Neo-Victorian Romance', 'Contemporary Fashion', 'Classic Editorial',
    'Studio Ghibli Whimsical', 'Tim Burton Dark Fantasy', 'Wong Kar-wai Cinematic Mood'
];

const SOCIAL_ACTIONS = [
    // Elegant & Luxury
    'Walking confidently towards camera', 'Lounging carelessly', 'Drinking champagne',
    'Adjusting sunglasses', 'Holding a bouquet of flowers', 'Hailing a taxi',
    'Reading a vintage book', 'Applying lipstick at vanity', 'Stepping out of limousine',

    // Candid & Movement
    'Dancing mid-motion', 'Laughing candidly', 'Running away from camera',
    'Jumping on a bed', 'Twirling in dress', 'Skipping down street',
    'Riding a bicycle casually', 'Walking dog in park', 'Catching falling cherry blossoms',

    // Mirror & Reflection
    'Selfie in a mirror', 'Fixing hair in reflection', 'Looking over shoulder',
    'Checking outfit in shop window', 'Adjusting tie in chrome surface', 'Posing with phone selfie',

    // Urban Cool
    'Leaning against a wall', 'Sitting cross-legged on floor', 'Smoking a cigarette dramatically',
    'Adjusting motorcycle helmet', 'Spray painting graffiti on wall', 'Playing vintage arcade game',
    'Browsing vinyl records in shop', 'Skateboarding down street', 'Leaning on vintage car',

    // Cultural & Artistic
    'Sipping matcha at tea ceremony', 'Playing traditional instrument', 'Writing calligraphy',
    'Arranging flowers ikebana style', 'Dancing tango with partner', 'Painting at easel',
    'Reading poetry aloud', 'Practicing yoga pose', 'Meditating in lotus position',

    // Food & Lifestyle
    'Eating pizza in couture', 'Cooking in luxury kitchen', 'Tasting wine at vineyard',
    'Pouring coffee in café', 'Eating ramen with chopsticks', 'Biting into croissant',
    'Making cocktail at bar', 'Rolling sushi', 'Decorating cake artistically'
];

const SOCIAL_LIGHTING = [
    // Natural Light
    'Golden Hour Sun Flare', 'Blue Hour Twilight', 'Soft Window Light',
    'Dappled Sunlight through Leaves', 'Overcast Softbox Effect', 'Midday Harsh Sun',
    'Sunrise Warm Glow', 'Sunset Orange Cast', 'Cloudy Day Diffusion',

    // Artificial Dramatic
    'Harsh Flash Photography', 'Candlelight Glow', 'Studio Ring Light',
    'Cinematic Rim Lighting', 'Moody Shadow Play', 'Dramatic Chiaroscuro',
    'Split Lighting Portrait', 'Rembrandt Lighting Triangle', 'Butterfly Lighting Glamour',

    // Urban & Classic
    'Warm Café Interior Light', 'Classic Street Lamp Glow', 'Museum Gallery Lighting',
    'Colored Gel Theatrical Lighting', 'Car Headlights at Night', 'Streetlight Orange Glow',
    'Warm Indoor Ambient Light', 'Classic Billboard Backlight', 'Warm Edison Bulbs',

    // Creative & Mood
    'Underwater Light Patterns', 'Projector Light Pattern', 'Aquarium Blue Ambient',
    'Firelight Dancing Shadows', 'Sparkler Light Trails', 'Fairy Lights Bokeh',
    'Moonlight Cold Silver', 'Lightning Storm Flash', 'Northern Lights Aurora'
];

// --- SENSUAL MODE: COMBINATORIAL POOLS (now 30^6 = ~729 MILLION combinations) ---
const SENSUAL_SETTINGS = [
    // Western Luxury (Original 15)
    'luxurious master bedroom with crisp white Egyptian cotton sheets artfully rumpled, plush down pillows scattered casually, morning light streaming through sheer ivory curtains',
    'spa-like bathroom with floor-to-ceiling white marble walls veined in soft grey, steam billowing, soft recessed lighting creating warm glow',
    'opulent vintage boudoir with deep burgundy velvet walls, ornate gold-framed mirrors, crystal chandelier casting prismatic sparkles, antique Persian rug',
    'luxury penthouse balcony overlooking twinkling city lights at midnight, wrought iron railing with climbing jasmine, sheer white curtains billowing through French doors',
    'rustic luxury cabin with massive stone fireplace crackling with dancing flames, thick sheepskin rug before hearth, exposed wooden beam ceiling',
    'freestanding vintage clawfoot bathtub scattered with hundreds of fresh rose petals in deep red and blush pink, pillar candles casting warm glow',
    'minimalist white bedroom with floor-to-ceiling windows, afternoon sun streaming through gauzy sheer curtains dancing in breeze',
    'vintage-style dressing room with large ornate gold-framed vanity mirror surrounded by soft globe lights, perfume bottles scattered elegantly',
    'secluded tropical infinity pool at sunset, warm stone deck, lush palms framing view, water reflecting golden sky',
    'Parisian hotel suite with tall French windows, ornate moldings, champagne on ice, city of lights twinkling beyond',
    'yacht master cabin with polished teak, porthole windows showing moonlit ocean, crisp white linens, gentle rocking motion',
    'greenhouse conservatory at golden hour, tropical plants surrounding vintage daybed, glass ceiling filtering warm rays',
    'Japanese onsen private bath with natural stone, steam rising, bamboo screens, zen rock garden visible',
    'Moroccan riad bedroom with intricate zellige tiles, silk cushions, brass lanterns casting geometric shadows',
    'mountain chalet with floor-to-ceiling windows showing snowy peaks, fur throws on bed, fire crackling in corner',

    // Multicultural Expansion (New 15)
    'traditional Japanese ryokan room with tatami mats, paper shoji screens filtering moonlight, cedar wood soaking tub steaming, mountain view beyond',
    'Moroccan hammam spa with hand-carved zellige tiles in cobalt and gold geometric patterns, copper washing bowls, eucalyptus steam billowing through arched doorways',
    'Scandinavian lakeside sauna with floor-to-ceiling windows overlooking snow-covered pine forest, birchwood benches radiating warmth, icy lake visible through mist',
    'Indian palace bedroom with silk curtains in deep jewel tones draped from ceiling, brass incense burners releasing sandalwood smoke, hand-carved rosewood furniture',
    'Greek island cave suite with whitewashed stone curves, blue painted dome ceiling, gauzy white fabric billowing from arched opening showing Aegean sunset',
    'Balinese outdoor pavilion with carved teak four-poster bed, flowing mosquito net canopy, frangipani flowers scattered, rice paddy terraces visible',
    'Brazilian rainforest eco-lodge with open-air shower surrounded by tropical flowers, misty morning light filtering through canopy, exotic bird calls',
    'Russian banya steam room with birch wood walls, eucalyptus branches hanging, ice bucket beside sauna bench, snow visible through small frosted window',
    'Thai beach villa with silk cushions on teak daybed, sheer curtains billowing from monsoon breeze, turquoise ocean beyond, jasmine incense',
    'Swiss alpine lodge with stone fireplace, hand-woven wool blankets in traditional patterns, floor-to-ceiling windows showing Matterhorn at golden hour',
    'Costa Rican treehouse bedroom with hanging bed swaying gently, jungle canopy surrounding, sunset painting sky orange through open walls, howler monkeys distant',
    'Icelandic hot spring grotto with natural volcanic rock formations, steam mixing with cold arctic air, midnight sun creating ethereal glow through opening',
    'Santorini cliffside cave room with whitewashed curves and blue accents, caldera view through arched window, sunset flooding interior with golden light',
    'Arizona desert luxury tent with Navajo textiles, campfire glow dancing on canvas walls, saguaro cactus silhouettes against starlit purple sky',
    'Norwegian cabin with northern lights visible through skylight above bed, reindeer pelts, clusters of pillar candles, pine forest silence'
];

const SENSUAL_POSES = [
    'lying on her side facing camera, body creating elegant S-curve, one leg extended languidly, torso propped on elbow, fingers loosely threaded through hair',
    'standing at vanity partially visible in mirror, weight on one hip, one arm running fingers through damp hair, the other resting on counter',
    'reclined dramatically in classic odalisque pose, body stretched lengthwise, one arm draped overhead, back arched subtly',
    'leaning against railing looking over bare shoulder, weight shifted to one hip creating natural curve, holding champagne flute',
    'lying on stomach facing camera propped on elbows, chin resting on interlaced fingers, legs bent with feet playfully crossed in air',
    'reclined in bath with head resting against edge, one arm draped over tub fingers dangling, knees peeking above water',
    'standing among billowing curtains in graceful mid-motion dance pose, one arm extended touching fabric above, weight on one leg',
    'seated at vanity turned three-quarters toward mirror, upper body twisted back, hand raised adjusting earring',
    'kneeling on bed with back arched, hands running through hair above head, face tilted toward light',
    'stretching languorously with arms overhead, spine arched, eyes half-closed in pleasure',
    'sitting cross-legged on silk sheets, leaning forward slightly, intimate eye contact, finger tracing collarbone',
    'standing in doorway silhouetted by backlight, hip cocked, one arm raised against frame',
    'lying back with one arm behind head, other hand resting on stomach, legs artfully positioned',
    'perched on edge of bed, legs crossed elegantly, leaning back on hands, chest forward',
    'on all fours on bed looking back over shoulder seductively, back arched, sheets tangled around body',
];

const SENSUAL_OUTFITS = [
    'sheet draped strategically across hip revealing bare shoulder and upper back',
    'white towel wrapped loosely at chest threatening to slip, water droplets on skin',
    'sheer black lace bodysuit with intricate floral pattern revealing hints of skin beneath',
    'floor-length silk slip gown in pale champagne with low cowl back revealing spine, thin straps',
    'oversized cream cable-knit sweater hanging off one shoulder, hem riding up to reveal curves',
    'rose petals artfully covering skin, floating and clinging with water',
    'simple white cotton bralette and matching high-waisted briefs, silhouette visible through fabric',
    'delicate blush pink lace set with scalloped edges, straps falling off shoulder',
    'satin kimono robe loosely tied, slipping open to reveal décolletage and leg',
    'nothing but strategic shadows and hair placement for tasteful coverage',
    'vintage silk slip in ivory, thin straps, lace trim at hem, fabric catching every curve',
    'sheer mesh bodysuit with embroidered flowers covering just the essentials',
    'boyfriend shirt completely unbuttoned, clutched together with one hand at chest',
    'delicate gold body chain draped across otherwise bare skin',
    'high-waisted vintage panties and matching bralette in deep burgundy velvet',
];

const SENSUAL_EXPRESSIONS = [
    'intimate and inviting with half-lidded bedroom eyes, lips slightly parted in lazy contentment, knowing smile',
    'serene post-shower bliss, eyes closed peacefully or gazing dreamily, quiet contentment',
    'confident sensual power, eyes locked on camera with smoldering intensity, slight pout of desire',
    'wistful romantic longing mixed with contentment, soft dreamy eyes, gentle Mona Lisa smile',
    'pure cozy contentment, eyes bright and playful, genuine relaxed smile showing warmth',
    'blissful relaxation with eyes closed peacefully, lips parted in soft sigh, complete surrender',
    'joyful freedom with eyes closed face turned toward light, genuine smile of pure happiness',
    'private self-appreciation, eyes meeting own gaze with quiet confidence, subtle satisfied smile',
    'teasing playfulness, biting lower lip, eyes sparkling with mischief and invitation',
    'vulnerable openness, soft unfocused gaze, parted lips, exposed and trusting',
    'fierce seduction, intense unwavering eye contact, challenging and magnetic presence',
    'sleepy morning softness, slow blink, lazy smile, utterly relaxed and unguarded',
    'mysterious allure, eyes partially hidden by hair or shadow, enigmatic expression',
    'heated desire, flushed cheeks, heavy-lidded eyes, breath visible on lips',
    'innocent curiosity mixed with dawning excitement, wide eyes, parted lips',
];

const SENSUAL_LIGHTING = [
    'magic hour morning light, warm directional beams creating rim lighting on hair and shoulder, golden particles in beams',
    'warm recessed spots with steam diffusing into dreamy softness, rim lighting from behind',
    'dramatic chiaroscuro with warm chandelier glow creating pools of golden light, deep shadows',
    'cool blue moonlight from above mixed with warm golden interior light behind creating rim lighting',
    'entirely from fireplace creating dramatic warm directional light, dancing shadows as flames flicker',
    'candlelight creating warm pools with reflections dancing on water surface, steam adding diffusion',
    'brilliant afternoon backlight creating silhouettes and transparency, dreamy overexposed highlights',
    'soft globe bulbs creating even flattering illumination, warm color temperature, gentle shadows',
    'golden hour sun flare streaming through window creating lens effects and warm skin glow',
    'warm ambient light from vintage lamps creating intimate atmosphere, mixing with window light',
    'single spotlight creating dramatic contrast, figure emerging from darkness',
    'diffused overcast window light wrapping softly around curves, no harsh shadows',
    'string lights bokeh in background with soft focused warm glow on subject',
    'mixed practical lighting from lamps creating intimate pools with deep shadows between',
    'underwater caustic light patterns dancing across skin, ethereal and otherworldly',
];

const SENSUAL_AESTHETICS = [
    'high-end boudoir editorial, tasteful sensuality, Playboy Elegant style quality, 8K resolution',
    'intimate bathroom moment, tasteful glimpse of private ritual, lifestyle intimate quality',
    'old Hollywood glamour boudoir, powerful feminine sensuality, Helmut Newton inspired',
    'cinematic balcony romance, intimate contemplative mood, romantic film still quality',
    'cabin romance aesthetic, hygge intimate comfort, lifestyle intimate cozy',
    'luxury self-care ritual, sensual relaxation, high-end spa editorial quality',
    'ethereal elements of freedom through pure aesthetic, fine art boudoir quality',
    'vintage glamour getting-ready aesthetic, intimate confident femininity, celebrity portrait quality',
    'fashion magazine boudoir spread, Victoria Secret catalog style, aspirational luxury',
    'art photography sensuality, museum-worthy composition, subtle eroticism',
    'raw intimate documentary, real moment captured, voyeuristic authenticity',
    'dream sequence aesthetic, soft focus romance, fantasy atmosphere',
    'European art house film still, sophisticated desire, cinematic mood',
    'contemporary luxury lifestyle, influencer aesthetic, aspirational but attainable',
    'classic pin-up reimagined, retro glamour with modern sensibility, timeless appeal',
];



// --- PORN MODE: COMBINATORIAL POOLS (15^6 = ~11 million combinations) ---
const PORN_SETTINGS = [
    'messy lived-in bedroom with unmade bed sheets bunched, clothes scattered on floor, dim bedside lamp, phone charger visible',
    'steamy post-shower bathroom with foggy mirror partially wiped, water droplets on glass, toiletries scattered on counter',
    'messy midnight kitchen with dirty dishes in sink, microwave clock showing late hour, refrigerator door open casting blue glow',
    'car backseat late at night with leather seats, fogged windows from body heat, streetlight orange glow filtering through',
    'generic beige hotel room with bed partially disturbed, suitcase open, work clothes tossed on chair, room service tray visible',
    'walk-in shower with frosted glass door partially open, steam billowing out, bathroom tiles visible, bathmat on floor',
    'lived-in bedroom with LED strip lights casting purple glow, gaming setup visible, tapestries on wall, dorm chaos',
    'messed-up bedroom post-intimacy with tangled sheets half on floor, wine glasses on nightstand, clothing trail across room',
    'cramped apartment bathroom with harsh fluorescent light, shower curtain bunched, toilet visible, medicine cabinet open',
    'public restroom stall with graffiti walls, harsh overhead light, tile floor, door latch visible',
    'office after hours with desk lamp only light, papers scattered, computer screen glow, blinds half-closed',
    'basement laundry room with washing machine vibrating, harsh bare bulb overhead, concrete floor',
    'tent interior at night with sleeping bag visible, flashlight beams, camping gear scattered',
    'gym locker room bench with lockers behind, harsh fluorescent, towels and bags scattered',
    'stairwell emergency exit with harsh light, concrete steps, industrial setting',
];

const PORN_POSES = [
    'holding phone capturing selfie, other hand pulling up shirt to expose midriff and underwear, weight on one hip',
    'standing before mirror in just underwear or nude, one hand holding phone other wiping steam or resting on hip',
    'bent over counter reaching, bare from waist down, oversized shirt riding up revealing explicit view from behind',
    'reclined with legs spread or pulled up, skirt hiked or pants down, one hand between legs other holding phone',
    'on bed in provocative pose, legs spread or ass up, robe open or removed, explicit angles showing nudity',
    'nude pressed against glass, hands and curves visible through texture, face pressed against surface playfully',
    'kneeling in front of laptop, body angled for camera, nude leaning forward creating exaggerated angles',
    'tangled in sheets with coverage slipping, one arm over head in sleepy stretch, post-sex relaxation',
    'squatting with legs apart, looking up at camera from below, hands braced on knees',
    'lying back with legs raised and spread, holding own thighs, vulnerable explicit presentation',
    'on all fours looking back over shoulder, ass raised, back arched dramatically',
    'sitting on edge of surface with legs wide open, leaning back on hands, fully exposed',
    'standing lifting one leg to reveal, hand pulling underwear aside, challenging eye contact',
    'bending over touching toes, looking between own legs at camera behind',
    'straddling pillow or surface grinding, hands on body, caught mid-motion',
];

const PORN_STATES = [
    'completely bare-faced with visible skin texture and pores, slight tired circles, natural imperfections',
    'fresh from shower with damp dewy skin, no makeup, natural flush from hot water, vulnerable',
    'bare-faced tired appearance with pillow creases on cheek, 3am realness, no styling',
    'disheveled with smeared lipstick, messy hair from activity, sweaty skin catching light',
    'slightly drunk flush visible, work makeup partially intact but smudged, messed hair',
    'completely natural no makeup, wet hair plastered to face, water droplets everywhere',
    'bedroom makeup smudged, messed from performance, shiny sweaty skin, glitter visible',
    'makeup from last night smeared giving raccoon eyes, lipstick kissed off, complete disaster',
    'post-gym sweaty with hair sticking to face, flushed skin, sports bra lines visible',
    'tan lines visible from swimsuit, fresh from beach or pool, sun-kissed dishevelment',
    'morning face with puffy eyes, sleep marks on skin, completely unready',
    'running makeup from tears or sweat, mascara tracks down cheeks',
    'hickeys and marks visible on neck and body, post-rough-session evidence',
    'visibly aroused with flushed chest and hardened features, genuine physical response',
    'cum or fluid visible on skin, raw unedited evidence of activity',
];

const PORN_EXPRESSIONS = [
    'direct eye contact with camera, lips parted slightly, caught between playful and provocative',
    'casual intimate expression, slight smirk or blank neutral, authentic moment',
    'surprised or playfully annoyed, caught in act, authentic candid reaction',
    'aroused concentration or direct challenge to camera, flushed cheeks, heavy breathing',
    'genuine arousal or playful invitation, wanting to send photo quickly',
    'tongue out licking surface or lip, eyes seductively closed, genuine playfulness',
    'practiced seductive expression, tongue out or lip bite, genuine arousal visible',
    'genuine post-orgasm glow or sleepy daze, completely satisfied relaxation',
    'bratty defiant look, challenging the viewer, no shame showing',
    'overwhelmed pleasure expression, eyes rolled back, mouth open',
    'begging expression, desperate and needy, asking for more',
    'smug satisfied after-pleasure smirk, knowing what was just done',
    'intense focused eye contact, predatory and in control',
    'innocent confusion pretending, playing naive while fully exposed',
    'genuine enjoyment and pride in own body, confident exhibition',
];

const PORN_QUALITY = [
    'brutal direct flash creating flat frontal lighting with harsh shadows, motion blur, phone glow in eyes',
    'bathroom fluorescent harsh mixing with warm vanity, steam diffusing, mirror flash hotspot',
    'single harsh light from fridge creating dramatic side lighting, everything else underexposed',
    'harsh overhead dome light creating unflattering shadows, streetlight filtering, condensation softening',
    'flat hotel overhead lights, no drama just functional visibility, phone flash harsh fill',
    'diffused bathroom light through steam and glass, warm glow, soft and obscured',
    'mixed LED ambient saturated purple or pink, laptop screen from below, ring light in eyes',
    'pure golden morning light through curtains, soft warm directional, sheet shadows',
    'harsh bare bulb overhead creating unflattering top-down shadows, industrial',
    'phone flashlight creating stark white circle of light, everything else pitch black',
    'webcam quality grainy underexposed, pixelated around edges, motion artifacts',
    'ring light only creating flat even illumination, shadow behind head on wall',
    'natural window light but underexposed, silhouette effect, intimate',
    'multiple light sources creating confusing shadows, mixed color temperatures',
    'night vision green tint quality, surveillance aesthetic, voyeuristic',
];

const PORN_VIBES = [
    'genuine leaked private photo vibe, raw unfiltered authenticity, smartphone snapshot realism',
    'private bathroom moment aesthetic, unsexy mundane setting making nudity more intimate',
    'caught-in-act candid aesthetic, mundane domesticity making content voyeuristic and real',
    'secret car hookup aesthetic, forbidden confined space intimacy, amateur snapshot',
    'anonymous travel affair aesthetic, could-be-anyone-anywhere transient intimacy',
    'teasing obscured nudity aesthetic, artistic-by-accident, voyeuristic intimacy',
    'webcam performer aesthetic, exhibitionist broadcast vibe, compressed video grab feel',
    'morning-after intimacy, post-coital vulnerability and satisfaction, candid moment',
    'OnlyFans content aesthetic, personal yet performative, subscriber intimacy',
    'sexting photo aesthetic, quick snap meant for one person, raw honesty',
    'revenge porn aesthetic but consensual, forbidden documentation feeling',
    'hookup documentation, proof of encounter, trophy shot energy',
    'cam show screenshot aesthetic, mid-performance grab, interactive intimacy',
    'couples content vibe, POV partner perspective, genuine relationship intimacy',
    'cheating evidence aesthetic, guilty secret, forbidden and thrilling',
];




// ============================================================================
// INTELLIGENT RANDOMIZER - WEIGHTED SELECTION WITH HISTORY TRACKING
// ============================================================================

/**
 * Smart randomizer that prevents short-term repetition by tracking recent usage.
 * Items used recently get lower weight, ensuring better perceived variety.
 */
class IntelligentRandomizer {
    private recentUsage: Map<string, number> = new Map();
    private readonly usageWindow = 50; // Track last 50 selections
    private readonly hourMs = 3600000; // 1 hour in milliseconds

    /**
     * Get a weighted random item from the pool.
     * Recently used items have reduced probability of being selected again.
     * 
     * @param pool - Array of items to select from
     * @param poolName - Unique name for this pool (for tracking)
     * @returns Randomly selected item with anti-repetition weighting
     */
    getWeightedRandom<T>(pool: T[], poolName: string): T {
        if (pool.length === 0) {
            throw new Error(`Cannot select from empty pool: ${poolName}`);
        }

        if (pool.length === 1) {
            return pool[0];
        }

        // Calculate weights based on recency of use
        const weights = pool.map((item, idx) => {
            const key = `${poolName}_${idx}`;
            const lastUsed = this.recentUsage.get(key) || 0;
            const recency = Date.now() - lastUsed;

            // Weight formula: 1 + (hours since last use)
            // Just used (0hr) = weight 1
            // Used 1hr ago = weight 2
            // Used 10hr ago = weight 11
            // Never used = weight very high
            return lastUsed === 0 ? 100 : (1 + (recency / this.hourMs));
        });

        // Weighted random selection
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < pool.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                this.recordUsage(`${poolName}_${i}`);
                return pool[i];
            }
        }

        // Fallback (should never reach here)
        return pool[pool.length - 1];
    }

    /**
     * Record that an item was used and cleanup old entries.
     */
    private recordUsage(key: string) {
        this.recentUsage.set(key, Date.now());

        // Periodic cleanup to prevent memory leak
        if (this.recentUsage.size > this.usageWindow * 10) {
            const entries = Array.from(this.recentUsage.entries())
                .sort((a, b) => b[1] - a[1]) // Sort by timestamp descending
                .slice(0, this.usageWindow); // Keep only most recent
            this.recentUsage = new Map(entries);
        }
    }
}

// Global instance (persists across API calls within same Node process)
const randomizer = new IntelligentRandomizer();

// Legacy helper for simple cases (now uses weighted randomizer internally)
const getRandomItem = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Enhance a prompt with dynamic modifiers for additional richness.
 * Randomly adds camera/lens details, mood, and composition guidelines.
 * 
 * @param basePrompt - The base prompt to enhance
 * @param mode - Content mode (social, sensual, porn)
 * @returns Enhanced prompt with modifiers
 */
function enhanceWithModifiers(basePrompt: string, mode: ContentMode): string {
    let enhanced = basePrompt;

    // 40% chance for camera/lens modifier (technical detail)
    // Only for social mode - sensual/porn already have specific aesthetics
    if (Math.random() > 0.6 && mode === 'social') {
        enhanced += `, ${randomizer.getWeightedRandom(CAMERA_MODIFIERS, 'camera')}`;
    }

    // 30% chance for mood modifier (emotional context)
    if (Math.random() > 0.7) {
        enhanced += `, ${randomizer.getWeightedRandom(MOOD_MODIFIERS, 'mood')}`;
    }

    // 30% chance for composition modifier (framing guidance)
    // Only for social mode
    if (Math.random() > 0.7 && mode === 'social') {
        enhanced += `, ${randomizer.getWeightedRandom(COMPOSITION_MODIFIERS, 'composition')}`;
    }

    return enhanced;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: Request) {
    try {
        const {
            contentMode = 'social',
            shootingDirection = 'random',
        }: { contentMode?: ContentMode; shootingDirection?: ShootingDirectionId } = await request.json().catch(() => ({}));

        // Get user's API key (falls back to env var if not configured)
        const apiKey = await getUserApiKey();

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Aucune clé API Wavespeed configurée. Veuillez configurer votre clé dans les paramètres.' },
                { status: 500 }
            );
        }

        // TRUE RANDOMIZE LOGIC: Combinatorial Generation
        const systemPrompt = SOCIAL_PROMPT_SYSTEM;

        // Setup API defaults
        let apiUrl = 'https://llm.wavespeed.ai/v1/chat/completions';
        let apiModel = 'anthropic/claude-sonnet-4.5';
        let apiAuthToken = apiKey;

        // =================================================================
        // SENSUAL MODE: Combinatorial generation (~11 million unique prompts)
        // =================================================================
        if (contentMode === 'sensual') {
            const setting = randomizer.getWeightedRandom(SENSUAL_SETTINGS, 'sensual_setting');
            const pose = randomizer.getWeightedRandom(SENSUAL_POSES, 'sensual_pose');
            const outfit = randomizer.getWeightedRandom(SENSUAL_OUTFITS, 'sensual_outfit');
            const expression = randomizer.getWeightedRandom(SENSUAL_EXPRESSIONS, 'sensual_expression');
            const lighting = randomizer.getWeightedRandom(SENSUAL_LIGHTING, 'sensual_lighting');
            const aesthetic = randomizer.getWeightedRandom(SENSUAL_AESTHETICS, 'sensual_aesthetic');

            const combinedPrompt = `Ultra-realistic intimate boudoir photography, vertical portrait format, 85mm portrait lens with beautiful bokeh; ${setting}; the subject ${pose}, wearing ${outfit}; expression is ${expression}; ${lighting}; ${aesthetic}, photorealistic, ultra-detailed skin texture and fabric`;
            return NextResponse.json({ prompt: enhanceWithModifiers(combinedPrompt, 'sensual') });
        }

        // =================================================================
        // PORN MODE: Combinatorial generation (~11 million unique prompts)
        // =================================================================
        if (contentMode === 'porn') {
            const setting = randomizer.getWeightedRandom(PORN_SETTINGS, 'porn_setting');
            const pose = randomizer.getWeightedRandom(PORN_POSES, 'porn_pose');
            const state = randomizer.getWeightedRandom(PORN_STATES, 'porn_state');
            const expression = randomizer.getWeightedRandom(PORN_EXPRESSIONS, 'porn_expression');
            const quality = randomizer.getWeightedRandom(PORN_QUALITY, 'porn_quality');
            const vibe = randomizer.getWeightedRandom(PORN_VIBES, 'porn_vibe');

            const combinedPrompt = `Raw amateur smartphone photography, vertical format, explicit content; ${setting}; the subject ${pose}; ${state}; expression showing ${expression}; ${quality}; ${vibe}, intentionally amateur quality with noise grain and compression artifacts`;
            return NextResponse.json({ prompt: enhanceWithModifiers(combinedPrompt, 'porn') });
        }

        // =================================================================
        // SOCIAL MODE: Uses LLM for creative, detailed editorial prompts
        // =================================================================
        // (At this point, contentMode must be 'social' since sensual/porn returned early)

        // Resolve direction-specific pools (fall back to full pools if 'random' or empty)
        const directionLocations = DIRECTION_LOCATIONS[shootingDirection];
        const directionStyles = DIRECTION_STYLE_SEEDS[shootingDirection];
        const hasDirectionLocations = directionLocations && directionLocations.length > 0;
        const hasDirectionStyles = directionStyles && directionStyles.length > 0;

        const loc = hasDirectionLocations
            ? randomizer.getWeightedRandom(directionLocations, `dir_${shootingDirection}_loc`)
            : randomizer.getWeightedRandom(SOCIAL_LOCATIONS, 'social_location');

        const style = hasDirectionStyles
            ? randomizer.getWeightedRandom(directionStyles, `dir_${shootingDirection}_style`)
            : randomizer.getWeightedRandom(SOCIAL_STYLES, 'social_style');

        const action = randomizer.getWeightedRandom(SOCIAL_ACTIONS, 'social_action');
        const lighting = randomizer.getWeightedRandom(SOCIAL_LIGHTING, 'social_lighting');

        // Direction system hint (empty string for 'random')
        const directionMeta = SHOOTING_DIRECTIONS.find(d => d.id === shootingDirection);
        const directionHint = directionMeta?.systemHint || '';

        const isCandid = directionMeta?.category === 'candid';

        const cameraMandate = isCandid
            ? 'CAMERA RULE (ABSOLUTE): "Shot on iPhone [14/15/16] Pro, handheld" — use this EXACTLY. No professional cameras.'
            : 'CAMERA RULE (ABSOLUTE): Use a professional camera (Canon EOS R6, Sony A7IV, Fujifilm X-T5, or similar DSLR/mirrorless). NO iPhone, NO smartphone camera.';

        const userMessage = `Generate an ULTRA-DETAILED ${isCandid ? 'candid iPhone snapshot' : 'editorial'} prompt.
            
            SCENE SEEDS (use as INSPIRATION, not a checklist):
            - Location/Moment: ${loc}
            - Style/Vibe: ${style}
            - Subject Action: ${action}
            - Lighting: ${lighting}
            ${directionHint ? `\n            SHOOTING DIRECTION (MANDATORY): ${directionHint}` : ''}
            
            ${cameraMandate}
            
            INSTRUCTIONS:
            1. Pick the ONE location/moment above and build ONE coherent scene around it.
            2. Use the other seeds as INSPIRATION — adapt them so they naturally fit the location.
            3. If an element (action, prop, style detail) does NOT belong in this location, DROP IT.
            4. Do NOT invent props, gimmicks or surrealist elements that would look strange in a real photo.
            5. The result must feel like a REAL ${isCandid ? 'spontaneous iPhone snap — blur, grain, imperfect framing are GOOD' : 'professional photoshoot that could actually happen — sharp, intentional, editorial'}.
            Write as ONE FLOWING PARAGRAPH.`;

        // Call LLM
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiAuthToken}`,
            },
            body: JSON.stringify({
                model: apiModel,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                max_tokens: 1500,
                temperature: 1.0, // High creativity
                stream: false,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('LLM API Error:', response.status, errorData);
            throw new Error(errorData.error?.message || `LLM API error (${response.status})`);
        }

        const data = await response.json();
        let generatedPrompt = data.choices?.[0]?.message?.content;

        // Fallback for text completion models
        if (!generatedPrompt && data.choices?.[0]?.text) {
            generatedPrompt = data.choices[0].text;
        }

        if (!generatedPrompt) {
            throw new Error('No prompt generated by LLM');
        }

        return NextResponse.json({ prompt: enhanceWithModifiers(generatedPrompt.trim(), 'social') });

    } catch (error) {
        console.error('Generate random prompt error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate prompt' },
            { status: 500 }
        );
    }
}

