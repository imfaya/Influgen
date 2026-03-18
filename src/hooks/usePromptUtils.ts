import { useState, useCallback } from 'react';
import { ContentMode } from '@/types';
import { generateRandomPrompt } from '@/lib/constants';
import type { ShootingDirectionId } from '@/lib/shootingDirections';

/**
 * Hook for managing prompt generation and randomization
 * Handles both AI-powered (LLM) and fallback prompt generation
 */
export function usePromptUtils(contentMode: ContentMode, influencerDescription?: string, shootingDirection?: ShootingDirectionId) {
    const [isRandomizing, setIsRandomizing] = useState(false);

    /**
     * Generate random prompt using LLM API with fallback to simple random
     */
    const randomizePrompt = useCallback(async (directionOverride?: ShootingDirectionId): Promise<string | null> => {
        setIsRandomizing(true);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const response = await fetch('/api/generate-random-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    influencerContext: influencerDescription,
                    contentMode: contentMode,
                    shootingDirection: directionOverride || shootingDirection || 'random',
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (data.prompt) {
                return data.prompt;
            } else if (data.error) {
                console.warn('LLM randomize failed, using fallback:', data.error);
                return generateRandomPrompt();
            }
        } catch (error) {
            console.warn('LLM randomize error, using fallback:', error);
            return generateRandomPrompt();
        } finally {
            setIsRandomizing(false);
        }

        return null;
    }, [influencerDescription, contentMode, shootingDirection]);

    /**
     * Generate AI-powered series variation prompt
     */
    const generateSeriesVariation = useCallback(async (
        originalPrompt: string,
        seriesContext?: { location?: string; outfit?: string; lighting?: string }
    ): Promise<string | null> => {
        try {
            const response = await fetch('/api/generate-series-variation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalPrompt,
                    seriesContext,
                    contentMode,
                }),
            });

            const data = await response.json();
            if (data.variationPrompt) {
                return data.variationPrompt;
            }
        } catch (error) {
            console.warn('Failed to generate AI variation, using fallback:', error);
        }

        return null;
    }, [contentMode]);

    return {
        isRandomizing,
        randomizePrompt,
        generateSeriesVariation,
    };
}

/**
 * Extract context information from prompts for series consistency
 */
export function extractPromptContext(prompt: string) {
    return {
        location: extractLocation(prompt),
        outfit: extractOutfit(prompt),
        lighting: extractLighting(prompt),
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
