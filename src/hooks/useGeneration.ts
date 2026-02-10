import { useCallback, useState } from 'react';
import { useGenerationStore } from '@/store';
import { generateRandomPrompt } from '@/lib/constants';
import { usePromptUtils, extractPromptContext } from './usePromptUtils';
import { useReferenceImages } from './useReferenceImages';
import { useGenerationPersistence } from './useGenerationPersistence';
import { useImageGeneration } from './useImageGeneration';
import { usePromptBuilder } from './usePromptBuilder';

export interface GenerationOptions {
    tags?: string[];
    promptOverride?: string;
    isSeries?: boolean;
    targetGenerationId?: string;
    sourceInfo?: { generationId: string; imageUrl: string };
    stealItImage?: string;
    isRealismBoost?: boolean;
    modelOverride?: string;
    imageStrength?: number;
    negativePrompt?: string;
}

/**
 * Main generation hook - Facade that coordinates all generation-related functionality
 * Refactored from 737 lines into modular, composable hooks
 */
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
    } = useGenerationStore();

    // Use specialized hooks
    const promptUtils = usePromptUtils(contentMode, selectedInfluencer.description);
    const refImageManager = useReferenceImages();
    const persistence = useGenerationPersistence();
    const imageGen = useImageGeneration();
    const promptBuilder = usePromptBuilder();

    // Local state for series continuation
    const [isContinuingSeries, setIsContinuingSeries] = useState(false);

    /**
     * Randomize prompt using LLM API
     */
    const randomizePrompt = useCallback(async () => {
        setError(null);
        const newPrompt = await promptUtils.randomizePrompt();
        if (newPrompt) {
            setPrompt(newPrompt);
        }
    }, [promptUtils, setPrompt, setError]);

    /**
     * Main generation function - Orchestrates the entire generation process
     */
    const generate = useCallback(async (
        inputImageOverride?: string,
        customVariationPrompt?: string,
        options?: GenerationOptions
    ) => {
        // Check rate limit
        if (!canGenerate()) {
            setError('Rate limit exceeded. Please wait a moment before generating more images.');
            return null;
        }

        // Extract options
        const {
            tags,
            targetGenerationId,
            sourceInfo,
            isSeries = !!inputImageOverride,
            stealItImage,
            isRealismBoost,
            modelOverride,
            imageStrength,
            negativePrompt
        } = options || {};

        // Get base prompt (with porn mode injection if needed)
        const userPrompt = options?.promptOverride || useGenerationStore.getState().prompt.trim();

        // Build final prompt using prompt builder
        const finalPrompt = promptBuilder.buildPrompt({
            basePrompt: getCustomBasePrompt(selectedInfluencer.id) || selectedInfluencer.basePrompt,
            userPrompt,
            contentMode,
            isRealismBoost,
            stealItImage,
            inputImageOverride,
            isSeries,
            seriesContext: seriesContext || undefined,
            customVariationPrompt,
            allReferenceImages: referenceImages,
            selectedInfluencerName: selectedInfluencer.name,
        });

        // Get active reference images
        let activeReferenceImages: string[];

        if (stealItImage) {
            // Steal It mode: stolen image + face references
            activeReferenceImages = refImageManager.getStealItReferenceImages(
                stealItImage,
                selectedInfluencer.defaultReferenceImages || [],
                referenceImages.map(img => img.image_url)
            );
            console.log('[generate] Steal It Mode V2.3 active');
        } else if (inputImageOverride) {
            // Series/Variation mode
            activeReferenceImages = refImageManager.getSeriesReferenceImages(
                inputImageOverride,
                selectedInfluencer.defaultReferenceImages || [],
                isRealismBoost
            );
            console.log(`[generate] ${isRealismBoost ? 'Realism boost' : 'Series continuation'} active`);
        } else {
            // Standard mode: filtered reference images
            activeReferenceImages = refImageManager.getActiveReferenceImages({
                selectedInfluencerName: selectedInfluencer.name,
                contentMode,
                allReferenceImages: referenceImages,
                defaultReferenceImages: selectedInfluencer.defaultReferenceImages,
            });
        }

        // Select model
        const modelToUse = promptBuilder.selectModel(
            parameters.model,
            inputImageOverride,
            stealItImage,
            modelOverride
        );

        // Add pending generation for UI
        const pendingId = addPendingGeneration(
            selectedInfluencer.id,
            finalPrompt.slice(0, 100),
            contentMode,
            sourceInfo?.generationId,
            sourceInfo?.imageUrl,
            undefined,
            tags
        );
        setError(null);

        try {
            // Generate and upload images
            const result = await imageGen.generateAndUpload({
                prompt: finalPrompt,
                numOutputs: parameters.numOutputs,
                aspectRatio: parameters.aspectRatio,
                referenceImages: activeReferenceImages,
                model: modelToUse,
                contentMode,
                influencerId: selectedInfluencer.id,
                imageStrength,
                negativePrompt,
            });

            if (!result.success || !result.images) {
                setError(result.error || 'Failed to generate images');
                return null;
            }

            const images = result.images;
            recordGeneration();

            // Determine active generation ID (for series continuation)
            const activeGenerationId = targetGenerationId || currentGenerationId;

            if (isSeries && activeGenerationId) {
                // Append to existing generation
                appendToGeneration(activeGenerationId, images);

                // Update in Supabase
                const latestGen = useGenerationStore.getState().generations.find(g => g.id === activeGenerationId);
                if (latestGen) {
                    const persistResult = await persistence.updateGeneration(
                        activeGenerationId,
                        latestGen.image_urls,
                        latestGen.created_at
                    );

                    if (!persistResult.success) {
                        setError(`Warning: Failed to save image to cloud history (${persistResult.error}).`);
                    }
                }
            } else {
                // Create new generation
                const context = extractPromptContext(finalPrompt);
                startNewSeries(context);

                const newGen = {
                    influencer_name: selectedInfluencer.name,
                    prompt: finalPrompt,
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

                // Save to Supabase
                const persistResult = await persistence.saveGeneration({
                    generationId: addedGen.id,
                    influencerId: selectedInfluencer.id,
                    prompt: finalPrompt,
                    parameters,
                    imageUrls: images,
                    contentMode,
                    tags: stealItImage
                        ? [...(tags || []), 'steal-it']
                        : tags || ((inputImageOverride && !isSeries) ? ['variation'] : []),
                    isSeries: false,
                    seriesId: null,
                    createdAt: addedGen.created_at,
                });

                if (!persistResult.success) {
                    setError(`Warning: Image generated but failed to save to cloud (${persistResult.error}). It may disappear on refresh.`);
                } else {
                    console.log('[useGeneration] Successfully saved generation:', addedGen.id);
                }
            }

            return images;
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
        promptBuilder,
        refImageManager,
        imageGen,
        persistence,
    ]);

    /**
     * Continue series: Use current image as input + AI-generated pose variation
     */
    const continueSeries = useCallback(async (imageUrl?: string, generationId?: string) => {
        const imageToUse = imageUrl || (currentImages && currentImages.length > 0 ? currentImages[0] : null);

        console.log('[continueSeries] Called with:', { imageUrl, generationId, imageToUse });

        if (!imageToUse) {
            setError("No image to continue from.");
            return;
        }

        setIsContinuingSeries(true);
        setError(null);

        try {
            // Get the original prompt from source generation
            let sourcePrompt: string | undefined;
            if (generationId) {
                const sourceGen = useGenerationStore.getState().generations.find(g => g.id === generationId);
                if (sourceGen) {
                    sourcePrompt = sourceGen.prompt;
                    console.log('[continueSeries] Using prompt from source generation:', sourcePrompt?.substring(0, 100));
                }
            }

            // Generate AI-powered variation prompt
            const variationPrompt = await promptUtils.generateSeriesVariation(
                sourcePrompt || prompt,
                seriesContext || undefined
            );

            // Build source info for pending UI
            const sourceInfo = generationId ? { generationId, imageUrl: imageToUse } : undefined;

            console.log('[continueSeries] Calling generate with imageToUse:', imageToUse.substring(0, 100));

            // Generate with series options
            await generate(
                imageToUse,
                variationPrompt || undefined,
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
    }, [currentImages, generate, setError, promptUtils, prompt, seriesContext]);

    /**
     * Generate batch of OG images with randomized prompts (all in parallel)
     */
    const generateBatchOG = useCallback(async (count: number): Promise<void> => {
        setError(null);

        const batchId = `batch_${Date.now()}`;
        const activeBasePrompt = getCustomBasePrompt(selectedInfluencer.id) || selectedInfluencer.basePrompt;
        const activeReferenceImages = refImageManager.getActiveReferenceImages({
            selectedInfluencerName: selectedInfluencer.name,
            contentMode,
            allReferenceImages: referenceImages,
            defaultReferenceImages: selectedInfluencer.defaultReferenceImages,
        });

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

            // Step 2: Add pending generations
            const pendingIds = prompts.map((randomPrompt) =>
                addPendingGeneration(
                    selectedInfluencer.id,
                    randomPrompt.slice(0, 100),
                    contentMode,
                    undefined,
                    undefined,
                    batchId
                )
            );

            // Step 3: Generate all in parallel
            const generatePromises = prompts.map(async (randomPrompt, index) => {
                const generationPrompt = `${activeBasePrompt}. ${randomPrompt}`;

                try {
                    const result = await imageGen.generateAndUpload({
                        prompt: generationPrompt,
                        numOutputs: 1,
                        aspectRatio: parameters.aspectRatio,
                        referenceImages: activeReferenceImages,
                        model: parameters.model,
                        contentMode,
                        influencerId: selectedInfluencer.id,
                    });

                    if (result.success && result.images) {
                        recordGeneration();

                        const newGen = {
                            influencer_name: selectedInfluencer.name,
                            prompt: generationPrompt,
                            parameters,
                            image_urls: result.images,
                            is_series: false,
                            series_id: undefined,
                            influencer_id: selectedInfluencer.id,
                            content_mode: contentMode,
                            tags: ['batch_og'],
                        };

                        const addedGen = addGeneration(newGen);

                        await persistence.saveGeneration({
                            generationId: addedGen.id,
                            influencerId: selectedInfluencer.id,
                            prompt: generationPrompt,
                            parameters: parameters,
                            imageUrls: result.images,
                            contentMode: contentMode,
                            tags: ['batch_og'],
                            isSeries: false,
                            seriesId: null,
                            createdAt: addedGen.created_at
                        });

                        return { success: true, images: result.images };
                    }
                    return { success: false };
                } catch (err) {
                    console.error('Batch generation error:', err);
                    return { success: false };
                } finally {
                    removePendingGeneration(pendingIds[index]);
                }
            });

            const results = await Promise.all(generatePromises);

            // Update current images with first successful batch
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
        refImageManager,
        imageGen,
        persistence,
        addPendingGeneration,
        removePendingGeneration,
        addGeneration,
        recordGeneration,
        setCurrentImages,
        setError
    ]);

    /**
     * Boost realism of an image (iPhone style)
     */
    const boostRealism = useCallback(async (imageUrl: string, generationId?: string) => {
        const realismPrompt = "iphone photo, smartphone camera, natural lighting, candid moment, unedited, raw sensor data, slight noise, authentic, reality";
        const negativePrompt = "vignette, dark corners, retro filter, instagram filter, sepia, black and white, professional, studio lighting, 4k, 8k, sharp, focused, clean, high quality, masterpiece, retouching, airbrushed, makeup, painting, drawing, illustration";

        return generate(imageUrl, undefined, {
            isSeries: !!generationId,
            targetGenerationId: generationId,
            promptOverride: realismPrompt,
            tags: ['realism_boost'],
            isRealismBoost: true,
            sourceInfo: generationId ? { generationId, imageUrl } : undefined,
            imageStrength: 0.65,
            negativePrompt: negativePrompt
        });
    }, [generate]);

    /**
     * Boost realism with premium model (Nano Banana Pro)
     */
    const boostRealismPremium = useCallback(async (imageUrl: string, generationId?: string) => {
        const realismPrompt = "iphone photo, smartphone camera, candid, snapchat quality, raw, unedited, authentic daily life";
        const negativePrompt = "vignette, dark corners, retro filter, instagram filter, sepia, professional, studio lighting, 4k, 8k, sharp, focused, clean, high quality, masterpiece, retouching, airbrushed, glammed up";

        // Try Nano Banana Pro first
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

        // Fallback to Seedream if Nano Banana failed
        if (!result) {
            console.warn('[boostRealismPremium] Nano Banana failed, falling back to Seedream');
            return generate(imageUrl, undefined, {
                isSeries: !!generationId,
                targetGenerationId: generationId,
                promptOverride: realismPrompt,
                tags: ['realism_boost_fallback'],
                isRealismBoost: true,
                modelOverride: 'bytedance/seedream-v4.5/edit',
                sourceInfo: generationId ? { generationId, imageUrl } : undefined,
                imageStrength: 0.65,
                negativePrompt: negativePrompt
            });
        }

        return result;
    }, [generate]);

    // Check if any generation is running
    const isGenerating = pendingGenerations.length > 0;

    return {
        // State
        selectedInfluencer,
        parameters,
        prompt,
        isGenerating,
        isRandomizing: promptUtils.isRandomizing,
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
        boostRealism,
        boostRealismPremium,
    };
}
