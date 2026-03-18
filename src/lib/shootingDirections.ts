// ============================================================================
// SHOOTING DIRECTIONS — Category-based prompt guidance system
// ============================================================================
// Each direction steers the LLM / combinatorial randomizer toward a specific
// photographic context while keeping the organic, creative feel intact.

export type ShootingDirectionId =
    | 'random'
    | 'street'
    | 'studio'
    | 'apartment'
    | 'event'
    | 'beach'
    | 'fitness'
    | 'car'
    | 'editorial'
    // Candid directions
    | 'candid_random'
    | 'candid_street'
    | 'candid_home'
    | 'candid_party'
    | 'candid_mirror'
    | 'candid_cafe'
    | 'candid_vacation'
    | 'candid_fitness'
    | 'candid_car';

export interface ShootingDirection {
    id: ShootingDirectionId;
    label: string;
    emoji: string;
    description: string;
    category: 'candid' | 'shoot';
    /** System instruction injected into the LLM to steer the output */
    systemHint: string;
}

export const SHOOTING_DIRECTIONS: ShootingDirection[] = [
    {
        id: 'random',
        label: 'Random',
        emoji: '🌀',
        description: 'No direction — full creative freedom',
        category: 'shoot',
        systemHint: '',
    },
    {
        id: 'street',
        label: 'Street',
        emoji: '📸',
        description: 'Urban street photography, pro camera',
        category: 'shoot',
        systemHint: 'This is a street photography session shot on a professional mirrorless or DSLR camera (Canon R6, Sony A7IV, Fujifilm X-T5 etc.). The setting MUST be a real city street, sidewalk, alley, market, or urban outdoor space. Documentary energy, city life, natural light.',
    },
    {
        id: 'studio',
        label: 'Studio',
        emoji: '💡',
        description: 'Professional studio shoot, controlled lighting',
        category: 'shoot',
        systemHint: 'This is a professional studio photoshoot on a high-end DSLR or mirrorless camera. The setting MUST be a photography studio — solid seamless paper backgrounds (white, grey, black, colored), professional softboxes or strobes. Clean, editorial. Think Vogue, Calvin Klein. NO fog machines, NO random props, NO poetry books.',
    },
    {
        id: 'apartment',
        label: 'Appart',
        emoji: '🛋️',
        description: 'Interior lifestyle, cosy home vibes',
        category: 'shoot',
        systemHint: 'This is an indoor lifestyle shoot inside a private apartment or house, shot on a professional camera. The setting MUST be an interior space — bedroom, living room, kitchen, bathroom, balcony. Cosy, intimate, personal. Natural window light. Only props that logically belong in a real home.',
    },
    {
        id: 'candid_random',
        label: 'Random',
        emoji: '🤳',
        description: 'Anywhere, spontaneous iPhone snap',
        category: 'candid',
        systemHint: `CAMERA: "Shot on iPhone [14/15/16] Pro, handheld" — this is NON-NEGOTIABLE. NO professional cameras, NO DSLRs, NO mirrorless cameras for this direction.
The photo MUST feel like a quick iPhone snap: slight motion blur OR camera shake, natural noise grain, slightly imperfect framing, authentic unposed moment.
The subject appears unaware or barely aware of the camera — mid-laugh, mid-movement, mid-sentence, distracted.
Lighting: natural only — window light, outdoor daylight, café ambient, street light. NO studio lighting, NO professional modifiers.
The overall aesthetic: raw, spontaneous, real — like a friend captured the moment quickly before it was gone.`,
    },
    {
        id: 'candid_street',
        label: 'Street',
        emoji: '🏙️',
        description: 'iPhone snap walking in the city',
        category: 'candid',
        systemHint: `CAMERA: "Shot on iPhone [14/15/16] Pro, handheld" — this is NON-NEGOTIABLE. NO professional cameras.
This is an urban street photography snapshot. The setting MUST be a real city street, crosswalk, subway, or bustling sidewalk.
The photo MUST feel like a quick iPhone snap: slight motion blur OR camera shake, natural noise grain, authentic unposed urban moment.
The subject is casually walking, distracted, or caught mid-movement in the city environment.
Lighting: natural city lighting, streetlights, or harsh sunlight. The vibe is raw, spontaneous, everyday city life.`,
    },
    {
        id: 'candid_home',
        label: 'Home',
        emoji: '🛋️',
        description: 'Messy room, relaxed, authentic home snap',
        category: 'candid',
        systemHint: `CAMERA: "Shot on iPhone [14/15/16] Pro, handheld" — this is NON-NEGOTIABLE. NO professional cameras.
This is an authentic, relaxed home snapshot. The setting MUST be inside a cozy, slightly messy apartment — unmade bed, kitchen counter, couch, messy floor.
The photo MUST feel like a quick iPhone snap sent to a friend: slight motion blur, authentic noise, unposed moment.
The subject is chilling, eating, looking at their phone, or doing mundane home activities.
Lighting: natural window light or basic ceiling lamps.`,
    },
    {
        id: 'candid_party',
        label: 'Party',
        emoji: '🪩',
        description: 'Night out, flash, club, blurry lights',
        category: 'candid',
        systemHint: `CAMERA: "Shot on iPhone [14/15/16] Pro with direct harsh flash" — this is NON-NEGOTIABLE. NO professional cameras.
This is a night out snapshot. The setting MUST be a dark environment: nightclub, house party, bar, neon-lit street, or back of a taxi.
The photo MUST have the signature "flash at night" disposable camera or iPhone flash look: direct harsh foreground lighting, dark/underexposed blurry background, red-eye or glowing eyes.
The subject is having fun, dancing, drinking, or mid-laugh. The vibe is chaotic, raw, Gen-Z party aesthetic.`,
    },
    {
        id: 'candid_mirror',
        label: 'Mirror',
        emoji: '🪞',
        description: 'Mirror selfie, bathroom, elevator',
        category: 'candid',
        systemHint: `CAMERA: "Shot on iPhone [14/15/16] Pro in the reflection" — this is NON-NEGOTIABLE.
This is a mirror selfie. The setting MUST be in front of a mirror: bathroom mirror, elevator mirror, gym mirror, or full-length bedroom mirror.
The subject MUST be holding the smartphone, visibly taking their own photo in the reflection.
The composition is classic mirror selfie style, showing the phone blocking part of the face or held at chest level. Casual, trendy, outfit-focused.`,
    },
    {
        id: 'candid_cafe',
        label: 'Café',
        emoji: '☕',
        description: 'Coffee run, brunch date, aesthetic table',
        category: 'candid',
        systemHint: `CAMERA: "Shot on iPhone [14/15/16] Pro, handheld" — this is NON-NEGOTIABLE. NO professional cameras.
This is a relaxed café or restaurant snapshot. The setting MUST be a trendy coffee shop, brunch spot, bakery, or outdoor terrace.
The photo MUST feel like a quick iPhone snap across the table: half-eaten food, matcha lattes, messy table, authentic unposed moment.
The subject is mid-bite, sipping coffee, laughing, or looking at their phone. Everyday lifestyle influencer dump aesthetic.`,
    },
    {
        id: 'candid_vacation',
        label: 'Vacay',
        emoji: '🌴',
        description: 'Beach snap, pool side, resort life',
        category: 'candid',
        systemHint: `CAMERA: "Shot on iPhone [14/15/16] Pro, handheld" — this is NON-NEGOTIABLE. NO professional cameras.
This is a holiday snapshot. The setting MUST be a vacation spot: beach towel, infinity pool edge, resort lounge chair, boat deck.
The photo MUST feel like a quick summer iPhone snap: harsh midday sun, slightly overexposed, salt water on skin, authentic holiday moment.
The subject is relaxing, applying sunscreen, or emerging from the water. Casual beach dump vibe, NOT a professional swimwear campaign.`,
    },
    {
        id: 'candid_fitness',
        label: 'Sweat',
        emoji: '💦',
        description: 'Post-workout, running, gym snapshot',
        category: 'candid',
        systemHint: `CAMERA: "Shot on iPhone [14/15/16] Pro, handheld" — this is NON-NEGOTIABLE. NO professional cameras.
This is a workout snapshot. The setting MUST be a gym, pilates studio, locker room, or outdoor running trail.
The photo MUST feel like an authentic fitness check-in: post-workout red face, sweaty glow, slightly blurry action shot, or locker room selfie.
The subject is exhausted but happy, drinking water, or stretching. Raw exercise energy, NOT a fitness brand editorial.`,
    },
    {
        id: 'candid_car',
        label: 'Car',
        emoji: '🚙',
        description: 'Passenger seat, drive-thru, roadtrip',
        category: 'candid',
        systemHint: `CAMERA: "Shot on iPhone [14/15/16] Pro" — this is NON-NEGOTIABLE. NO professional cameras.
This is a car snapshot. The setting MUST be inside a vehicle: passenger seat, driver seat parked, drive-thru, or road trip POV.
The photo MUST feel like a casual car snap sent to a friend: wide-angle (0.5x) lens distortion, dashboard visible, authentic noise.
The subject is singing, eating fast food, or checking makeup in the visor mirror. Relaxed, everyday transit aesthetic.`,
    },
    {
        id: 'event',
        label: 'Event',
        emoji: '🎉',
        description: 'Nightlife, club, rooftop, restaurant, party',
        category: 'shoot',
        systemHint: 'This is a social event photoshoot on a professional camera. Setting: nightclub, rooftop party, upscale restaurant, or private gathering. Ambient nighttime lighting, warm bokeh, cocktails in hand, social energy. Influencer-at-the-venue editorial feel.',
    },
    {
        id: 'beach',
        label: 'Beach',
        emoji: '🏖️',
        description: 'Beach, pool, travel destinations, luxury resorts',
        category: 'shoot',
        systemHint: 'This is a travel or beach photoshoot on a professional camera. Setting MUST be an outdoor vacation or resort location — beach, infinity pool, tropical villa, yacht deck, or resort terrace. Golden sun, turquoise water, summer outfits or bikinis.',
    },
    {
        id: 'fitness',
        label: 'Fitness',
        emoji: '🏋️',
        description: 'Gym, pilates, running, athleisure lifestyle',
        category: 'shoot',
        systemHint: 'This is a fitness and wellness photoshoot on a professional camera. Setting MUST relate to sports or fitness — gym, pilates studio, outdoor running path, yoga space, or sports court. Athleisure outfits, post-workout glow, dynamic movement or rest poses.',
    },
    {
        id: 'car',
        label: 'Car',
        emoji: '🚗',
        description: 'In or around a car, urban drive vibes',
        category: 'shoot',
        systemHint: 'This is a car photoshoot on a professional camera. Setting MUST involve a vehicle — inside the car (driver or passenger seat), leaning against the car exterior, gas station, underground parking, or parking lot at night. Urban lifestyle or luxury car aesthetic.',
    },
    {
        id: 'editorial',
        label: 'Editorial',
        emoji: '👗',
        description: 'High fashion magazine, artistic direction',
        category: 'shoot',
        systemHint: 'This is a high-fashion editorial photoshoot on a professional medium-format or full-frame camera. Artistic, conceptual, intentional. Think Vogue, i-D, W Magazine. Creative direction, dramatic compositions, artistic poses. Fashion ART — not a lifestyle photo.',
    },
];

