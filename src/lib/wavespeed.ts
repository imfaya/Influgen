// Wavespeed API service with retry logic

import { GenerationRequest, AspectRatio } from '@/types';
import { WAVESPEED_CONFIG, ASPECT_RATIOS } from './constants';
import { withRetry } from './retry';

interface WavespeedResponse {
    success: boolean;
    images?: string[];
    error?: string;
}

export function getResolutionForAspectRatio(aspectRatio: AspectRatio): string {
    const option = ASPECT_RATIOS.find(ar => ar.value === aspectRatio);
    if (!option) {
        return '4096x4096';
    }
    return `${option.width}x${option.height}`;
}

/**
 * Generate images with automatic retry on failure
 * Implements exponential backoff: 1s, 2s, 4s delays
 */
export async function generateImages(request: GenerationRequest): Promise<WavespeedResponse> {
    try {
        const result = await withRetry(async () => {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        }, {
            maxAttempts: 3,
            initialDelay: 1000, // 1 second
            shouldRetry: (error) => {
                // Retry on network/timeout errors and 5xx server errors
                const message = error.message.toLowerCase();
                return (
                    message.includes('network') ||
                    message.includes('timeout') ||
                    message.includes('500') ||
                    message.includes('502') ||
                    message.includes('503') ||
                    message.includes('504')
                );
            }
        });

        return {
            success: true,
            images: result.images || [],
        };
    } catch (error) {
        console.error('[Wavespeed] Generation failed after retries:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred',
        };
    }
}

// Create a generation request object
export function createGenerationRequest(
    prompt: string,
    numOutputs: 1 | 2 | 4 | 8,
    aspectRatio: AspectRatio,
    referenceImages?: string[],
    model?: string,
    imageStrength?: number,
    negativePrompt?: string
): GenerationRequest {
    return {
        model: model || WAVESPEED_CONFIG.model,
        prompt,
        negative_prompt: negativePrompt,
        num_outputs: numOutputs,
        aspect_ratio: aspectRatio,
        resolution: getResolutionForAspectRatio(aspectRatio),
        reference_images: referenceImages,
        image_strength: imageStrength,
    };
}
