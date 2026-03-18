// Batch generation utility for multi-influencer parallel generation

import { Influencer, ContentMode, Generation } from '@/types';
import { useGenerationStore } from '@/store';
import { generateImages, createGenerationRequest } from '@/lib/wavespeed';
import { supabaseAuth as supabase } from '@/lib/supabase-auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate random prompts using the API
 */
async function generateRandomPrompt(influencerContext: string, contentMode: ContentMode): Promise<string> {
    try {
        const response = await fetch('/api/generate-random-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                influencerContext,
                contentMode,
            }),
        });
        const data = await response.json();
        return data.prompt || 'beautiful portrait, professional photography';
    } catch {
        return 'beautiful portrait, professional photography';
    }
}

/**
 * Generate images for multiple influencers across multiple modes
 * All generations run in parallel for maximum speed
 */
export async function generateMultiInfluencerBatch(
    influencers: Influencer[],
    modes: ContentMode[],
    imagesPerInfluencer: number
): Promise<void> {
    const store = useGenerationStore.getState();
    const {
        addPendingGeneration,
        removePendingGeneration,
        addGeneration,
        recordGeneration,
        parameters,
        getCustomBasePrompt
    } = store;

    console.log('[BatchGen] Starting multi-influencer batch:', {
        influencerCount: influencers.length,
        modes,
        imagesPerInfluencer,
        totalGenerations: influencers.length * modes.length * imagesPerInfluencer
    });

    // Create all generation tasks
    const tasks: Array<{
        influencer: Influencer;
        mode: ContentMode;
        index: number;
    }> = [];

    for (const influencer of influencers) {
        for (const mode of modes) {
            for (let i = 0; i < imagesPerInfluencer; i++) {
                tasks.push({ influencer, mode, index: i });
            }
        }
    }

    // Generate unique batch ID for grouping
    const batchId = `batch_dashboard_${Date.now()}`;

    // Execute all tasks in parallel
    const promises = tasks.map(async ({ influencer, mode }) => {
        console.log(`[BatchGen] 🚀 Starting task for ${influencer.name} (${mode})`);

        // Get base prompt for this influencer
        let activeBasePrompt = getCustomBasePrompt(influencer.id) || influencer.basePrompt;

        // Inject explicit keywords for Porn mode
        if (mode === 'porn') {
            activeBasePrompt += ", FULL NUDE, EXPLICIT, RAW PRIVATE PHOTO";
        }

        // Generate random prompt for variety
        const randomPrompt = await generateRandomPrompt(influencer.description || '', mode);
        const finalPrompt = `${activeBasePrompt}. ${randomPrompt}`;

        // Add pending generation for UI
        const pendingId = addPendingGeneration(
            influencer.id,     // influencer ID for filtering
            randomPrompt.slice(0, 100),
            mode,
            undefined, // no source generation
            undefined, // no source image
            batchId,   // batch grouping
            ['batch_dashboard']
        );

        try {
            // Get reference images for this influencer
            const activeReferenceImages = (influencer.defaultReferenceImages || []).slice(0, 4);

            if (activeReferenceImages.length === 0) {
                console.warn(`[BatchGen] ⚠️ No default reference images for ${influencer.name}`);
            }

            // Create generation request
            const request = createGenerationRequest(
                finalPrompt,
                1, // 1 image per generation
                parameters.aspectRatio,
                activeReferenceImages.length > 0 ? activeReferenceImages : undefined
            );
            request.model = parameters.model as any;

            const result = await generateImages(request);

            if (result.success && result.images) {
                recordGeneration();

                // Create generation record
                const newGen = {
                    influencer_name: influencer.name,
                    prompt: finalPrompt,
                    parameters,
                    image_urls: result.images,
                    is_series: false,
                    series_id: undefined,
                    influencer_id: influencer.id,
                    content_mode: mode,
                    tags: ['batch_dashboard'],
                };

                const addedGen = addGeneration(newGen);

                // Save to Supabase
                const supabasePayload = {
                    id: addedGen.id,
                    influencer_id: influencer.id,
                    prompt: finalPrompt,
                    parameters: parameters,
                    image_urls: result.images,
                    is_series: false,
                    series_id: null,
                    content_mode: mode,
                    tags: ['batch_dashboard'],
                    created_at: addedGen.created_at
                };

                const { error: insertError } = await supabase.from('generations').insert(supabasePayload);
                if (insertError) {
                    console.error(`[BatchGen] ⚠️ Failed to save to DB for ${influencer.name}:`, insertError);
                }

                console.log(`[BatchGen] ✓ ${influencer.name} (${mode}):`, result.images[0]?.slice(0, 60));
                return { success: true, influencer: influencer.name, mode };
            }

            console.error(`[BatchGen] ✗ Failed API call for ${influencer.name}:`, result.error);
            return { success: false, influencer: influencer.name, mode };
        } catch (err) {
            console.error(`[BatchGen] ✗ Exception for ${influencer.name} (${mode}):`, err);
            return { success: false, influencer: influencer.name, mode };
        } finally {
            removePendingGeneration(pendingId);
        }
    });

    // Wait for all generations to complete
    const results = await Promise.all(promises);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[BatchGen] Complete: ${successful} successful, ${failed} failed`);

    // Trigger immediate balance refresh
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('wavespeed-balance-refresh'));
    }
}