// ============================================================================
// DIRECTION-SPECIFIC LOCATION POOLS
// Used for combinatorial fallback or to seed the LLM user message
// ============================================================================

export const DIRECTION_LOCATIONS: Record<ShootingDirectionId, string[]> = {
    random: [], // Falls back to full SOCIAL_LOCATIONS pool in API

    street: [
        'rain-slicked Tokyo side street with neon reflections', 'Paris cobblestone alley at dusk',
        'New York City crosswalk mid-traffic', 'London East End brick wall with street art',
        'Seoul Hongdae weekend market in motion', 'Berlin graffiti underpass with dramatic lighting',
        'Mexico City historic centro with colonial arches', 'Barcelona Gothic Quarter narrow lane',
        'Havana crumbling colonial street in midday sun', 'Shanghai French Concession tree-lined avenue',
        'Istanbul Grand Bazaar entrance in golden hour', 'Marrakech medina alley at sunset',
        'Brooklyn Williamsburg waterfront with Manhattan skyline', 'Milan Brera district art quarter street',
        'Lagos Lekki market street with vivid colors', 'Mumbai local train station platform',
    ],

    studio: [
        'pure white seamless paper backdrop with rim light shadows', 'dark rich black backdrop with single spotlight',
        'gradient grey seamless with two-point lighting setup', 'vibrant coral pink paper backdrop with beauty dish',
        'deep navy blue studio with Rembrandt lighting', 'textured concrete studio wall with dramatic sidelight',
        'minimalist white cyc wall with diffused softbox', 'vintage tan textile backdrop with warm tungsten light',
        'high-gloss black floor studio with smoke machine effect', 'neon-lit studio with colored gels — pink and purple',
        'raw exposed brick studio loft with ring light', 'moss green painted studio with classic portrait lighting',
        'studio with projection light patterns on seamless white', 'split-toned studio — warm amber and cool blue',
    ],

    apartment: [
        'sun-drenched bedroom with white linen sheets and morning light', 'cosy living room with rattan furniture and trailing plants',
        'open kitchen with marble island and hanging copper pots', 'minimalist bathroom with terrazzo tiles and warm lighting',
        'window sill with sheer curtains and golden afternoon glow', 'reading nook with floor-to-ceiling bookshelves and low lamp',
        'herringbone parquet floor living room with cream sofa', 'tiny Parisian studio with steep light from skylight',
        'bedroom balcony with city view at magic hour', 'home office desk with mood lighting and potted succulents',
        'clawfoot tub in exposed brick bathroom', 'mid-century modern dining room with pendant lights',
        'walk-in closet with full-length mirror and hang rails', 'loft main area with industrial beams and concrete walls',
    ],

    candid_random: [
        'grabbed during a phone call on the street', 'caught laughing mid-sentence over coffee',
        'looking out of a moving car window', 'running to catch the bus, hair flying',
        'distracted by something in a bookstore', 'checking phone at a café table',
        'mid-bite at a restaurant looking surprised', 'caught dancing alone in the kitchen',
        'stepping off a subway train in a crowd', 'looking in a shop window reflection',
        'walking away from camera without knowing', 'paused at a crosswalk looking left',
        'hugging a friend mid-hug, laughing', 'putting on jacket hurriedly by a door',
        'lying in grass looking up at sky', 'leaning out of a window, eyes wandering',
    ],

    candid_street: [
        'crossing a busy intersection looking at phone', 'standing near a foggy subway grate',
        'laughing while walking down a graffitied alley', 'rushing through pouring rain under a bodega awning',
        'sitting on concrete steps eating street food', 'blurred city lights reflecting on wet pavement behind them',
        'caught off guard leaving a coffee shop', 'waiting for the traffic light to change in a crowd',
    ],

    candid_home: [
        'sprawled on the couch surrounded by snacks', 'sitting on the kitchen counter in pyjamas',
        'lying on an unmade bed scrolling on a phone', 'brushing teeth in the bathroom mirror',
        'eating cereal from a bowl on the floor', 'sitting by the open fridge at midnight',
        'face-timing someone at the dining table', 'pets jumping on the bed while sorting laundry',
    ],

    candid_party: [
        'mid-cheer with a drink in a dark VIP booth', 'harsh flash lighting while dancing in a crowded club',
        'blurred taxi window ride home from the party', 'laughing uncontrollably in a neon-lit dive bar',
        'spilled drink action shot on the dancefloor', 'bathroom mirror touch-up under fluorescent lights',
        'group of friends pushing past the camera in a dark alley', 'red cups and pizza boxes in a chaotic house party',
    ],

    candid_mirror: [
        'outfit check in a messy bedroom full-length mirror', 'fluorescent-lit public bathroom mirror selfie',
        'metallic elevator mirror selfie looking down at the phone', 'gym mirror selfie after a workout with gym equipment visible',
        'tiny round cafe mirror reflection', 'hotel lobby luxury mirror with ambient warm lights',
        'car side-mirror snapshot', 'dressing room mirror selfie surrounded by clothes',
    ],

    candid_cafe: [
        'reaching for a matcha latte across a marble table', 'mid-laugh with an avocado toast half eaten',
        'distracted looking out of a rainy café window', 'paying at the counter of a busy bakery',
        'sitting at a tiny Parisian sidewalk table', 'holding a pastry up to the camera playfully',
        'blurred background of a busy coffee shop interior', 'spilled coffee on an aesthetic table setting',
    ],

    candid_vacation: [
        'blurry splash walking out of the ocean', 'lying on a beach towel covered in sand',
        'holding a melting ice cream cone on a boardwalk', 'sunburn flush at a casual beach bar',
        'laughing while applying sunscreen', 'messy wet hair on a boat deck',
        'harsh noon shadow over a pool lounge chair', '0.5x wide selfie with a palm tree background',
    ],

    candid_fitness: [
        'red-faced and sweaty after a run on the track', 'sitting on the gym floor catching breath',
        'blurry mid-action shot in a pilates class', 'water bottle break near the weight rack',
        'gym locker room selfie in fluorescent light', 'stretching with earphones in at the park',
        'laughing in exhaustion after a group class', 'tying running shoes on a trail',
    ],

    candid_car: [
        'passing a drive-thru bag from the passenger seat', 'singing loudly with the window rolled down',
        'feet on the dashboard during a road trip', 'checking lipstick in the sun visor mirror',
        'harsh flash inside the car at midnight', '0.5x wide angle shot of the whole car interior',
        'spilled fries on the center console', 'leaning head against the window looking tired',
    ],

    event: [
        'rooftop bar party at midnight with city lights spread below', 'luxury nightclub with red booth seating and bottle service',
        'gallery opening with white walls and art crowd', 'terrace restaurant with string lights and warm evening glow',
        'cocktail party in a loft with floor-to-ceiling windows', 'outdoor concert field with stage lights in background',
        'penthouse New Year party with fireworks visible through glass', 'underground club with laser lights piercing smoke',
        'beach bonfire party at night with sparks rising', 'jazz bar with velvet curtains and candlelit ambiance',
        'fashion week afterparty in a converted warehouse', 'rooftop at blue hour, champagne in hand',
        'vivid festival crowd with confetti mid-air', 'exclusive private villa pool party at dusk',
    ],

    beach: [
        'white sand beach with turquoise Caribbean water at noon', 'Mediterranean cove with crystal clear water at sunset',
        'luxury Maldives overwater villa infinity deck', 'Santorini cliffside terrace overlooking the caldera',
        'Bali infinity pool surrounded by rice terrace jungle', 'glamorous Monaco beach club with white loungers',
        'Hawaii volcanic black sand beach in warm glow', 'Tulum beachfront with palm shade and clear green sea',
        'French Riviera yacht deck floating in sheltered bay', 'Greek island white-washed village with sea view',
        'Miami Beach at golden hour on the boardwalk', 'secluded lagoon accessible only by boat in Thailand',
        'outdoor poolside at a desert resort in Marrakech', 'beachclub with DJ booth and crowd in background',
        'tropical waterfall pool in Costa Rica jungle',
    ],

    fitness: [
        'modern CrossFit box gym with rigs and barbells', 'Pilates reformer studio with high ceilings and mirror wall',
        'outdoor rooftop yoga deck at sunrise', 'upscale gym with floor-to-ceiling windows and city view',
        'athletics track at golden hour mid-sprint', 'boxing gym with punching bags and raw energy',
        'outdoor park gym area with pull-up bars and concrete', 'spin class studio with dramatic dark lighting',
        'swimming pool lane at dawn, just after laps', 'tennis court on a clay surface in warm light',
        'trail running through forest at morning', 'dance studio with mirrored walls and barre',
        'climbing wall with colorful holds and chalk-dusted hands', 'outdoor calisthenics park at sunset',
    ],

    car: [
        'sitting in the passenger seat of a blacked-out G-Wagon at midnight', 'leaning on a vintage Ferrari on a coastal road',
        'underground parking lot with dramatic fluorescent strip lighting', 'back seat of a London black cab through rain-streaked window',
        'sunlit highway drive with one arm out the window', 'gas station at night with neon sign glow',
        'roof of a pickup truck at desert sunset', 'inside a classic Porsche 911, top down on mountain road',
        'city park parking lot at dusk, golden reflections on hood', 'multi-storey parking structure with geometric light beams',
        'inside a luxury SUV, rain hitting the windows', 'red muscle car in an industrial back street',
        'self-service car wash with rainbow soap suds', 'midnight race circuit with tire tracks on tarmac',
    ],

    editorial: [
        'abandoned factory with crumbling walls and dramatic skylight', 'white marble palace staircase with colonnade',
        'museum gallery between two imposing sculptures', 'Brutalist architecture concrete plaza in blue city light',
        'greenhouse full of overgrown tropical plants', 'mirrored gallery room creating infinite reflections',
        'opera house gilded balcony with red velvet', 'rooftop of a luxury hotel above the clouds',
        'vast empty desert with lone subject in center frame', 'mountain top just above treeline at golden hour',
        'modernist architecture interior with geometric shadows', 'ancient ruin with moss and dramatic light shafts',
        'full white-out salt flat with no horizon', 'dramatic red rock canyon walls with wind-blown fabric',
    ],
};

