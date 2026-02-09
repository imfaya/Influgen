// Wavespeed API service

import { GenerationRequest, AspectRatio } from '@/types';
import { WAVESPEED_CONFIG, ASPECT_RATIOS } from './constants';

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

export async function generateImages(request: GenerationRequest): Promise<WavespeedResponse> {
    try {
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
        return {
            success: true,
            images: data.images || [],
        };
    } catch (error) {
        console.error('Generation error:', error);
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
