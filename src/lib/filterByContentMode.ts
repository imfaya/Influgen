// Utility to filter reference images based on content mode
import { ReferenceImage, ContentMode } from '@/types';

/**
 * Filters reference images based on the current content mode.
 * - Social/Sensual modes: Only allow 'face', 'body', 'edit' images (no explicit content)
 * - Porn mode: Allow all image types including 'boobs', 'pussy'
 * 
 * @param images - Array of reference images to filter
 * @param contentMode - Current content mode ('social' | 'sensual' | 'porn')
 * @returns Filtered array of reference images
 */
export function filterReferenceImagesByMode(
    images: ReferenceImage[],
    contentMode: ContentMode
): ReferenceImage[] {
    // In porn mode, allow all image types
    if (contentMode === 'porn') {
        return images;
    }

    // In social and sensual modes, exclude explicit images (boobs, pussy)
    const allowedTypes = ['face', 'body', 'edit'];
    return images.filter(img => allowedTypes.includes(img.image_type));
}
