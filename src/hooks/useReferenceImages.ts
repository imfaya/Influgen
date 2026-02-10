import { useCallback } from 'react';
import { ReferenceImage, ContentMode } from '@/types';
import { filterReferenceImagesByMode } from '@/lib/filterByContentMode';

export interface ReferenceImageOptions {
    selectedInfluencerName: string;
    contentMode: ContentMode;
    allReferenceImages: ReferenceImage[];
    defaultReferenceImages?: string[];
}

/**
 * Hook for managing reference image selection and filtering
 * Handles content mode filtering and image prioritization
 */
export function useReferenceImages() {
    /**
     * Get active reference images for generation
     * Combines default (face) images with user uploads, respecting content mode
     */
    const getActiveReferenceImages = useCallback((options: ReferenceImageOptions): string[] => {
        const {
            selectedInfluencerName,
            contentMode,
            allReferenceImages,
            defaultReferenceImages = []
        } = options;

        // Filter user-uploaded images by content mode
        const filteredReferenceImages = filterReferenceImagesByMode(
            allReferenceImages.filter(img => img.influencer_name === selectedInfluencerName),
            contentMode
        );

        // Debug logging
        const totalCount = allReferenceImages.filter(img => img.influencer_name === selectedInfluencerName).length;
        console.log(`[useReferenceImages] Content mode: ${contentMode}`);
        console.log(`[useReferenceImages] Total reference images: ${totalCount}`);
        console.log(`[useReferenceImages] After filtering: ${filteredReferenceImages.length}`);
        console.log(`[useReferenceImages] Image types being used:`, filteredReferenceImages.map(img => img.image_type));

        const userReferenceImages = filteredReferenceImages.map(img => img.image_url);

        // Get default reference images for the character (face consistency)
        // Limit to 3 max to avoid API timeouts
        const defaultImages = defaultReferenceImages.slice(0, 3);

        // Combine: defaults first (for face), then user uploads (max 4 total)
        return [...defaultImages, ...userReferenceImages].slice(0, 4);
    }, []);

    /**
     * Build reference image array for "Steal It" mode
     * Prioritizes stolen image for composition, followed by face references
     */
    const getStealItReferenceImages = useCallback((
        stealItImage: string,
        defaultImages: string[],
        userImages: string[]
    ): string[] => {
        // Combine all face references
        const allFaceReferences = [...defaultImages, ...userImages];
        const faceImages = allFaceReferences.slice(0, 3);

        // Stolen image first (for composition), then face images (for identity)
        return [stealItImage, ...faceImages];
    }, []);

    /**
     * Build reference image array for series/variation mode
     * Prioritizes source image, followed by face references
     */
    const getSeriesReferenceImages = useCallback((
        sourceImage: string,
        defaultImages: string[],
        isRealismBoost?: boolean
    ): string[] => {
        if (isRealismBoost) {
            // For realism boost, use ONLY the input image
            return [sourceImage];
        }

        // Put source image first for structural priority, then face images
        const faceImages = defaultImages.slice(0, 2);
        return [sourceImage, ...faceImages];
    }, []);

    return {
        getActiveReferenceImages,
        getStealItReferenceImages,
        getSeriesReferenceImages,
    };
}
