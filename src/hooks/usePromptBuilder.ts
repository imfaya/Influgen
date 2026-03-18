import { useCallback } from 'react';
import { ContentMode, ReferenceImage } from '@/types';

export interface PromptBuilderOptions {
    basePrompt: string;
    userPrompt: string;
    contentMode: ContentMode;
    isRealismBoost?: boolean;
    stealItImage?: string;
    stealIntensity?: '100' | '50' | '10';
    inputImageOverride?: string;
    isSeries?: boolean;
    seriesContext?: { location?: string; outfit?: string; lighting?: string };
    customVariationPrompt?: string;
    allReferenceImages?: ReferenceImage[];
    selectedInfluencerName?: string;
}

/**
 * Hook for building final prompts based on various generation modes
 * Handles special cases like Steal It, Realism Boost, and Series continuation
 */
export function usePromptBuilder() {
    /**
     * Build the final generation prompt based on mode and options
     */
    const buildPrompt = useCallback((options: PromptBuilderOptions): string => {
        const {
            basePrompt,
            userPrompt,
            contentMode,
            isRealismBoost,
            stealItImage,
            stealIntensity,
            inputImageOverride,
            isSeries,
            seriesContext,
            customVariationPrompt
        } = options;

        // Inject porn mode keywords
        let activeBasePrompt = basePrompt;
        if (contentMode === 'porn') {
            activeBasePrompt += ", FULL NUDE, EXPLICIT, RAW PRIVATE PHOTO";
        }

        // REALISM BOOST MODE: Use ONLY user prompt (iPhone style)
        if (isRealismBoost) {
            return userPrompt;
        }

        // STEAL IT MODE: Identity swap prompt
        if (stealItImage) {
            if (stealIntensity === '50') {
                return `INSPIRED RECREATION: ${activeBasePrompt}. Take inspiration from the composition. Keep a similar vibe and style, but feel free to change the pose and framing. The subject wears similar style clothing to the reference image. The final subject is 100% the person described. No other faces allowed. ${userPrompt}`;
            } else if (stealIntensity === '10') {
                return `MOOD CAPTURE: ${activeBasePrompt}. Only capture the overall mood, lighting atmosphere and color palette from the reference. The pose, clothing, and setting should be entirely new and original. The final subject is 100% the person described. No other faces allowed. ${userPrompt}`;
            }
            // default 100
            return `IDENTITY SWAP: ${activeBasePrompt}. Replicate this identity PERFECTLY. The clothing, pose, camera angle, and background are copied EXACTLY from the first reference image, but ONLY swap the face with the features of the subject shown in the other reference images. The final subject is 100% the person described. No other faces allowed. ${userPrompt}`;
        }

        // SERIES MODE: Generate variation
        if (inputImageOverride && isSeries && !isRealismBoost) {
            const seriesVariation = customVariationPrompt || generateFallbackSeriesPrompt(seriesContext);
            return `${activeBasePrompt}. ${seriesVariation}. Same exact location, same exact clothing, same exact lighting.`;
        }

        // IMAGE-TO-IMAGE or STANDARD MODE
        const finalPrompt = userPrompt
            ? `${activeBasePrompt}. ${userPrompt}`
            : activeBasePrompt;

        return finalPrompt;
    }, []);

    /**
     * Determine which model to use for generation
     */
    const selectModel = useCallback((
        defaultModel: string,
        inputImageOverride?: string,
        stealItImage?: string,
        modelOverride?: string
    ): string => {
        // Use override if provided
        if (modelOverride) {
            return modelOverride;
        }

        // Use edit model for image-to-image operations
        if (inputImageOverride || stealItImage) {
            return 'bytedance/seedream-v4.5/edit';
        }

        // Use default model
        return defaultModel;
    }, []);

    return {
        buildPrompt,
        selectModel,
    };
}

/**
 * Generate fallback series continuation prompt
 */
function generateFallbackSeriesPrompt(
    context?: { location?: string; outfit?: string; lighting?: string }
): string {
    const variations = [
        'different pose, same mood',
        'slight angle change, same energy',
        'alternative expression, same vibe',
    ];

    const baseVariation = variations[Math.floor(Math.random() * variations.length)];

    if (!context) {
        return baseVariation;
    }

    const parts = [baseVariation];
    if (context.location) parts.push(`at ${context.location}`);
    if (context.outfit) parts.push(`wearing ${context.outfit}`);
    if (context.lighting) parts.push(`${context.lighting}`);

    return parts.join(', ');
}
