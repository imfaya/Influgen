/**
 * Utility for image transformations using Supabase Storage API
 */

export interface ImageOptions {
    width?: number;
    height?: number;
    quality?: number;
    resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Transforms a Supabase Storage URL into a thumbnail/preview URL
 * using Supabase's built-in image transformation service.
 * 
 * @param url The original image URL
 * @param options Transformation options
 * @returns The transformed URL or original if transformation is not possible
 */
export function getThumbnailUrl(url: string, options: ImageOptions = {}): string {
    if (!url) return '';

    // Default options
    const { width = 400, quality = 80, resize = 'cover' } = options;

    // Check if it's a Supabase URL
    // Format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
    if (url.includes('.supabase.co/storage/v1/object/public/')) {
        // Supabase provides an 'render/image/authenticated' endpoint for transformations
        // but for public buckets, we can use the 'render/image/public' endpoint.

        // URL needs to be transformed from:
        // .../storage/v1/object/public/[bucket]/[path]
        // to:
        // .../storage/v1/render/image/public/[bucket]/[path]?width=[w]&quality=[q]&resize=[r]

        const transformedUrl = url.replace(
            '/storage/v1/object/public/',
            '/storage/v1/render/image/public/'
        );

        const params = new URLSearchParams();
        params.append('width', width.toString());
        params.append('quality', quality.toString());
        params.append('resize', resize);
        if (options.height) params.append('height', options.height.toString());

        return `${transformedUrl}?${params.toString()}`;
    }

    // If it's not a Supabase URL, we can't easily transform it here
    // In a real staging/prod env, we might use a proxy or Cloudinary
    return url;
}
