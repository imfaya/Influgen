// Utility to get user's Wavespeed API key from their profile
// Falls back to environment variable if user key is not configured

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Get the Wavespeed API key for the current user from an API route.
 * Falls back to environment variable if user has no key configured.
 * 
 * @returns The API key to use, or null if none available
 */
export async function getUserApiKey(): Promise<string | null> {
    try {
        // Get the session cookie from Next.js
        const cookieStore = await cookies();

        // Supabase stores session in sb-<project-ref>-auth-token cookie
        // We need to check for the auth token cookie
        const allCookies = cookieStore.getAll();

        // Find the Supabase auth token cookie
        const authCookie = allCookies.find(c => c.name.includes('-auth-token'));

        if (!authCookie) {
            console.log('[getUserApiKey] No auth cookie found, using env fallback');
            return process.env.WAVESPEED_API_KEY || null;
        }

        // Parse the cookie value (it's a JSON array with access_token and refresh_token)
        let accessToken: string | null = null;
        try {
            // The cookie is URL encoded and contains a JSON array
            const decoded = decodeURIComponent(authCookie.value);
            // Handle both array format and base64 format
            if (decoded.startsWith('[')) {
                const parsed = JSON.parse(decoded);
                accessToken = parsed[0]; // First element is access_token
            } else if (decoded.startsWith('base64-')) {
                // base64 encoded format
                const base64Data = decoded.replace('base64-', '');
                const jsonData = Buffer.from(base64Data, 'base64').toString('utf-8');
                const parsed = JSON.parse(jsonData);
                accessToken = parsed.access_token;
            }
        } catch (e) {
            console.error('[getUserApiKey] Failed to parse auth cookie:', e);
            return process.env.WAVESPEED_API_KEY || null;
        }

        if (!accessToken) {
            console.log('[getUserApiKey] No access token in cookie, using env fallback');
            return process.env.WAVESPEED_API_KEY || null;
        }

        // Create Supabase client and get user
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

        if (authError || !user) {
            console.log('[getUserApiKey] Auth error or no user, using env fallback');
            return process.env.WAVESPEED_API_KEY || null;
        }

        // Get user's API key from profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('wavespeed_api_key')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('[getUserApiKey] Profile fetch error:', profileError);
            return process.env.WAVESPEED_API_KEY || null;
        }

        // Return user's key if configured, otherwise fallback
        if (profile?.wavespeed_api_key) {
            console.log('[getUserApiKey] Using user-specific API key');
            return profile.wavespeed_api_key;
        }

        console.log('[getUserApiKey] No user key configured, using env fallback');
        return process.env.WAVESPEED_API_KEY || null;

    } catch (error) {
        console.error('[getUserApiKey] Error:', error);
        return process.env.WAVESPEED_API_KEY || null;
    }
}

/**
 * Check if the current user has configured their own API key
 */
export async function hasUserApiKey(): Promise<boolean> {
    const key = await getUserApiKey();
    // If key equals env var, user doesn't have their own key
    return key !== null && key !== process.env.WAVESPEED_API_KEY;
}
