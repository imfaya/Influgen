'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { supabaseAuth } from '@/lib/supabase-auth';
import { Loader2, Key, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function ApiKeySetupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, profile, loading: authLoading, refreshProfile } = useAuth(); // Import refreshProfile

    const [apiKey, setApiKey] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/auth/login');
        }
    }, [authLoading, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!apiKey.trim()) {
            setError('Veuillez entrer votre clé API');
            return;
        }

        if (!user) {
            setError('Session expirée. Veuillez vous reconnecter.');
            return;
        }

        setSaving(true);

        try {
            const { error: updateError } = await supabaseAuth
                .from('profiles')
                .update({
                    wavespeed_api_key: apiKey.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error saving API key:', updateError);
                setError(updateError.message);
                return;
            }

            // Force refresh profile to get the new API key in AuthContext
            await refreshProfile();

            // Redirect to dashboard
            const username = profile?.username || searchParams.get('username');
            if (username) {
                router.push(`/${username}/dashboard`);
            } else {
                router.push('/');
            }
        } catch (err) {
            console.error('Failed to save API key:', err);
            setError('Une erreur inattendue est survenue.');
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        const username = profile?.username || searchParams.get('username');
        if (username) {
            router.push(`/${username}/dashboard`);
        } else {
            router.push('/');
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-12">
            <div className="w-full max-w-lg">
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center">
                        <Key className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">
                        Configurez votre clé API
                    </h1>
                    <p className="text-zinc-400 max-w-md mx-auto">
                        Pour générer des images, vous devez configurer votre propre clé API Wavespeed.
                        Cela garantit que vos générations sont privées et que vous contrôlez vos coûts.
                    </p>
                </div>

                {/* Setup Form */}
                <form onSubmit={handleSubmit} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                    {/* Error message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Info box */}
                    <div className="mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
                        <h3 className="text-violet-400 font-medium mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Comment obtenir une clé API ?
                        </h3>
                        <ol className="text-zinc-400 text-sm space-y-2">
                            <li>1. Créez un compte sur <a
                                href="https://wavespeed.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
                            >
                                wavespeed.ai <ExternalLink className="w-3 h-3" />
                            </a></li>
                            <li>2. Allez dans les paramètres de votre compte</li>
                            <li>3. Copiez votre clé API</li>
                        </ol>
                    </div>

                    {/* API Key field */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Clé API Wavespeed
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="wsk_..."
                                className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Sauvegarde...
                            </>
                        ) : (
                            <>
                                Commencer
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ApiKeySetupPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                </div>
            }
        >
            <ApiKeySetupContent />
        </Suspense>
    );
}
