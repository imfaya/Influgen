
import { getSupabase } from './supabase';
import { toast } from 'sonner';

import { ContentMode } from '@/types';

export const uploadToDrive = async (imageUrl: string, mode: ContentMode, date: Date = new Date()) => {
    const client = getSupabase();
    if (!client) {
        // Fallback if client not initialized
        console.error('Supabase client not initialized');
        throw new Error('Supabase client not initialized');
    }

    try {
        // 1. Fetch the image blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // 2. Generate path: mode/YYYY-MM-DD/timestamp-filename.png
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const timestamp = date.getTime();
        const filename = `influgen-${timestamp}.png`;

        const path = `${mode}/${year}-${month}-${day}/${filename}`;

        // 3. Upload to Supabase Storage
        const { data, error } = await client.storage
            .from('user-drive')
            .upload(path, blob, {
                contentType: 'image/png',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Failed to upload to drive:', error);
        throw error;
    }
};

export const getDriveFiles = async (path: string = '') => {
    const client = getSupabase();
    if (!client) return [];

    const { data, error } = await client.storage
        .from('user-drive')
        .list(path, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'desc' },
        });

    if (error) {
        throw error;
    }

    return data;
};
