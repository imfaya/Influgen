// Supabase client configuration

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// Lazy initialization to avoid build-time errors
export const getSupabase = (): SupabaseClient | null => {
    if (typeof window === 'undefined') {
        // Server-side: check if we have valid config
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key || url === 'your_supabase_project_url') {
            return null;
        }

        return createClient(url, key);
    }

    // Client-side: use singleton
    if (!supabaseInstance) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        if (!url || !key || url === 'your_supabase_project_url') {
            console.warn('[Supabase] Missing or invalid configuration:', {
                hasUrl: !!url,
                hasKey: !!key,
                isDefaultUrl: url === 'your_supabase_project_url'
            });
            return null;
        }

        supabaseInstance = createClient(url, key);
    }

    return supabaseInstance;
};

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    return Boolean(
        url &&
        key &&
        url !== 'your_supabase_project_url' &&
        key !== 'your_supabase_anon_key'
    );
};

// For backward compatibility
// Mock builder for chaining
const createMockBuilder = () => {
    const builder: any = {
        select: () => builder,
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => builder,
        eq: () => builder,
        single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    };
    return builder;
};

export const supabase = {
    from: (table: string) => {
        const client = getSupabase();
        if (!client) {
            return createMockBuilder();
        }
        return client.from(table);
    },
};
