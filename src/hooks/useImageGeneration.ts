import { useCallback } from 'react';
import { generateImages, createGenerationRequest } from '@/lib/wavespeed';
import { uploadGeneratedImage } from '@/lib/storage';
import { DEFAULT_NEGATIVE_PROMPT } from '@/lib/constants';
import { ContentMode, GenerationParameters, AspectRatio } from '@/types';

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

export interface GenerateImagesInput {
    prompt: string;
    numOutputs: 1 | 2 | 4 | 8;
    aspectRatio: AspectRatio;
    referenceImages: string[];
    model: string;
    contentMode: ContentMode;
    influencerId: string;
    imageStrength?: number;
    negativePrompt?: string;
}

/**
 * Core image generation hook
 * Handles the actual API calls and image upload logic
 */
export function useImageGeneration() {
    /**
     * Generate images using Wavespeed API and upload to storage
     */
    const generateAndUpload = useCallback(async (input: GenerateImagesInput): Promise<{
        success: boolean;
        images?: string[];
        error?: string;
    }> => {
        const {
            prompt,
            numOutputs,
            aspectRatio,
            referenceImages,
            model,
            contentMode,
            influencerId,
            imageStrength,
            negativePrompt = DEFAULT_NEGATIVE_PROMPT
        } = input;

        try {
            // Create generation request
            const request = createGenerationRequest(
                prompt,
                numOutputs,
                aspectRatio,
                referenceImages.length > 0 ? referenceImages : undefined,
                model,
                imageStrength,
                negativePrompt
            );

            // Generate images
            const result = await generateImages(request);

            if (!result.success || !result.images) {
                return {
                    success: false,
                    error: result.error || 'Failed to generate images'
                };
            }

            const tempImages = result.images;

            // Upload to Supabase Storage for permanent persistence
            const permanentImages = await Promise.all(
                tempImages.map(url => uploadGeneratedImage(url, contentMode, influencerId))
            ).catch(err => {
                console.error('[ImageGeneration] Failed to persist images to Supabase Storage:', err);
                return tempImages; // Fallback to temporary URLs
            });

            return {
                success: true,
                images: permanentImages
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('[ImageGeneration] Generation failed:', err);
            return {
                success: false,
                error: errorMessage
            };
        }
    }, []);

    return {
        generateAndUpload,
    };
}
