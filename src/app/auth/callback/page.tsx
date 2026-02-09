'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase-auth';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            if (error) {
                console.error('Auth callback error:', error, errorDescription);
                router.push(`/auth/login?error=${encodeURIComponent(errorDescription || error)}`);
                return;
            }

            if (code) {
                try {
                    const { data, error: exchangeError } = await supabaseAuth.auth.exchangeCodeForSession(code);

                    if (exchangeError) {
                        console.error('Session exchange error:', exchangeError);
                        router.push('/auth/login?error=Could not verify email');
                        return;
                    }

                    if (data.session) {
                        // Get user profile to redirect to their dashboard
                        const { data: profile } = await supabaseAuth
                            .from('profiles')
                            .select('username')
                            .eq('id', data.session.user.id)
                            .single();

                        if (profile?.username) {
                            router.push(`/${profile.username}`);
                        } else {
                            router.push('/');
                        }
                    } else {
                        // Email confirmed but session not established
                        router.push('/auth/login?confirmed=true');
                    }
                } catch (err) {
                    console.error('Callback processing error:', err);
                    router.push('/auth/login?error=Verification failed');
                }
            } else {
                // No code, redirect to login
                router.push('/auth/login');
            }
        };

        handleCallback();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                <p className="text-zinc-400">Verifying your account...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400">Loading...</p>
                    </div>
                </div>
            }
        >
            <AuthCallbackContent />
        </Suspense>
    );
}
