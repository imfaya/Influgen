// Supabase Auth wrapper for InfluGen

import { createClient, User, Session, AuthError } from '@supabase/supabase-js';

// Types
export interface Profile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    wavespeed_api_key: string | null;
    created_at: string;
    updated_at: string;
}

export interface AuthState {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
}

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

// Auth functions
export async function signUp(
    email: string,
    password: string,
    username: string,
    displayName?: string
): Promise<{ user: User | null; error: AuthError | null }> {
    // First check if username is available
    const { data: existingProfile } = await supabaseAuth
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

    if (existingProfile) {
        return {
            user: null,
            error: {
                message: 'Username already taken',
                status: 400,
                name: 'AuthError',
            } as AuthError,
        };
    }

    const { data, error } = await supabaseAuth.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                display_name: displayName || username,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
    });

    return { user: data.user, error };
}

export async function signIn(
    email: string,
    password: string
): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password,
    });

    return { user: data.user, session: data.session, error };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabaseAuth.auth.signOut();
    return { error };
}

export async function getUser(): Promise<User | null> {
    const { data: { user } } = await supabaseAuth.auth.getUser();
    return user;
}

export async function getSession(): Promise<Session | null> {
    const { data: { session } } = await supabaseAuth.auth.getSession();
    return session;
}

export async function getProfile(userId: string): Promise<Profile | null> {
    console.log('[getProfile] Querying profile for userId:', userId);

    try {
        // Add a timeout to prevent hanging - 10s for slow connections
        // Resolves with null data (no error) so app continues gracefully
        const timeoutPromise = new Promise<{ data: null; error: null }>((resolve) => {
            setTimeout(() => {
                console.warn('[getProfile] Timeout after 10s - continuing with optimistic profile');
                resolve({ data: null, error: null });
            }, 10000);
        });

        const queryPromise = supabaseAuth
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        const result = await Promise.race([queryPromise, timeoutPromise]);

        // Handle timeout case (no error, no data)
        if (result.data === null && result.error === null) {
            return null;
        }

        if (result.error) {
            console.error('[getProfile] Error:', result.error);
            return null;
        }

        console.log('[getProfile] Query result:', { hasData: !!result.data });
        return result.data;
    } catch (err) {
        console.error('[getProfile] Exception:', err);
        return null;
    }
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabaseAuth
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (error) {
        console.error('Error fetching profile by username:', error);
        return null;
    }

    return data;
}

export async function updateProfile(
    userId: string,
    updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>
): Promise<{ error: Error | null }> {
    const { error } = await supabaseAuth
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);

    return { error };
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
    console.log('Checking username availability:', username);
    const { data, error } = await supabaseAuth
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows

    console.log('Username check result:', { data, error });

    // If there's a permission error, assume available (new user can't read profiles yet)
    if (error && error.code === 'PGRST116') {
        // No rows found - username is available
        return true;
    }

    if (error) {
        console.error('Username check error:', error);
        // On error, return true to allow signup attempt
        return true;
    }

    // If data is null, username is available
    return !data;
}

// Auth state listener
export function onAuthStateChange(
    callback: (event: string, session: Session | null) => void
) {
    return supabaseAuth.auth.onAuthStateChange(callback);
}

// Resend confirmation email
export async function resendConfirmation(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabaseAuth.auth.resend({
        type: 'signup',
        email,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
    });
    return { error };
}

// Reset password
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
}
