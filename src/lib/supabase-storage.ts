'use client';

// Supabase Storage utilities for uploading images
// Images are stored in the 'reference-images' bucket

import { supabaseAuth } from '@/lib/supabase-auth';

const BUCKET_NAME = 'reference-images';

export interface UploadResult {
    url: string;
    path: string;
    error?: string;
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param folder - The folder path (e.g., 'influencer-id/face')
 * @param fileName - Optional custom filename
 */
export async function uploadToStorage(
    file: File,
    folder: string,
    fileName?: string
): Promise<UploadResult> {
    try {
        // Generate unique filename if not provided
        const timestamp = Date.now();
        const ext = file.name.split('.').pop() || 'png';
        const name = fileName || `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const path = `${folder}/${name}`;

        // Upload to Supabase Storage
        const { data, error } = await supabaseAuth.storage
            .from(BUCKET_NAME)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Storage upload error:', error);
            return { url: '', path: '', error: error.message };
        }

        // Get public URL
        const { data: urlData } = supabaseAuth.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        return {
            url: urlData.publicUrl,
            path: data.path
        };
    } catch (err) {
        console.error('Upload failed:', err);
        return { url: '', path: '', error: 'Upload failed' };
    }
}

/**
 * Upload a reference image for an influencer
 */
export async function uploadReferenceImage(
    file: File,
    influencerId: string,
    imageType: 'face' | 'body' | 'boobs' | 'pussy'
): Promise<UploadResult> {
    return uploadToStorage(file, `${influencerId}/${imageType}`);
}

/**
 * Upload a thumbnail image for an influencer
 */
export async function uploadThumbnail(
    file: File,
    influencerId: string
): Promise<UploadResult> {
    return uploadToStorage(file, `${influencerId}/thumbnail`, 'avatar');
}

/**
 * Convert a base64 data URL to a File object
 */
export function dataUrlToFile(dataUrl: string, fileName: string): File | null {
    try {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], fileName, { type: mime });
    } catch {
        return null;
    }
}

/**
 * Upload a base64 image to storage
 */
export async function uploadBase64Image(
    dataUrl: string,
    folder: string,
    fileName?: string
): Promise<UploadResult> {
    const file = dataUrlToFile(dataUrl, fileName || 'image.png');
    if (!file) {
        return { url: '', path: '', error: 'Invalid base64 data' };
    }
    return uploadToStorage(file, folder, fileName);
}
