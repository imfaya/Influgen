'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthContext';
import { Loader2, Eye, EyeOff, Mail, Lock, User, UserPlus, Check, X } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const { signUp, checkUsername, loading: authLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Username validation
    const [usernameChecking, setUsernameChecking] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);

    // Debounced username check
    const checkUsernameAvailability = useCallback(
        async (value: string) => {
            if (!value || value.length < 3) {
                setUsernameAvailable(null);
                setUsernameError(value ? 'Username must be at least 3 characters' : null);
                return;
            }

            // Validate format
            const validFormat = /^[a-zA-Z0-9_-]{3,30}$/.test(value);
            if (!validFormat) {
                setUsernameAvailable(false);
                setUsernameError('Only letters, numbers, - and _ allowed');
                return;
            }

            setUsernameChecking(true);
            setUsernameError(null);

            try {
                const available = await checkUsername(value);
                setUsernameAvailable(available);
                if (!available) {
                    setUsernameError('Username is already taken');
                }
            } catch (err) {
                console.error('Username check failed:', err);
                // If check fails, allow signup attempt - server will validate
                setUsernameAvailable(true);
                setUsernameError(null);
            } finally {
                setUsernameChecking(false);
            }
        },
        [checkUsername]
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            if (username) {
                checkUsernameAvailability(username);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username, checkUsernameAvailability]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validations
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!usernameAvailable) {
            setError('Please choose a valid username');
            return;
        }

        setLoading(true);

        try {
            const { error: signUpError } = await signUp(
                email,
                password,
                username,
                displayName || username
            );

            if (signUpError) {
                setError(signUpError.message);
                return;
            }

            // Redirect to API key setup after signup
            router.push(`/onboarding/api-key-setup?username=${username}`);
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (showConfirmation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
                        <p className="text-zinc-400 mb-6">
                            We've sent a verification link to <span className="text-white font-medium">{email}</span>.
                            Please click the link to activate your account.
                        </p>
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors"
                        >
                            Return to login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        InfluGen
                    </h1>
                    <p className="text-zinc-400 mt-2">Create your account to get started.</p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Username field */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Username
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="imfaya"
                                required
                                className={`w-full pl-11 pr-12 py-3 bg-zinc-800/50 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${usernameAvailable === true
                                    ? 'border-emerald-500/50 focus:ring-emerald-500/50'
                                    : usernameAvailable === false
                                        ? 'border-red-500/50 focus:ring-red-500/50'
                                        : 'border-zinc-700 focus:ring-violet-500/50 focus:border-violet-500'
                                    }`}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {usernameChecking ? (
                                    <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                                ) : usernameAvailable === true ? (
                                    <Check className="w-5 h-5 text-emerald-500" />
                                ) : usernameAvailable === false ? (
                                    <X className="w-5 h-5 text-red-500" />
                                ) : null}
                            </div>
                        </div>
                        {usernameError && (
                            <p className="mt-1.5 text-xs text-red-400">{usernameError}</p>
                        )}
                        <p className="mt-1.5 text-xs text-zinc-500">
                            Your profile URL: influgen.app/<span className="text-violet-400">{username || 'username'}</span>
                        </p>
                    </div>

                    {/* Display Name field */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Display Name <span className="text-zinc-500">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder={username || 'Your display name'}
                            className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                        />
                    </div>

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
                    <div className="mb-5">
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
                                minLength={6}
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

                    {/* Confirm Password field */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className={`w-full pl-11 pr-4 py-3 bg-zinc-800/50 border rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${confirmPassword && confirmPassword !== password
                                    ? 'border-red-500/50 focus:ring-red-500/50'
                                    : 'border-zinc-700 focus:ring-violet-500/50 focus:border-violet-500'
                                    }`}
                            />
                        </div>
                        {confirmPassword && confirmPassword !== password && (
                            <p className="mt-1.5 text-xs text-red-400">Passwords do not match</p>
                        )}
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading || authLoading || !usernameAvailable}
                        className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
                    >
                        {loading || authLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                {/* Login link */}
                <div className="mt-6 text-center">
                    <p className="text-zinc-400">
                        Already have an account?{' '}
                        <Link
                            href="/auth/login"
                            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
