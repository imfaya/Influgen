// Zustand store for global state management

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Generation, GenerationParameters, Influencer, ReferenceImage, AspectRatio, ContentMode, PendingGeneration, Post } from '@/types';
import { INFLUENCERS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

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
    addPendingGeneration: (prompt: string, contentMode: ContentMode, sourceGenerationId?: string, sourceImageUrl?: string, batchId?: string, tags?: string[]) => string;
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
            addPendingGeneration: (prompt, contentMode, sourceGenerationId?, sourceImageUrl?, batchId?, tags?) => {
                const id = uuidv4();
                set((state) => ({
                    pendingGenerations: [...state.pendingGenerations, {
                        id,
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
            appendToGeneration: (id, newImages) => set((state) => ({
                generations: state.generations.map(g =>
                    g.id === id
                        ? { ...g, image_urls: [...g.image_urls, ...newImages], is_series: true }
                        : g
                )
            })),
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
                        // Sync DB (best effort, async)
                        supabase.from('generations').update({ image_urls: newImages }).eq('id', generationId).then();
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
                    // Sync DB (marked as deleted or actually deleted?)
                    // For now we don't delete from DB immediately if we want Undo. 
                    // But if we want true Trash, we probably should leave it in DB or move to a trash table.
                    // IMPORTANT: To keep it simple, we will NOT delete from DB yet, or we assume DB sync is largely one-way or manual.
                    // Basically rely on local store update for UI, and assume eventually we handle DB cleanup if permanent delete.
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
                    // Sync DB: Upsert back
                    supabase.from('generations').upsert(item.generationData).then();

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
                        // Sync DB
                        supabase.from('generations').update({ image_urls: newImages }).eq('id', item.originalGenerationId).then();

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

                // Determine if we need to do DB cleanup
                if (item.type === 'full_generation' || (item.originalGenerationId && item.type === 'single_image')) {
                    // Since we didn't delete from keys in `generations`, we probably didn't delete from DB in `moveToTrash` (logic above).
                    // But wait, `moveToTrash` modifies `generations` state.
                    // If we want PERMANENT delete, we should ensure it's gone from DB.
                    if (item.type === 'full_generation' && item.generationData) {
                        supabase.from('generations').delete().eq('id', item.generationData.id).then();
                    }
                    // For single image, the DB update happened in `moveToTrash`. Nothing more to do.
                }
            },

            emptyTrash: () => {
                const state = get();
                // Permanently delete all full generations in trash from DB
                state.trash.forEach(item => {
                    if (item.type === 'full_generation' && item.generationData) {
                        supabase.from('generations').delete().eq('id', item.generationData.id).then();
                    }
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

