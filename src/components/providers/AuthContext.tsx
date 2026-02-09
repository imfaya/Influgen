'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
    supabaseAuth,
    signIn as authSignIn,
    signUp as authSignUp,
    signOut as authSignOut,
    getProfile,
    Profile,
    checkUsernameAvailable,
} from '@/lib/supabase-auth';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, username: string, displayName?: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
    signOut: () => Promise<void>;
    checkUsername: (username: string) => Promise<boolean>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const initializedRef = useRef(false);

    const fetchProfile = useCallback(async (user: User) => {
        const userId = user.id;
        const metadata = user.user_metadata;

        console.log('[Auth] Fetching profile for user:', userId);

        // OPTIMISTIC UPDATE: Use metadata if available to unblock UI immediately
        if (metadata && metadata.username) {
            console.log('[Auth] Using metadata for immediate profile');
            setProfile(prev => {
                // If we already have a profile for this user, keep their API key
                // This prevents the UI from flickering back to "setup" state while loading
                const existingKey = (prev?.id === userId) ? prev.wavespeed_api_key : null;

                return {
                    id: userId,
                    username: metadata.username,
                    display_name: metadata.display_name || metadata.username,
                    avatar_url: metadata.avatar_url || null,
                    wavespeed_api_key: existingKey,
                    created_at: new Date().toISOString(), // fake date
                    updated_at: new Date().toISOString(), // fake date
                };
            });
        }

        try {
            const userProfile = await getProfile(userId);
            console.log('[Auth] Profile result:', userProfile);

            if (userProfile) {
                setProfile(userProfile);
            }
            // If DB fetch fails/timeouts but we have optimistic profile, we keep it!
        } catch (error) {
            console.error('[Auth] Error fetching profile:', error);
            // Only clear profile if we strictly need to, otherwise keep optimistic
            setProfile(prev => prev || null);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        // Timeout failsafe - ensure loading is set to false after 15 seconds max
        const timeoutId = setTimeout(() => {
            if (mounted && !initializedRef.current) {
                console.warn('Auth init timeout - forcing loading to false');
                setLoading(false);
                initializedRef.current = true;
            }
        }, 15000);

        // Check active session on mount
        const initAuth = async () => {
            console.log('Initializing Supabase auth...');
            try {
                const { data: { session: activeSession }, error } = await supabaseAuth.auth.getSession();

                if (error) {
                    console.error('getSession error:', error);
                }

                if (!mounted) return;

                console.log('Session result:', activeSession ? 'has session' : 'no session');
                setSession(activeSession);
                const currentUser = activeSession?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    await fetchProfile(currentUser);
                }
            } catch (error) {
                console.error('Auth init error:', error);
                if (!mounted) return;
                // Clear any stale session data
                setUser(null);
                setProfile(null);
                setSession(null);
            } finally {
                if (mounted) {
                    console.log('Auth init complete, setting loading to false');
                    setLoading(false);
                    initializedRef.current = true;
                }
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('Auth state change:', event);
                if (!mounted) return;

                setSession(newSession);
                const newUser = newSession?.user ?? null;
                setUser(newUser);

                if (newUser) {
                    await fetchProfile(newUser);
                } else {
                    setProfile(null);
                }

                // Only set loading to false if we're already initialized
                if (initializedRef.current) {
                    setLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        const { error } = await authSignIn(email, password);
        setLoading(false);
        return { error };
    };

    const signUp = async (
        email: string,
        password: string,
        username: string,
        displayName?: string
    ) => {
        setLoading(true);
        const { user: newUser, error } = await authSignUp(email, password, username, displayName);
        setLoading(false);

        if (error) {
            return { error };
        }

        // If email confirmation is required, user won't be logged in yet
        if (newUser && !newUser.confirmed_at) {
            return { error: null, needsConfirmation: true };
        }

        return { error: null };
    };

    const signOut = async () => {
        setLoading(true);
        await authSignOut();
        setUser(null);
        setProfile(null);
        setSession(null);
        setLoading(false);
    };

    const checkUsername = async (username: string) => {
        return checkUsernameAvailable(username);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                session,
                loading,
                signIn,
                signUp,
                signOut,
                checkUsername,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Hook for requiring authentication
export function useRequireAuth(redirectTo = '/auth/login') {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            window.location.href = redirectTo;
        }
    }, [user, loading, redirectTo]);

    return { user, loading };
}
