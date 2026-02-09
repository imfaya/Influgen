// Zustand store for global state management

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Generation, GenerationParameters, Influencer, ReferenceImage, AspectRatio, ContentMode, PendingGeneration, Post } from '@/types';
import { INFLUENCERS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/lib/constants';
import { supabaseAuth as supabase, supabaseAuth } from '@/lib/supabase-auth';

export interface TrashItem {
    id: string;
    originalGenerationId: string;
    imageUrl?: string; // If single image
    imageIndex?: number;
    type: 'single_image' | 'full_generation';
    generationData?: Generation; // If full generation
    deletedAt: string;
}

interface GenerationStore {
    // Content Mode
    contentMode: ContentMode;
    setContentMode: (mode: ContentMode) => void;

    // Current selection
    selectedInfluencer: Influencer;
    setSelectedInfluencer: (influencer: Influencer) => void;

    // Generation parameters
    parameters: GenerationParameters;
    setNumOutputs: (num: 1 | 2 | 4 | 8) => void;
    setAspectRatio: (ratio: AspectRatio) => void;
    setModel: (model: string) => void;
    setResolution: (resolution: string) => void;
    setIsMaxResolution: (isMax: boolean) => void;

    // Prompt
    prompt: string;
    setPrompt: (prompt: string) => void;

    // Generation state
    isGenerating: boolean;
    error: string | null;
    currentImages: string[];
    // Track images per mode to restore them when switching back
    imagesByMode: Record<ContentMode, string[]>;
    setGenerating: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setCurrentImages: (images: string[]) => void;

    // Pending generations (for stacked loading UI)
    pendingGenerations: PendingGeneration[];
    addPendingGeneration: (influencerId: string, prompt: string, contentMode: ContentMode, sourceGenerationId?: string, sourceImageUrl?: string, batchId?: string, tags?: string[]) => string;
    removePendingGeneration: (id: string) => void;

    // Series tracking
    seriesId: string | null;
    seriesContext: { location?: string; outfit?: string; lighting?: string } | null;
    startNewSeries: (context: { location?: string; outfit?: string; lighting?: string }) => void;
    continueSeries: () => string | null;
    clearSeries: () => void;

    // History (local cache before Supabase sync)
    generations: Generation[];
    currentGenerationId: string | null; // Track current generation for series continuation
    addGeneration: (gen: Omit<Generation, 'id' | 'created_at'>) => Generation;
    appendToGeneration: (id: string, newImages: string[]) => void;
    removeGeneration: (id: string) => void;
    removeFromGeneration: (id: string, imageUrl: string) => void;
    setGenerations: (gens: Generation[]) => void;
    setCurrentGenerationId: (id: string | null) => void;
    updateGeneration: (id: string, updates: Partial<Generation>) => void;


    // Reference images (current influencer's images)
    referenceImages: ReferenceImage[];
    // All reference images stored by influencer ID
    referenceImagesByInfluencer: Record<string, ReferenceImage[]>;
    addReferenceImage: (image: Omit<ReferenceImage, 'id' | 'uploaded_at'>) => void;
    removeReferenceImage: (id: string) => void;
    setReferenceImages: (images: ReferenceImage[]) => void;

    // Rate limiting
    generationTimestamps: number[];
    canGenerate: () => boolean;
    recordGeneration: () => void;

    // UI State
    isHistoryPanelOpen: boolean;
    toggleHistoryPanel: () => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;

    // Global Modal State
    modalImage: string | null;
    setModalImage: (image: string | null) => void;

    // Custom LLM Prompts per Influencer (stored by influencer ID)
    influencerPrompts: Record<string, string>;
    setInfluencerPrompt: (influencerId: string, prompt: string) => void;
    getInfluencerPrompt: (influencerId: string) => string;

    // Custom Base Prompts per Influencer (physical description)
    customBasePrompts: Record<string, string>;
    setCustomBasePrompt: (influencerId: string, prompt: string) => void;
    getCustomBasePrompt: (influencerId: string) => string;


    // Supabase Sync
    loadUserData: (userId: string) => Promise<boolean>;
    syncInfluencerSettings: (influencerId: string) => Promise<void>;
    saveInfluencerSettings: (influencerId: string, basePrompt: string, systemPrompt: string) => Promise<void>;

    // Influencer Status
    influencerStatus: Record<string, boolean>;
    toggleInfluencerStatus: (id: string) => void;

    // Posts (Quick Post feature)
    posts: Post[];
    addPost: (post: Omit<Post, 'id' | 'created_at'>) => Post;
    updatePost: (id: string, updates: Partial<Post>) => void;
    removePost: (id: string) => void;
    getReadyPosts: () => Post[];

    // Dynamic Influencer List
    influencers: Influencer[];
    removeInfluencer: (id: string) => void;
    syncInfluencers: () => void;

    // Trash System
    trash: TrashItem[];
    moveToTrash: (generationId: string, imageUrl?: string, index?: number) => string;
    restoreFromTrash: (trashId: string) => void;
    permanentDelete: (trashId: string) => void;
    emptyTrash: () => void;
}

export const useGenerationStore = create<GenerationStore>()(
    persist(
        (set, get) => ({
            // Content Mode
            contentMode: 'social' as const,
            setContentMode: (mode) => {
                // When switching mode, restore the images for that mode
                const savedImages = get().imagesByMode[mode] || [];
                set({
                    contentMode: mode,
                    prompt: '',
                    currentImages: savedImages
                });
            },

            // Default influencer
            selectedInfluencer: INFLUENCERS[0],
            setSelectedInfluencer: (influencer) => {
                const state = get();
                // Save current influencer's images before switching
                const currentInfluencerId = state.selectedInfluencer.id;
                const updatedImagesByInfluencer = {
                    ...state.referenceImagesByInfluencer,
                    [currentInfluencerId]: state.referenceImages
                };

                // Load new influencer's images (from saved or defaults)
                let newRefImages = updatedImagesByInfluencer[influencer.id];
                if (!newRefImages || newRefImages.length === 0) {
                    // Initialize with defaults if no saved images
                    const defaults = influencer.defaultReferenceImages || [];
                    newRefImages = defaults.map(url => ({
                        id: uuidv4(),
                        influencer_name: influencer.name,
                        image_url: url,
                        image_type: 'edit' as const,
                        uploaded_at: new Date().toISOString()
                    }));
                }

                set({
                    selectedInfluencer: influencer,
                    referenceImages: newRefImages,
                    referenceImagesByInfluencer: updatedImagesByInfluencer
                });
            },

            // Dynamic Influencer List
            influencers: INFLUENCERS,
            removeInfluencer: (id) => set((state) => ({
                influencers: state.influencers.filter(i => i.id !== id),
                // If the selected influencer is deleted, fallback to the first available one
                selectedInfluencer: state.selectedInfluencer.id === id
                    ? (state.influencers.find(i => i.id !== id) || INFLUENCERS[0])
                    : state.selectedInfluencer
            })),

            syncInfluencers: () => set({ influencers: INFLUENCERS }),

            // Default parameters
            parameters: {
                numOutputs: 1,
                aspectRatio: '3:4',
                resolution: '3072x4096',
                model: 'bytedance/seedream-v4.5/edit',
                isMaxResolution: true,
            },

            setNumOutputs: (num) => set((state) => ({
                parameters: { ...state.parameters, numOutputs: num }
            })),

            setModel: (model) => set((state) => ({
                parameters: { ...state.parameters, model: model }
            })),

            setResolution: (resolution) => set((state) => ({
                parameters: { ...state.parameters, resolution }
            })),

            setIsMaxResolution: (isMax) => {
                const state = get();
                const ratio = state.parameters.aspectRatio;
                // If turning MAX on, reset to max resolution for current aspect ratio
                if (isMax) {
                    const resolutions: Record<AspectRatio, string> = {
                        '3:4': '3072x4096',
                        '1:1': '4096x4096',
                        '4:3': '4096x3072',
                        '9:16': '2304x4096',
                        '16:9': '4096x2304',
                    };
                    set((state) => ({
                        parameters: {
                            ...state.parameters,
                            isMaxResolution: true,
                            resolution: resolutions[ratio]
                        }
                    }));
                } else {
                    const defaultResolutions: Record<AspectRatio, string> = {
                        '3:4': '960x1280',
                        '1:1': '1280x1280',
                        '4:3': '1280x960',
                        '9:16': '1024x1820',
                        '16:9': '1280x720',
                    };
                    set((state) => ({
                        parameters: {
                            ...state.parameters,
                            isMaxResolution: false,
                            resolution: defaultResolutions[ratio]
                        }
                    }));
                }
            },

            setAspectRatio: (ratio) => {
                const maxResolutions: Record<AspectRatio, string> = {
                    '3:4': '3072x4096',
                    '1:1': '4096x4096',
                    '4:3': '4096x3072',
                    '9:16': '2304x4096',
                    '16:9': '4096x2304',
                };

                const defaultResolutions: Record<AspectRatio, string> = {
                    '3:4': '960x1280',
                    '1:1': '1280x1280',
                    '4:3': '1280x960',
                    '9:16': '1024x1820',
                    '16:9': '1280x720',
                };

                set((state) => ({
                    parameters: {
                        ...state.parameters,
                        aspectRatio: ratio,
                        resolution: state.parameters.isMaxResolution
                            ? maxResolutions[ratio]
                            : defaultResolutions[ratio]
                    }
                }));
            },

            // Prompt state
            prompt: '',
            setPrompt: (prompt) => set({ prompt }),

            // Generation state
            isGenerating: false,
            error: null,
            currentImages: [],
            imagesByMode: {
                social: [],
                sensual: [],
                porn: [],
            },
            setGenerating: (isGenerating) => set({ isGenerating }),
            setError: (error) => set({ error }),
            setCurrentImages: (currentImages) => set((state) => ({
                currentImages,
                // Save these images to the current mode
                imagesByMode: {
                    ...state.imagesByMode,
                    [state.contentMode]: currentImages
                }
            })),

            // Pending generations for parallel loading UI
            pendingGenerations: [],
            addPendingGeneration: (influencerId, prompt, contentMode, sourceGenerationId?, sourceImageUrl?, batchId?, tags?) => {
                const id = uuidv4();
                set((state) => ({
                    pendingGenerations: [...state.pendingGenerations, {
                        id,
                        influencer_id: influencerId,
                        prompt,
                        contentMode,
                        startedAt: new Date().toISOString(),
                        sourceGenerationId,
                        sourceImageUrl,
                        batchId,
                        tags
                    }]
                }));
                return id;
            },
            removePendingGeneration: (id) => set((state) => ({
                pendingGenerations: state.pendingGenerations.filter(p => p.id !== id)
            })),

            // Series tracking
            seriesId: null,
            seriesContext: null,
            startNewSeries: (context) => set({
                seriesId: uuidv4(),
                seriesContext: context
            }),
            continueSeries: () => get().seriesId,
            clearSeries: () => set({ seriesId: null, seriesContext: null }),

            // History
            generations: [],
            currentGenerationId: null,
            addGeneration: (gen) => {
                const newGen: Generation = {
                    ...gen,
                    id: uuidv4(),
                    created_at: new Date().toISOString(),
                };
                set((state) => ({
                    generations: [newGen, ...state.generations],
                    currentGenerationId: newGen.id, // Track this as the current generation
                }));
                return newGen;
            },
            appendToGeneration: (id, newImages) => set((state) => {
                const generation = state.generations.find(g => g.id === id);
                if (!generation) return {};

                const updatedGen = {
                    ...generation,
                    image_urls: [...generation.image_urls, ...newImages],
                    is_series: true,
                    created_at: new Date().toISOString() // Update timestamp to now
                };

                return {
                    generations: [
                        updatedGen,
                        ...state.generations.filter(g => g.id !== id)
                    ],
                    currentGenerationId: id // Make it current
                };
            }),
            removeGeneration: (id) => set((state) => ({
                generations: state.generations.filter(g => g.id !== id),
                currentGenerationId: state.currentGenerationId === id ? null : state.currentGenerationId,
            })),
            removeFromGeneration: (id, imageUrl) => set((state) => ({
                generations: state.generations.map(g =>
                    g.id === id
                        ? { ...g, image_urls: g.image_urls.filter(url => url !== imageUrl) }
                        : g
                )
            })),
            setGenerations: (generations) => set({ generations }),
            setCurrentGenerationId: (id) => set({ currentGenerationId: id }),
            updateGeneration: (id, updates) => set((state) => ({
                generations: state.generations.map(g =>
                    g.id === id ? { ...g, ...updates } : g
                )
            })),


            // Reference images (current influencer)
            referenceImages: [],
            // All reference images stored by influencer ID
            referenceImagesByInfluencer: {},
            addReferenceImage: (image) => {
                const newImage: ReferenceImage = {
                    ...image,
                    id: uuidv4(),
                    uploaded_at: new Date().toISOString(),
                };
                const state = get();
                const influencerId = state.selectedInfluencer.id;
                set((state) => ({
                    referenceImages: [...state.referenceImages, newImage],
                    // Also update the stored images for this influencer
                    referenceImagesByInfluencer: {
                        ...state.referenceImagesByInfluencer,
                        [influencerId]: [...state.referenceImages, newImage]
                    }
                }));
            },
            removeReferenceImage: (id) => {
                const state = get();
                const influencerId = state.selectedInfluencer.id;
                const newImages = state.referenceImages.filter(img => img.id !== id);
                set({
                    referenceImages: newImages,
                    referenceImagesByInfluencer: {
                        ...state.referenceImagesByInfluencer,
                        [influencerId]: newImages
                    }
                });
            },
            setReferenceImages: (images) => {
                const state = get();
                const influencerId = state.selectedInfluencer.id;
                set({
                    referenceImages: images,
                    referenceImagesByInfluencer: {
                        ...state.referenceImagesByInfluencer,
                        [influencerId]: images
                    }
                });
            },

            // Rate limiting
            generationTimestamps: [],
            canGenerate: () => {
                const now = Date.now();
                const recentTimestamps = get().generationTimestamps.filter(
                    ts => now - ts < RATE_LIMIT_WINDOW_MS
                );
                return recentTimestamps.length < RATE_LIMIT_MAX;
            },
            recordGeneration: () => {
                const now = Date.now();
                set((state) => ({
                    generationTimestamps: [
                        ...state.generationTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS),
                        now
                    ]
                }));
            },

            // UI State
            isHistoryPanelOpen: true,
            toggleHistoryPanel: () => set((state) => ({
                isHistoryPanelOpen: !state.isHistoryPanelOpen
            })),

            isSidebarOpen: true,
            toggleSidebar: () => set((state) => ({
                isSidebarOpen: !state.isSidebarOpen
            })),

            // Global Modal State
            modalImage: null,
            setModalImage: (image) => set({ modalImage: image }),

            // Custom LLM Prompts per Influencer
            influencerPrompts: {},
            setInfluencerPrompt: (influencerId, prompt) => set((state) => ({
                influencerPrompts: { ...state.influencerPrompts, [influencerId]: prompt }
            })),
            getInfluencerPrompt: (influencerId) => {
                return get().influencerPrompts[influencerId] || '';
            },

            // Custom Base Prompts per Influencer
            customBasePrompts: {},
            setCustomBasePrompt: (influencerId, prompt) => set((state) => ({
                customBasePrompts: { ...state.customBasePrompts, [influencerId]: prompt }
            })),
            getCustomBasePrompt: (influencerId) => {
                const custom = get().customBasePrompts[influencerId];
                if (custom) return custom;
                // Fallback to default from constant
                const influencer = INFLUENCERS.find(i => i.id === influencerId);
                return influencer ? influencer.basePrompt : '';
            },

            // Supabase Sync
            syncInfluencerSettings: async (influencerId) => {
                try {
                    const { data, error } = await supabase.from('influencer_settings')
                        .select('*')
                        .eq('influencer_id', influencerId)
                        .single();

                    if (data && !error) {
                        set((state) => ({
                            influencerPrompts: {
                                ...state.influencerPrompts,
                                [influencerId]: data.system_prompt || ''
                            },
                            customBasePrompts: {
                                ...state.customBasePrompts,
                                [influencerId]: data.base_prompt || ''
                            }
                        }));
                    }
                } catch (err) {
                    console.error('Failed to sync settings:', err);
                }
            },
            saveInfluencerSettings: async (influencerId, basePrompt, systemPrompt) => {
                // Update local state first (optimistic)
                set((state) => ({
                    influencerPrompts: { ...state.influencerPrompts, [influencerId]: systemPrompt },
                    customBasePrompts: { ...state.customBasePrompts, [influencerId]: basePrompt }
                }));

                // Persist to Supabase
                try {
                    await supabase.from('influencer_settings').upsert({
                        influencer_id: influencerId,
                        base_prompt: basePrompt,
                        system_prompt: systemPrompt,
                        updated_at: new Date().toISOString()
                    });
                } catch (err) {
                    console.error('Failed to save settings:', err);
                }
            },

            loadUserData: async (userId) => {
                console.log('[loadUserData] Starting sync for user:', userId);
                try {
                    // PRE-FLIGHT CHECK: Verify we have a valid session before syncing
                    // This prevents wiping local data if the session token has expired
                    const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession();

                    if (sessionError || !session) {
                        console.warn('[loadUserData] Sync aborted - No valid session found. Preserving local data.');
                        return false;
                    }

                    // PARALLEL FETCH: Fetch influencers and profile concurrently
                    const [influencersResult, profileResult] = await Promise.all([
                        supabase.from('influencers').select('*').eq('user_id', userId),
                        supabase.from('profiles').select('username').eq('id', userId).single()
                    ]);

                    if (influencersResult.error) throw influencersResult.error;

                    let finalInfluencers = influencersResult.data || [];

                    // SEEDING LOGIC: If user is "imfaya" and has 0 influencers, seed Lyra Chenet
                    if (finalInfluencers.length === 0 && profileResult.data?.username === 'imfaya') {
                        console.log('[loadUserData] Admin "imfaya" detected with no influencers. Seeding Lyra Chenet...');
                        const defaultLyra = INFLUENCERS.find(i => i.name === 'Lyra Chenet');
                        if (defaultLyra) {
                            const { data: newInfluencer, error: seedError } = await supabase.from('influencers').insert({
                                user_id: userId,
                                name: defaultLyra.name,
                                slug: 'lyra-chenet',
                                description: defaultLyra.description,
                                base_prompt: defaultLyra.basePrompt,
                                thumbnail_url: defaultLyra.thumbnail,
                                avatar_url: defaultLyra.avatar,
                                default_reference_images: defaultLyra.defaultReferenceImages
                            }).select().single();

                            if (!seedError && newInfluencer) {
                                console.log('[loadUserData] Seeding successful:', newInfluencer);
                                finalInfluencers = [newInfluencer];
                            } else {
                                console.error('[loadUserData] Seeding failed:', seedError);
                            }
                        }
                    } else if (finalInfluencers.length === 0) {
                        console.log(`[loadUserData] User ${profileResult.data?.username} found 0 influencers. Clearing local list.`);
                    } else {
                        console.log(`[loadUserData] Found ${finalInfluencers.length} influencers on server. Proceeding with sync.`);
                    }

                    // Build map for ID -> Name resolution
                    const influencerMap = new Map<string, string>();
                    const influencerObjMap: Record<string, Influencer> = {};

                    const localInfluencers: Influencer[] = finalInfluencers.map((inf: any) => {
                        influencerMap.set(inf.id, inf.name);

                        // Fallback: If DB has no reference images, try to recover them from constants (e.g. for Lyra)
                        let defaultReferenceImages = inf.default_reference_images || [];
                        if (defaultReferenceImages.length === 0) {
                            const constantInfluencer = INFLUENCERS.find(i => i.name === inf.name);
                            if (constantInfluencer && constantInfluencer.defaultReferenceImages && constantInfluencer.defaultReferenceImages.length > 0) {
                                console.log(`[loadUserData] Recovering default reference images for ${inf.name} from constants`);
                                defaultReferenceImages = constantInfluencer.defaultReferenceImages;

                                // Omitted: We could auto-update the DB here, but for now we just fix the session state
                                // to ensure the feature works immediately.
                            }
                        }

                        const mapped: Influencer = {
                            id: inf.id,
                            name: inf.name,
                            slug: inf.slug || inf.id, // Fallback to ID if slug is missing
                            description: inf.description || '',
                            basePrompt: inf.base_prompt || '',
                            defaultReferenceImages: defaultReferenceImages,
                            thumbnail: inf.thumbnail_url || '',
                            avatar: inf.avatar_url || '',
                            llmSystemPrompt: inf.llm_system_prompt || undefined,
                            instagram_account_id: inf.instagram_account_id || undefined
                        };
                        influencerObjMap[inf.id] = mapped;
                        return mapped;
                    });

                    // PARALLEL FETCH: Reference images, Generations (with pagination), and Trash
                    const influencerIds = Array.from(influencerMap.keys());

                    const [refImagesResult, generationsResult, trashResult] = await Promise.all([
                        influencerIds.length > 0
                            ? supabase.from('reference_images').select('*').in('influencer_id', influencerIds)
                            : Promise.resolve({ data: [], error: null }),
                        influencerIds.length > 0
                            ? supabase.from('generations').select('*').in('influencer_id', influencerIds)
                                .order('created_at', { ascending: false })
                                .limit(100) // PAGINATION: Load last 100 generations initially
                            : Promise.resolve({ data: [], error: null }),
                        // Fetch trash items for this user
                        supabase.from('trash').select('*').eq('user_id', userId).order('deleted_at', { ascending: false })
                    ]);

                    if (refImagesResult.error) throw refImagesResult.error;
                    if (generationsResult.error) throw generationsResult.error;
                    if (trashResult.error) {
                        console.warn('[loadUserData] Failed to load trash:', trashResult.error);
                    }

                    const referenceImagesByInfluencer: Record<string, ReferenceImage[]> = {};

                    (refImagesResult.data || []).forEach((img: any) => {
                        const infId = img.influencer_id;
                        if (!referenceImagesByInfluencer[infId]) {
                            referenceImagesByInfluencer[infId] = [];
                        }

                        referenceImagesByInfluencer[infId].push({
                            id: img.id,
                            influencer_name: influencerMap.get(infId) || 'Unknown',
                            image_url: img.image_url,
                            image_type: img.image_type as any,
                            uploaded_at: img.uploaded_at
                        });
                    });

                    // POPULATE MISSING DEFAULT REFERENCE IMAGES
                    // For custom influencers without explicit default_reference_images in DB,
                    // we auto-populate from their uploaded reference images.
                    localInfluencers.forEach(inf => {
                        if (!inf.defaultReferenceImages || inf.defaultReferenceImages.length === 0) {
                            const uploadedImages = referenceImagesByInfluencer[inf.id] || [];
                            if (uploadedImages.length > 0) {
                                // Prioritize 'face' type, then others
                                const sortedImages = [...uploadedImages].sort((a, b) => {
                                    if (a.image_type === 'face' && b.image_type !== 'face') return -1;
                                    if (a.image_type !== 'face' && b.image_type === 'face') return 1;
                                    return 0;
                                });

                                // Take up to 4 images
                                const fallbackImages = sortedImages.slice(0, 4).map(img => img.image_url);
                                console.log(`[loadUserData] Auto-populating reference images for ${inf.name}:`, fallbackImages.length);
                                inf.defaultReferenceImages = fallbackImages;
                            }
                        }
                    });

                    const localGenerations: Generation[] = (generationsResult.data || []).map((gen: any) => ({
                        id: gen.id,
                        influencer_id: gen.influencer_id,
                        influencer_name: influencerMap.get(gen.influencer_id) || 'Unknown',
                        prompt: gen.prompt,
                        parameters: gen.parameters,
                        image_urls: gen.image_urls,
                        is_series: gen.is_series,
                        series_id: gen.series_id,
                        content_mode: gen.content_mode || 'social',
                        tags: gen.tags || [],
                        caption: gen.caption,
                        hashtags: gen.hashtags || [],
                        created_at: gen.created_at,
                    }));

                    // Map trash items from Supabase to local TrashItem format
                    const localTrash: TrashItem[] = (trashResult.data || []).map((item: any) => ({
                        id: item.id,
                        originalGenerationId: item.original_generation_id,
                        imageUrl: item.image_url || undefined,
                        imageIndex: item.image_index ?? undefined,
                        type: item.item_type as 'single_image' | 'full_generation',
                        generationData: item.generation_data as Generation | undefined,
                        deletedAt: item.deleted_at
                    }));

                    // 4. Update Store
                    set((state) => ({
                        influencers: localInfluencers,
                        generations: localGenerations,
                        trash: localTrash, // Load trash from Supabase
                        referenceImagesByInfluencer: referenceImagesByInfluencer,
                        currentGenerationId: localGenerations.length > 0 ? localGenerations[0].id : null,

                        // Update custom prompts from influencers data
                        customBasePrompts: {
                            ...state.customBasePrompts,
                            ...Object.fromEntries((localInfluencers || []).map((i: any) => [i.id, i.basePrompt || '']))
                        },
                        influencerPrompts: {
                            ...state.influencerPrompts,
                            ...Object.fromEntries((localInfluencers || []).map((i: any) => [i.id, i.llmSystemPrompt || '']))
                        },

                        // Update current reference images if an influencer is selected
                        referenceImages: state.selectedInfluencer ?
                            (referenceImagesByInfluencer[state.selectedInfluencer.id] ||
                                state.referenceImages) : state.referenceImages,
                    }));

                    // RECONCILIATION: Check if selectedInfluencer needs an update (ID or Slug)
                    const currentSelected = get().selectedInfluencer;

                    // Match by slug or name if ID is the initial constant one or just to be safe
                    const matchingInfluencer = localInfluencers.find(inf =>
                        inf.slug === currentSelected.slug || inf.name === currentSelected.name
                    );

                    if (matchingInfluencer) {
                        // Even if ID matches, updating to the server data ensures all fields (avatar, etc) are fresh
                        console.log(`[loadUserData] Syncing selected influencer: ${matchingInfluencer.name} (${matchingInfluencer.id})`);
                        set({ selectedInfluencer: matchingInfluencer });
                    } else if (localInfluencers.length > 0) {
                        console.warn('[loadUserData] Selected influencer not found in synced list. Resetting to first available.');
                        set({ selectedInfluencer: localInfluencers[0] });
                    }

                    console.log(`[loadUserData] Sync complete. Loaded ${localGenerations.length} generations and ${Object.values(referenceImagesByInfluencer).flat().length} reference images.`);
                    return true;
                } catch (err) {
                    console.error('[loadUserData] Failed to sync:', err);
                    return false;
                }
            },

            // Influencer Status
            influencerStatus: {},
            toggleInfluencerStatus: (id) => set((state) => ({
                influencerStatus: {
                    ...state.influencerStatus,
                    [id]: !state.influencerStatus[id]
                }
            })),

            // Posts (Quick Post feature)
            posts: [],
            addPost: (post) => {
                const newPost: Post = {
                    ...post,
                    id: uuidv4(),
                    created_at: new Date().toISOString(),
                };
                set((state) => ({
                    posts: [newPost, ...state.posts],
                }));
                return newPost;
            },
            updatePost: (id, updates) => set((state) => ({
                posts: state.posts.map(p =>
                    p.id === id ? { ...p, ...updates } : p
                )
            })),
            removePost: (id) => set((state) => ({
                posts: state.posts.filter(p => p.id !== id)
            })),
            getPostsByInfluencer: (influencerId: string) => {
                return get().posts.filter(p => p.influencer_id === influencerId);
            },
            getReadyPosts: () => {
                return get().posts.filter(p => p.status === 'ready' || p.status === 'draft');
            },

            // Trash System
            trash: [],
            moveToTrash: (generationId, imageUrl, index) => {
                const state = get();
                const trashId = uuidv4();

                // Helper to sync trash item to Supabase
                const syncTrashToDb = async (trashItem: TrashItem, deleteGeneration: boolean) => {
                    try {
                        // Get current user ID
                        const { data: { session } } = await supabaseAuth.auth.getSession();
                        const userId = session?.user?.id;
                        if (!userId) {
                            console.warn('[moveToTrash] No user session, skipping DB sync');
                            return;
                        }

                        // Insert into trash table
                        await supabase.from('trash').insert({
                            id: trashItem.id,
                            user_id: userId,
                            original_generation_id: trashItem.originalGenerationId,
                            image_url: trashItem.imageUrl || null,
                            image_index: trashItem.imageIndex ?? null,
                            item_type: trashItem.type,
                            generation_data: trashItem.generationData,
                            deleted_at: trashItem.deletedAt
                        });

                        // Delete from generations table if full delete
                        if (deleteGeneration) {
                            await supabase.from('generations').delete().eq('id', generationId);
                        }

                        console.log('[moveToTrash] Synced to Supabase:', trashItem.id);
                    } catch (err) {
                        console.error('[moveToTrash] Failed to sync to Supabase:', err);
                    }
                };

                // Case 1: Deleting a single image from a series
                if (imageUrl && index !== undefined) {
                    const generation = state.generations.find(g => g.id === generationId);
                    if (!generation) return ""; // Should not happen

                    // Check if it's the LAST image being deleted -> treat as full delete
                    if (generation.image_urls.length <= 1) {
                        // Full delete
                        const trashItem: TrashItem = {
                            id: trashId,
                            originalGenerationId: generationId,
                            type: 'full_generation',
                            generationData: generation,
                            deletedAt: new Date().toISOString()
                        };
                        set({
                            trash: [trashItem, ...state.trash],
                            generations: state.generations.filter(g => g.id !== generationId)
                        });
                        // Sync to DB: insert to trash + delete from generations
                        syncTrashToDb(trashItem, true);
                    } else {
                        // Partial delete
                        const trashItem: TrashItem = {
                            id: trashId,
                            originalGenerationId: generationId,
                            imageUrl,
                            imageIndex: index,
                            type: 'single_image',
                            generationData: generation,
                            deletedAt: new Date().toISOString()
                        };

                        // Update generation to remove image
                        const newImages = generation.image_urls.filter(url => url !== imageUrl);
                        set({
                            trash: [trashItem, ...state.trash],
                            generations: state.generations.map(g =>
                                g.id === generationId ? { ...g, image_urls: newImages } : g
                            )
                        });
                        // Sync DB: update generations + insert to trash
                        supabase.from('generations').update({ image_urls: newImages }).eq('id', generationId).then();
                        syncTrashToDb(trashItem, false);
                    }
                }
                // Case 2: Deleting full generation (from grid or whatever)
                else {
                    const generation = state.generations.find(g => g.id === generationId);
                    if (!generation) return "";

                    const trashItem: TrashItem = {
                        id: trashId,
                        originalGenerationId: generationId,
                        type: 'full_generation',
                        generationData: generation,
                        deletedAt: new Date().toISOString()
                    };

                    set({
                        trash: [trashItem, ...state.trash],
                        generations: state.generations.filter(g => g.id !== generationId)
                    });
                    // Sync to DB: insert to trash + delete from generations
                    syncTrashToDb(trashItem, true);
                }

                return trashId;
            },

            restoreFromTrash: (trashId) => {
                const state = get();
                const item = state.trash.find(t => t.id === trashId);
                if (!item) return;

                if (item.type === 'full_generation' && item.generationData) {
                    // Restore full generation
                    set({
                        generations: [item.generationData, ...state.generations],
                        trash: state.trash.filter(t => t.id !== trashId)
                    });
                    // Sync DB: Upsert back to generations + delete from trash
                    supabase.from('generations').upsert(item.generationData).then();
                    supabase.from('trash').delete().eq('id', trashId).then();

                } else if (item.type === 'single_image' && item.imageUrl) {
                    // Restore single image to existing series
                    const generation = state.generations.find(g => g.id === item.originalGenerationId);

                    if (generation) {
                        // Insert back at index if possible, else append
                        const newImages = [...generation.image_urls];
                        const targetIndex = item.imageIndex !== undefined ? item.imageIndex : newImages.length;
                        // Clamp index
                        const safeIndex = Math.max(0, Math.min(targetIndex, newImages.length));

                        newImages.splice(safeIndex, 0, item.imageUrl);

                        set({
                            generations: state.generations.map(g =>
                                g.id === item.originalGenerationId ? { ...g, image_urls: newImages } : g
                            ),
                            trash: state.trash.filter(t => t.id !== trashId)
                        });
                        // Sync DB: update generations + delete from trash
                        supabase.from('generations').update({ image_urls: newImages }).eq('id', item.originalGenerationId).then();
                        supabase.from('trash').delete().eq('id', trashId).then();

                    } else {
                        // Original generation is gone? Recreate it as a new generation with just this image? 
                        // Or fail? Let's just fail silently or handle basic Restore logic if feasible.
                        // For now: assume user hasn't wiped the parent generation yet.
                        // If parent is gone, maybe we can't restore easily without more data.
                        console.warn("Cannot restore image: Parent generation not found");
                    }
                }
            },

            permanentDelete: (trashId) => {
                const state = get();
                const item = state.trash.find(t => t.id === trashId);
                if (!item) return;

                set({ trash: state.trash.filter(t => t.id !== trashId) });

                // Delete from trash table in Supabase
                supabase.from('trash').delete().eq('id', trashId).then();
            },

            emptyTrash: () => {
                const state = get();
                // Delete all items from trash table in Supabase
                state.trash.forEach(item => {
                    supabase.from('trash').delete().eq('id', item.id).then();
                });
                set({ trash: [] });
            },
        }),
        {
            name: 'influgen-storage',
            partialize: (state: GenerationStore) => ({
                contentMode: state.contentMode,
                influencerPrompts: state.influencerPrompts,
                customBasePrompts: state.customBasePrompts,
                // Persist reference images by influencer
                referenceImagesByInfluencer: state.referenceImagesByInfluencer,
                generations: state.generations,
                selectedInfluencer: state.selectedInfluencer,
                imagesByMode: state.imagesByMode, // Persist mode-specific images
                influencerStatus: state.influencerStatus,
                posts: state.posts, // Persist posts
                influencers: state.influencers, // Persist dynamic list
                trash: state.trash, // Persist trash
            }),
        }
    ));

