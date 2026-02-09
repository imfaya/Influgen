'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthContext';
import { supabaseAuth } from '@/lib/supabase-auth';
import { Loader2, Eye, EyeOff, Mail, Lock, LogIn, RefreshCw } from 'lucide-react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn, loading: authLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const redirectTo = searchParams.get('redirect') || null;
    const confirmed = searchParams.get('confirmed') === 'true';
    const errorParam = searchParams.get('error');

    // Clear stuck session
    const handleClearSession = async () => {
        await supabaseAuth.auth.signOut();
        // Clear Supabase localStorage entries
        const keysToRemove = Object.keys(localStorage).filter(key =>
            key.startsWith('sb-') || key.includes('supabase')
        );
        keysToRemove.forEach(key => localStorage.removeItem(key));
        window.location.reload();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            console.log('Attempting login with:', email);
            const { error: signInError } = await signIn(email, password);
            console.log('Login result - error:', signInError);

            if (signInError) {
                if (signInError.message.includes('Email not confirmed')) {
                    setError('Please verify your email address before logging in.');
                } else if (signInError.message.includes('Invalid login credentials')) {
                    setError('Invalid email or password.');
                } else {
                    setError(signInError.message);
                }
                return;
            }

            // Redirect after successful login
            if (redirectTo) {
                router.push(redirectTo);
            } else {
                // Get the profile to redirect to their dashboard
                try {
                    const { data: { user } } = await supabaseAuth.auth.getUser();
                    if (user) {
                        const { data: profile } = await supabaseAuth
                            .from('profiles')
                            .select('username')
                            .eq('id', user.id)
                            .single();

                        if (profile?.username) {
                            console.log('Redirecting to dashboard:', profile.username);
                            router.push(`/${profile.username}/dashboard`);
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Error fetching profile for redirect:', e);
                }

                // Fallback if profile fetch fails
                router.push('/');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4">
            <div className="w-full max-w-md">
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        InfluGen
                    </h1>
                    <p className="text-zinc-400 mt-2">Welcome back! Sign in to continue.</p>
                </div>

                {/* Confirmation message */}
                {confirmed && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                        <p>✓ Email verified successfully! You can now log in.</p>
                    </div>
                )}

                {/* Error from URL param */}
                {errorParam && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {decodeURIComponent(errorParam)}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Email field */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password field */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-11 pr-12 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading || authLoading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
                    >
                        {loading || authLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                Sign In
                            </>
                        )}
                    </button>

                    {/* Forgot password link */}
                    <div className="mt-4 text-center">
                        <Link
                            href="/auth/forgot-password"
                            className="text-sm text-zinc-400 hover:text-violet-400 transition-colors"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                </form>

                {/* Register link */}
                <div className="mt-6 text-center">
                    <p className="text-zinc-400">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/auth/register"
                            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                        >
                            Create one
                        </Link>
                    </p>
                </div>

                {/* Reset session if stuck */}
                {authLoading && (
                    <div className="mt-4 text-center">
                        <p className="text-xs text-zinc-500 mb-2">Taking too long?</p>
                        <button
                            onClick={handleClearSession}
                            className="text-sm text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 mx-auto underline"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Clear session and retry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