// ============================================================================
// DIRECTION-SPECIFIC STYLE SEEDS
// ============================================================================

export const DIRECTION_STYLE_SEEDS: Record<ShootingDirectionId, string[]> = {
    random: [],
    street: [
        'Documentary Street, gritty realism', 'Urban editorial, motion blur energy',
        'Reportage style with natural raw light', 'City fashion, street confidence',
        'Tokyo street snap, candid and direct', 'Cinéma vérité meets fashion',
    ],
    studio: [
        'Vogue Italia high drama', 'Calvin Klein minimalist studio purity',
        'Helmut Newton sharp studio power', 'Versace high-gloss studio glamour',
        'Peter Lindbergh intimate black and white', 'Annie Leibovitz studio portraiture',
    ],
    apartment: [
        'Lifestyle editorial, warm and intimate', 'Morning routine vlog aesthetic',
        'Interior Scandi cosy neutral palette', 'Instagram bedroom aesthetic, lived-in luxury',
        'Home-mode authenticity, natural moments', 'Magazine home feature, styled real life',
    ],
    candid_random: [
        'Street snap documentary', 'Amateur spontaneous energy',
        'iPhone candid warmth', 'Unposed reportage style',
        'Decisive moment street photo', 'Real life magazine paparazzi style',
    ],
    candid_street: [
        'Urban iPhone paparazzi', 'Disposable camera city energy',
        'Gritty iPhone street candid', 'High-contrast blur motion street snap',
    ],
    candid_home: [
        'Cozy authentic dump post', 'Messy uncurated everyday life',
        'Raw photo dump aesthetic', 'Intimate real-life vlog feel',
    ],
    candid_party: [
        'Y2K flash party aesthetic', 'Disposable camera flash at night',
        'Blinding direct flash underexposed background', 'Chaotic Gen Z club snapshot',
    ],
    candid_mirror: [
        'OOTD mirror snap', '0.5x ultra wide mirror selfie',
        'Flash on mirror reflection', 'Casual fit check aesthetic',
    ],
    candid_cafe: [
        'Aesthetic food dump', 'Casual brunch lifestyle',
        'Coffee run candid', 'Cozy midday café snap',
    ],
    candid_vacation: [
        'Messy beach dump', 'Summer disposable camera',
        'Raw holiday vlog aesthetic', 'Tropical candid snap',
    ],
    candid_fitness: [
        'Gritty gym rat snap', 'Authentic post-workout sweat',
        'Raw running photo diary', 'Unfiltered fitness vlog',
    ],
    candid_car: [
        'Passenger princess dump', 'Late night drive flash snap',
        '0.5x car selfie aesthetic', 'Roadtrip memory snap',
    ],
    event: [
        'Nightlife editorial, party magazine', 'Social documentary at luxury events',
        'Club photography with ambient light', 'Social media story aesthetic, vivid and warm',
        'Paparazzi at the after-party', 'Editorial event coverage, raw energy',
    ],
    beach: [
        'Sports Illustrated Swimsuit editorial', 'Luxury travel lifestyle blog',
        'Instagram vacation aesthetic, aspirational', 'French Riviera glamour',
        'Tropical resort campaign photography', 'Golden hour beach editorial',
    ],
    fitness: [
        'Nike campaign energy', 'Fitness lifestyle editorial, authentic effort',
        'Athleisure fashion shoot for activewear brand', 'Nike Run energy, movement and sweat',
        'Wellness editorial calm focus', 'Sports documentary, real athlete captured',
    ],
    car: [
        'Automotive lifestyle editorial', 'Underground car culture, cinematic',
        'Luxury brand campaign with vehicle hero', 'Urban raw car culture aesthetic',
        'Midnight drive cinematic mood', 'Road-trip lifestyle editorial, freedom',
    ],
    editorial: [
        'Vogue Paris avant-garde spread', 'i-D magazine raw conceptual',
        'W Magazine high concept art direction', 'Dazed & Confused underground fashion',
        'Alexander McQueen dark romance editorial', 'Helmut Newton power and drama',
    ],
};
