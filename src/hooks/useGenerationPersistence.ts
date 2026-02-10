import { useCallback } from 'react';
import { supabaseAuth as supabase } from '@/lib/supabase-auth';
import { Generation, GenerationParameters, ContentMode } from '@/types';

export interface GenerationPersistenceOptions {
    generationId: string;
    influencerId: string;
    prompt: string;
    parameters: GenerationParameters;
    imageUrls: string[];
    contentMode: ContentMode;
    tags?: string[];
    isSeries?: boolean;
    seriesId?: string | null;
    createdAt: string;
}

/**
 * Hook for persisting generations to Supabase
 * Handles both creation and updates with proper error handling
 */
export function useGenerationPersistence() {
    /**
     * Save a new generation to Supabase
     */
    const saveGeneration = useCallback(async (options: GenerationPersistenceOptions): Promise<{ success: boolean; error?: string }> => {
        const {
            generationId,
            influencerId,
            prompt,
            parameters,
            imageUrls,
            contentMode,
            tags = [],
            isSeries = false,
            seriesId = null,
            createdAt
        } = options;

        try {
            const { error } = await supabase
                .from('generations')
                .insert({
                    id: generationId,
                    influencer_id: influencerId,
                    prompt,
                    parameters,
                    image_urls: imageUrls,
                    is_series: isSeries,
                    series_id: seriesId,
                    content_mode: contentMode,
                    tags,
                    created_at: createdAt
                });

            if (error) {
                console.error('[Persistence] Failed to save generation:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            console.log('[Persistence] Successfully saved generation:', generationId);
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('[Persistence] Exception saving generation:', err);
            return {
                success: false,
                error: errorMessage
            };
        }
    }, []);

    /**
     * Update an existing generation (for series continuation)
     */
    const updateGeneration = useCallback(async (
        generationId: string,
        imageUrls: string[],
        createdAt: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase
                .from('generations')
                .update({
                    image_urls: imageUrls,
                    is_series: true,
                    created_at: createdAt
                })
                .eq('id', generationId);

            if (error) {
                console.error('[Persistence] Failed to update generation:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            console.log('[Persistence] Successfully updated generation:', generationId);
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('[Persistence] Exception updating generation:', err);
            return {
                success: false,
                error: errorMessage
            };
        }
    }, []);

    return {
        saveGeneration,
        updateGeneration,
    };
}
