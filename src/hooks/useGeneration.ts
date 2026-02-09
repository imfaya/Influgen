import { useCallback, useState } from 'react';
import { useGenerationStore } from '@/store';
import { generateImages, createGenerationRequest } from '@/lib/wavespeed';
import { generateRandomPrompt, generateSeriesContinuationPrompt, INFLUENCERS, DEFAULT_NEGATIVE_PROMPT } from '@/lib/constants';
import { supabaseAuth as supabase } from '@/lib/supabase-auth';
import { uploadGeneratedImage } from '@/lib/storage';
import { Post } from '@/types';
import { filterReferenceImagesByMode } from '@/lib/filterByContentMode';


export function useGeneration() {
    const {
        selectedInfluencer,
        parameters,
        prompt,
        setPrompt,
        error,
        currentImages,
        setError,
        setCurrentImages,
        seriesId,
        seriesContext,
        startNewSeries,
        clearSeries,
        addGeneration,
        appendToGeneration,
        currentGenerationId,
        referenceImages,
        canGenerate,
        recordGeneration,
        getCustomBasePrompt,
        contentMode,
        addPendingGeneration,
        removePendingGeneration,
        pendingGenerations,
        addPost,
        updatePost,
    } = useGenerationStore();

    // State for LLM-powered randomization
    const [isRandomizing, setIsRandomizing] = useState(false);

    // Generate random prompt using LLM (creative AI-powered generation)
    const randomizePrompt = useCallback(async () => {
        setIsRandomizing(true);
        setError(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const response = await fetch('/api/generate-random-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    influencerContext: selectedInfluencer.description,
                    contentMode: contentMode,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (data.prompt) {
                setPrompt(data.prompt);
            } else if (data.error) {
                // Fallback to simple random if LLM fails
                console.warn('LLM randomize failed, using fallback:', data.error);
                const fallbackPrompt = generateRandomPrompt();
                setPrompt(fallbackPrompt);
            }
        } catch (error) {
            // Fallback to simple random on network error
            console.warn('LLM randomize error, using fallback:', error);
            const fallbackPrompt = generateRandomPrompt();
            setPrompt(fallbackPrompt);
        } finally {
            setIsRandomizing(false);
        }
    }, [selectedInfluencer, setPrompt, setError, contentMode]);

    // Generate AI-powered series variation prompt
    // If originalPrompt is provided, use it instead of the global store prompt (for parallel series)
    const generateSeriesVariation = useCallback(async (originalPrompt?: string): Promise<string | null> => {
        try {
            // Use provided prompt or fall back to global store
            const state = useGenerationStore.getState();
            const currentPrompt = originalPrompt || state.prompt;
            const currentContext = state.seriesContext;
            const currentMode = state.contentMode;

            const response = await fetch('/api/generate-series-variation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalPrompt: currentPrompt,
                    seriesContext: currentContext,
                    contentMode: currentMode,
                }),
            });

            const data = await response.json();
            if (data.variationPrompt) {
                return data.variationPrompt;
            }
        } catch (error) {
            console.warn('Failed to generate AI variation, using fallback:', error);
        }

        // Fallback to old method if API fails
        const state = useGenerationStore.getState();
        return generateSeriesContinuationPrompt('', state.seriesContext || {});
    }, []);

    // Main generation function
    // targetGenerationId: if provided, append results to this generation instead of creating new
    // sourceInfo: for pending UI grouping (shows which OG image this series belongs to)
    const generate = useCallback(async (
        inputImageOverride?: string,
        customVariationPrompt?: string,
        options?: {
            tags?: string[],
            promptOverride?: string,
            isSeries?: boolean,
            targetGenerationId?: string,
            sourceInfo?: { generationId: string; imageUrl: string },
            stealItImage?: string, // New field
            isRealismBoost?: boolean, // For iPhone Realistic - use ONLY the input image
            modelOverride?: string, // For premium realism boost with different model
            imageStrength?: number, // Control preservation (0-1)
            negativePrompt?: string // Override negative prompt
        }
    ) => {
        // Check rate limit
        if (!canGenerate()) {
            setError('Rate limit exceeded. Please wait a moment before generating more images.');
            return null;
        }

        // Combine hidden base prompt with user prompt
        let activeBasePrompt = getCustomBasePrompt(selectedInfluencer.id) || selectedInfluencer.basePrompt;

        // Inject explicit keywords for Porn mode
        if (contentMode === 'porn') {
            activeBasePrompt += ", FULL NUDE, EXPLICIT, RAW PRIVATE PHOTO";
        }

        // Use getState to ensure we have the very latest prompt even if closure is stale
        // This is critical for Quick Post which updates store and calls generate immediately
        const userPrompt = options?.promptOverride || useGenerationStore.getState().prompt.trim();

        let finalPrompt = '';
        if (options?.isRealismBoost) {
            // For Realism Boost, use ONLY the override prompt logic (iPhone style)
            // Do NOT include the base prompt to avoid confusing the model with character details
            finalPrompt = userPrompt;
        } else {
            finalPrompt = userPrompt
                ? `${activeBasePrompt}. ${userPrompt}`
                : activeBasePrompt;
        }

        // Extract options with defaults
        const {
            tags,
            targetGenerationId,
            sourceInfo,
            isSeries = !!inputImageOverride, // Only default to series if we have an input image override
            stealItImage // New option for Steal It V2
        } = options || {};

        // For series continuation
        let generationPrompt = finalPrompt;

        // Get user-uploaded reference images for this influencer
        let userReferenceImages = referenceImages
            .filter(img => img.influencer_name === selectedInfluencer.name)
            .map(img => img.image_url);

        // CRITICAL: Filter reference images by content mode
        // In social/sensual modes, exclude explicit images (boobs, pussy)
        // In porn mode, allow all image types
        const filteredReferenceImages = filterReferenceImagesByMode(
            referenceImages.filter(img => img.influencer_name === selectedInfluencer.name),
            contentMode
        );

        // Debug logging to verify filtering
        console.log(`[generate] Content mode: ${contentMode}`);
        console.log(`[generate] Total reference images: ${referenceImages.filter(img => img.influencer_name === selectedInfluencer.name).length}`);
        console.log(`[generate] After filtering: ${filteredReferenceImages.length}`);
        console.log(`[generate] Image types being used:`, filteredReferenceImages.map(img => img.image_type));

        // Use filtered images only
        userReferenceImages = filteredReferenceImages.map(img => img.image_url);

        // Get default reference images for the character (face consistency)
        // Limit to 3 max to avoid API timeouts with large payloads
        const defaultImages = (selectedInfluencer.defaultReferenceImages || []).slice(0, 3);

        // Combine: defaults first (for face), then user uploads (max 4 total)
        let activeReferenceImages = [...defaultImages, ...userReferenceImages].slice(0, 4);

        // Model to use - default to text-to-image, switch to edit for series
        // If modelOverride is provided, use that instead
        let modelToUse = options?.modelOverride || parameters.model;

        // STEAL IT MODE V2.2: Perfect Balance of Identity and Visual Consistency
        if (stealItImage) {
            // Use the edit model to "edit" the stolen image into the influencer
            modelToUse = 'bytedance/seedream-v4.5/edit';

            // Priority: Stolen Image (Structure/Comp/Clothing) + MAX Face References for Identity
            // We use the stolen image ONCE to avoid it overriding the face too much
            // We use 3 face images to anchor the identity strongly

            // FIX: Combine default (local/legacy) and user (DB) reference images
            const allFaceReferences = [...defaultImages, ...userReferenceImages];
            const faceImages = allFaceReferences.slice(0, 3);
            activeReferenceImages = [stealItImage, ...faceImages];

            // Aggressive Identity-Swap Prompting (V2.3: No names, focus on photo-ordering logic)
            // We include the full base prompt but strip the name to avoid confusing Seedream
            // Reference image index 0 is the scene/stolen shell, indices 1+ are the target face identity
            generationPrompt = `IDENTITY SWAP: ${activeBasePrompt}. Replicate this identity PERFECTLY. The clothing, pose, camera angle, and background are copied EXACTLY from the first reference image, but ONLY swap the face with the features of the subject shown in the other reference images. The final subject is 100% the person described. No other faces allowed. ${userPrompt}`;

            console.log(`[generate] Steal It Mode V2.3 active - Identity focus using photo-ordering logic`);
        }
        // IMAGE-TO-IMAGE MODE (Series or Variation)
        else if (inputImageOverride) {
            // Use the edit model to maintain visual consistency from the source image
            // Only defaults to seedream-edit if no override is provided (e.g. Premium uses Nano Banana)
            modelToUse = options?.modelOverride || 'bytedance/seedream-v4.5/edit';

            // REALISM BOOST MODE: Use ONLY the input image, no face references
            // This prevents Seedream from creating montages
            if (options?.isRealismBoost) {
                activeReferenceImages = [inputImageOverride];
                console.log('[generate] Realism boost active - using ONLY input image');
            } else {
                // Put the scene/source image FIRST for maximum structural priority
                // Use face images to maintain identity
                const faceImages = defaultImages.slice(0, 2);
                activeReferenceImages = [inputImageOverride, ...faceImages];
            }

            if (isSeries && !options?.isRealismBoost) {
                // SERIES MODE: Generate a variation (different pose/action)
                const seriesVariation = customVariationPrompt || generateSeriesContinuationPrompt('', seriesContext || {});
                generationPrompt = `${activeBasePrompt}. ${seriesVariation}. Same exact location, same exact clothing, same exact lighting.`;
                console.log('[generate] Series continuation active');
            } else {
                // VARIATION/REALISM MODE: Keep everything same, only apply the prompt (e.g. realism boost)
                // generationPrompt is already finalPrompt (activeBasePrompt + userPrompt)
                generationPrompt = finalPrompt;
                console.log('[generate] Image variation/Realism active');
            }
        }

        // Start a pending generation for UI (shows loading rectangle)
        // Pass sourceInfo for grouping pending generations by their OG image
        const pendingId = addPendingGeneration(
            selectedInfluencer.id,
            finalPrompt.slice(0, 100),
            contentMode,
            sourceInfo?.generationId,
            sourceInfo?.imageUrl,
            undefined, // batchId
            options?.tags // tags
        );
        setError(null);

        try {
            const request = createGenerationRequest(
                generationPrompt,
                parameters.numOutputs,
                parameters.aspectRatio,
                activeReferenceImages.length > 0 ? activeReferenceImages : undefined,
                modelToUse, // Pass the dynamic model (edit vs standard)
                options?.imageStrength,
                options?.negativePrompt || DEFAULT_NEGATIVE_PROMPT // Use default negative prompt unless overridden
            );

            // Use the explicitly passed targetGenerationId for series continuation
            // This avoids race conditions with global state when multiple series run in parallel
            const activeGenerationId = targetGenerationId || currentGenerationId;

            const result = await generateImages(request);

            if (result.success && result.images) {
                const tempImages = result.images!;

                // Upload to Supabase Storage for permanent persistence
                const images = await Promise.all(
                    tempImages.map(url => uploadGeneratedImage(url, contentMode, selectedInfluencer.id))
                ).catch(err => {
                    console.error('[useGeneration] Failed to persist images to Supabase Storage:', err);
                    return tempImages; // Fallback to temporary URLs
                });

                recordGeneration();

                if (isSeries && activeGenerationId) {
                    // Append images to existing generation (same shooting session)
                    appendToGeneration(activeGenerationId, images);

                    // Update Supabase
                    const latestGen = useGenerationStore.getState().generations.find(g => g.id === activeGenerationId);

                    if (latestGen) {
                        const { error: updateError } = await supabase
                            .from('generations')
                            .update({
                                image_urls: latestGen.image_urls,
                                is_series: true,
                                created_at: latestGen.created_at
                            })
                            .eq('id', activeGenerationId);

                        if (updateError) {
                            console.error('[useGeneration] Critical: Failed to update generation in DB:', updateError);
                            setError(`Warning: Failed to save image to cloud history (${updateError.message}).`);
                        }
                    }
                } else {
                    // If starting a new series (not continuation), extract context
                    const context = {
                        location: extractLocation(finalPrompt),
                        outfit: extractOutfit(finalPrompt),
                        lighting: extractLighting(finalPrompt),
                    };
                    startNewSeries(context);

                    // Save as new entry to history
                    const newGen = {
                        influencer_name: selectedInfluencer.name,
                        prompt: generationPrompt,
                        parameters,
                        image_urls: images,
                        is_series: false,
                        series_id: undefined,
                        influencer_id: selectedInfluencer.id,
                        content_mode: contentMode,
                        tags: stealItImage
                            ? [...(tags || []), 'steal-it']
                            : tags || ((inputImageOverride && !isSeries) ? ['variation'] : undefined),
                    };

                    const addedGen = addGeneration(newGen);

                    // Create in Supabase (Attempt to save)
                    // Sanitize payload: Exclude 'influencer_name' which doesn't exist in DB
                    const supabasePayload = {
                        id: addedGen.id,
                        influencer_id: selectedInfluencer.id,
                        prompt: generationPrompt,
                        parameters: parameters,
                        image_urls: images,
                        is_series: false,
                        series_id: null,
                        content_mode: contentMode,
                        tags: stealItImage
                            ? [...(tags || []), 'steal-it']
                            : tags || ((inputImageOverride && !isSeries) ? ['variation'] : []),
                        created_at: addedGen.created_at
                    };

                    const { error: insertError } = await supabase
                        .from('generations')
                        .insert(supabasePayload);

                    if (insertError) {
                        console.error('[useGeneration] Critical: Failed to save generation to DB:', insertError);
                        // Optional: Show toast or error state?
                        // For now we log it. The local state is already updated, but it will be lost on refresh.
                        // We should ideally warn the user.
                        setError(`Warning: Image generated but failed to save to cloud (${insertError.message}). It may disappear on refresh.`);
                    } else {
                        console.log('[useGeneration] Successfully saved generation to DB:', addedGen.id);
                    }
                }

                // Return generated images for use by other functions
                return images;
            } else {
                setError(result.error || 'Failed to generate images');
                return null;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            return null;
        } finally {
            removePendingGeneration(pendingId);
        }
    }, [
        prompt,
        selectedInfluencer,
        parameters,
        seriesContext,
        referenceImages,
        currentGenerationId,
        canGenerate,
        recordGeneration,
        setError,
        setCurrentImages,
        startNewSeries,
        addGeneration,
        appendToGeneration,
        addPendingGeneration,
        removePendingGeneration,
        contentMode,
        getCustomBasePrompt,
    ]);

    // State for Series continuation
    const [isContinuingSeries, setIsContinuingSeries] = useState(false);

    // Continue series: Use current image as input + AI-generated pose variation
    // If generationId is provided, append to that generation (existing history entry)
    const continueSeries = useCallback(async (imageUrl?: string, generationId?: string) => {
        const imageToUse = imageUrl || (currentImages && currentImages.length > 0 ? currentImages[0] : null);

        // DEBUG: Log which image is being used
        console.log('[continueSeries] Called with:', { imageUrl, generationId, imageToUse });

        if (!imageToUse) {
            setError("No image to continue from.");
            return;
        }

        setIsContinuingSeries(true);
        setError(null);

        try {
            // Get the ORIGINAL prompt from the source generation to ensure correct context
            // This is crucial for parallel series generation from different OG photos
            let sourcePrompt: string | undefined;
            if (generationId) {
                const sourceGen = useGenerationStore.getState().generations.find(g => g.id === generationId);
                if (sourceGen) {
                    sourcePrompt = sourceGen.prompt;
                    console.log('[continueSeries] Using prompt from source generation:', sourcePrompt?.substring(0, 100));
                }
            }

            // Generate AI-powered variation prompt using the SOURCE generation's prompt
            const variationPrompt = await generateSeriesVariation(sourcePrompt);

            // Build sourceInfo for pending UI grouping (shows which OG this series belongs to)
            const sourceInfo = generationId ? {
                generationId,
                imageUrl: imageToUse
            } : undefined;

            // DEBUG: Log before calling generate
            console.log('[continueSeries] Calling generate with imageToUse:', imageToUse.substring(0, 100));

            // Start generating with this image as override and AI variation
            // Pass targetGenerationId directly to avoid race conditions with parallel series
            await generate(
                imageToUse,                  // inputImageOverride
                variationPrompt || undefined, // customVariationPrompt
                {
                    isSeries: true,
                    targetGenerationId: generationId,
                    sourceInfo
                }
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to continue series');
        } finally {
            setIsContinuingSeries(false);
        }

    }, [currentImages, generate, setError, generateSeriesVariation]);

    // Generate Batch OG: Generate N independent OG images with randomized prompts, all in parallel
    // - All randomize calls happen simultaneously
    // - All image generations happen simultaneously
    // - Uses batchId for grouping in pending UI
    // - Does NOT update the prompt text box
    // - Only shows results when ALL are complete
    const generateBatchOG = useCallback(async (count: number): Promise<void> => {
        setError(null);

        // Generate unique batch ID for grouping
        const batchId = `batch_${Date.now()}`;

        // Get base prompt and reference images
        const activeBasePrompt = getCustomBasePrompt(selectedInfluencer.id) || selectedInfluencer.basePrompt;
        const activeReferenceImages = referenceImages.map(img => img.image_url);

        try {
            // Step 1: Generate N random prompts in parallel
            const randomPromises = Array.from({ length: count }, async () => {
                try {
                    const response = await fetch('/api/generate-random-prompt', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            influencerContext: selectedInfluencer.description,
                            contentMode: contentMode,
                        }),
                    });
                    const data = await response.json();
                    return data.prompt || generateRandomPrompt();
                } catch {
                    return generateRandomPrompt();
                }
            });

            const prompts = await Promise.all(randomPromises);

            // Step 2: Start ALL pending generations at once (for UI grouping)
            const pendingIds = prompts.map((randomPrompt) =>
                addPendingGeneration(
                    selectedInfluencer.id,
                    randomPrompt.slice(0, 100),
                    contentMode,
                    undefined, // no sourceGenerationId
                    undefined, // no sourceImageUrl
                    batchId    // batch grouping
                )
            );

            // Step 3: Generate all images in parallel
            const generatePromises = prompts.map(async (randomPrompt, index) => {
                const generationPrompt = `${activeBasePrompt}. ${randomPrompt}`;

                try {
                    const request = createGenerationRequest(
                        generationPrompt,
                        1, // Always 1 output per batch item
                        parameters.aspectRatio,
                        activeReferenceImages.length > 0 ? activeReferenceImages : undefined,
                        undefined, // model (will be set below)
                        undefined, // imageStrength
                        DEFAULT_NEGATIVE_PROMPT // Apply negative prompt to batch generations
                    );
                    request.model = parameters.model as any;

                    const result = await generateImages(request);

                    if (result.success && result.images) {
                        const tempImages = result.images!;
                        // Upload to Supabase Storage for permanent persistence
                        const images = await Promise.all(
                            tempImages.map(url => uploadGeneratedImage(url, contentMode, selectedInfluencer.id))
                        ).catch(err => {
                            console.error('[useGeneration] Batch: Failed to persist to Supabase Storage:', err);
                            return tempImages; // Fallback
                        });

                        recordGeneration();

                        // Save as new entry to history (but don't add to UI until ALL complete)
                        const newGen = {
                            influencer_name: selectedInfluencer.name,
                            prompt: generationPrompt,
                            parameters,
                            image_urls: images,
                            is_series: false,
                            series_id: undefined,
                            influencer_id: selectedInfluencer.id,
                            content_mode: contentMode,
                            tags: ['batch_og'],
                        };

                        const addedGen = addGeneration(newGen);

                        // Save to Supabase (Sanitized payload)
                        await supabase
                            .from('generations')
                            .insert({
                                id: addedGen.id,
                                influencer_id: selectedInfluencer.id,
                                prompt: generationPrompt,
                                parameters: parameters,
                                image_urls: images,
                                is_series: false,
                                series_id: null,
                                content_mode: contentMode,
                                tags: ['batch_og'],
                                created_at: addedGen.created_at
                            });

                        return { success: true, images: images };
                    }
                    return { success: false };
                } catch (err) {
                    console.error('Batch generation error:', err);
                    return { success: false };
                } finally {
                    // Remove this specific pending generation
                    removePendingGeneration(pendingIds[index]);
                }
            });

            // Wait for ALL to complete
            const results = await Promise.all(generatePromises);

            // Update current images with the first successful batch
            const firstSuccess = results.find(r => r.success && r.images);
            if (firstSuccess?.images) {
                setCurrentImages(firstSuccess.images);
            }

        } catch (err) {
            console.error('Batch OG error:', err);
            setError(err instanceof Error ? err.message : 'Failed to create batch OG');
        }
    }, [
        selectedInfluencer,
        contentMode,
        parameters,
        referenceImages,
        getCustomBasePrompt,
        addPendingGeneration,
        removePendingGeneration,
        addGeneration,
        recordGeneration,
        setCurrentImages,
        setError
    ]);

    // Check if any generation is running
    const isGenerating = pendingGenerations.length > 0;

    return {
        // State
        selectedInfluencer,
        parameters,
        prompt,
        isGenerating,
        isRandomizing,
        isContinuingSeries,
        error,
        currentImages,
        seriesContext,

        // Actions
        setPrompt,
        randomizePrompt,
        generate,
        continueSeries,
        clearSeries,
        generateBatchOG,
        boostRealism: useCallback(async (imageUrl: string, generationId?: string) => {
            const realismPrompt = "iphone photo, smartphone camera, natural lighting, candid moment, unedited, raw sensor data, slight noise, authentic, reality";
            const negativePrompt = "vignette, dark corners, retro filter, instagram filter, sepia, black and white, professional, studio lighting, 4k, 8k, sharp, focused, clean, high quality, masterpiece, retouching, airbrushed, makeup, painting, drawing, illustration";

            return generate(imageUrl, undefined, {
                isSeries: !!generationId, // If generationId provided, treat as series continuation
                targetGenerationId: generationId, // Append to this generation
                promptOverride: realismPrompt,
                tags: ['realism_boost'],
                isRealismBoost: true, // Use ONLY the input image, no face references
                sourceInfo: generationId ? { generationId, imageUrl } : undefined,
                imageStrength: 0.65, // Allow significant change (0.65 means keep 65% of original structure, let 35% change for noise/blur)
                negativePrompt: negativePrompt
            });
        }, [generate]),
        boostRealismPremium: useCallback(async (imageUrl: string, generationId?: string) => {
            const realismPrompt = "iphone photo, smartphone camera, candid, snapchat quality, raw, unedited, authentic daily life";
            const negativePrompt = "vignette, dark corners, retro filter, instagram filter, sepia, professional, studio lighting, 4k, 8k, sharp, focused, clean, high quality, masterpiece, retouching, airbrushed, glammed up";

            // Try Nano Banana Pro first (premium quality)
            const result = await generate(imageUrl, undefined, {
                isSeries: !!generationId,
                targetGenerationId: generationId,
                promptOverride: realismPrompt,
                tags: ['realism_boost_premium'],
                isRealismBoost: true,
                modelOverride: 'google/nano-banana-pro/edit',
                sourceInfo: generationId ? { generationId, imageUrl } : undefined,
                imageStrength: 0.6,
                negativePrompt: negativePrompt
            });

            // If Nano Banana failed (returns null), fallback to Seedream
            if (!result) {
                console.warn('[boostRealismPremium] Nano Banana failed, falling back to Seedream');
                return generate(imageUrl, undefined, {
                    isSeries: !!generationId,
                    targetGenerationId: generationId,
                    promptOverride: realismPrompt,
                    tags: ['realism_boost_fallback'],
                    isRealismBoost: true,
                    modelOverride: 'bytedance/seedream-v4.5/edit', // Fallback model
                    sourceInfo: generationId ? { generationId, imageUrl } : undefined,
                    imageStrength: 0.65,
                    negativePrompt: negativePrompt
                });
            }

            return result;
        }, [generate]),
    };
}

// Helper functions to extract context from prompts
function extractLocation(prompt: string): string | undefined {
    const locationPatterns = [
        /(?:in|at|on)\s+(?:a\s+)?([^,]+(?:café|park|apartment|boutique|hotel|gallery|rooftop|street|market))/i,
    ];
    for (const pattern of locationPatterns) {
        const match = prompt.match(pattern);
        if (match) return match[1].trim();
    }
    return undefined;
}

function extractOutfit(prompt: string): string | undefined {
    const outfitPatterns = [
        /(?:wearing|dressed in|in)\s+(?:a\s+)?([^,]*(?:dress|outfit|wear|jacket|style|look))/i,
    ];
    for (const pattern of outfitPatterns) {
        const match = prompt.match(pattern);
        if (match) return match[1].trim();
    }
    return undefined;
}

function extractLighting(prompt: string): string | undefined {
    const lightingPatterns = [
        /(golden hour|morning light|evening shadows|midday sun|indoor lighting|studio lighting|natural daylight|evening ambiance)/i,
    ];
    for (const pattern of lightingPatterns) {
        const match = prompt.match(pattern);
        if (match) return match[1].trim();
    }
    return undefined;
}

