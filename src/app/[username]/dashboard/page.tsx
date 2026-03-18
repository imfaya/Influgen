'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { supabaseAuth } from '@/lib/supabase-auth';
import { useGenerationStore } from '@/store';
import { Influencer, ContentMode } from '@/types';
import { INFLUENCERS } from '@/lib/constants';
import { Loader2, Plus, Settings, LogOut, User, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { BatchGenerateModal } from '@/components/dashboard/BatchGenerateModal';
import { UserSettingsModal } from '@/components/dashboard/UserSettingsModal';
import { WavespeedBalance } from '@/components/dashboard/WavespeedBalance';
import { toast } from 'sonner';

interface InfluencerWithDB {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    base_prompt: string | null;
    thumbnail_url: string | null;
    avatar_url: string | null;
    created_at: string;
}

export default function UserDashboard() {
    const router = useRouter();
    const params = useParams();
    const username = params.username as string;
    const { user, profile, signOut, loading: authLoading } = useAuth();



    // Global Store State
    const {
        setSelectedInfluencer,
        influencerStatus,
        influencers: storeInfluencers,
        loadUserData
    } = useGenerationStore();

    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [isBatchGenerating, setIsBatchGenerating] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Debug logging
    useEffect(() => {
        console.log('[Dashboard] Auth state:', {
            authLoading,
            hasUser: !!user,
            hasProfile: !!profile,
            profileUsername: profile?.username,
            urlUsername: username
        });
    }, [authLoading, user, profile, username]);

    // Authentication check - redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            console.log('[Dashboard] No user, redirecting to login');
            router.replace('/auth/login');
        }
    }, [authLoading, user, router]);

    // Check if this is the correct user's dashboard
    useEffect(() => {
        if (!authLoading && profile && profile.username !== username) {
            console.log('[Dashboard] Wrong username, redirecting to:', profile.username);
            router.replace(`/${profile.username}/dashboard`);
        }
    }, [authLoading, profile, username, router]);

    // Check if user has API key configured - redirect to onboarding if not
    useEffect(() => {
        if (!authLoading && profile && !profile.wavespeed_api_key) {
            console.log('[Dashboard] No API key configured, redirecting to onboarding');
            router.replace(`/onboarding/api-key-setup?username=${profile.username}`);
        }
    }, [authLoading, profile, router]);

    // Load User Data (Sync with Supabase)
    useEffect(() => {
        if (!authLoading && profile?.id) {
            loadUserData(profile.id);
        }
    }, [authLoading, profile, loadUserData]);

    const handleSelectInfluencer = (inf: Influencer) => {
        setSelectedInfluencer(inf);
        router.push(`/${username}/${inf.slug}`);
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/auth/login');
    };

    // Get active influencers for batch generation
    const getActiveInfluencers = useCallback((): Influencer[] => {
        return storeInfluencers.filter(inf => influencerStatus[inf.id] !== false);
    }, [storeInfluencers, influencerStatus]);

    // Handle batch generation
    const handleStartBatch = useCallback(async (modes: ContentMode[], imagesPerInfluencer: number) => {
        setIsBatchGenerating(true);
        setIsBatchModalOpen(false);

        const activeInfluencers = getActiveInfluencers();
        console.log('[Dashboard] Starting batch generation:', {
            influencers: activeInfluencers.map(i => i.name),
            modes,
            imagesPerInfluencer
        });

        // Import and use the batch generation hook dynamically
        const { generateMultiInfluencerBatch } = await import('@/lib/batchGeneration');

        try {
            toast.success("Batch generation started!", {
                description: `Launching tasks for ${activeInfluencers.length} influencers...`
            });

            await generateMultiInfluencerBatch(activeInfluencers, modes, imagesPerInfluencer);
        } catch (error) {
            console.error('[Dashboard] Batch generation error:', error);
            toast.error("Failed to start batch generation");
        } finally {
            setIsBatchGenerating(false);
        }
    }, [getActiveInfluencers]);

    // Show loading while auth is initializing
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            </div>
        );
    }

    // User not authenticated - will redirect via useEffect
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            </div>
        );
    }

    // Profile is missing - show error
    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Profile not found. Please try logging out and back in.</p>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    // Loading influencers
    if (storeInfluencers.length === 0 && !authLoading) {
        // Optional: Show loading state if waiting for sync, 
        // but since store might initially have Lyra, we might not block here.
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            {/* Header */}
            <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={`/${profile.username}/dashboard`} className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                                InfluGen
                            </Link>
                            <span className="text-zinc-600">/</span>
                            <span className="text-zinc-300 font-medium">{profile.display_name || username}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Wavespeed Balance */}
                            <WavespeedBalance />

                            {/* Calendar Button */}
                            <Link
                                href={`/${profile.username}/scheduler`}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-all duration-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                                <span className="text-sm">Calendar</span>
                            </Link>

                            {/* BATCH Button */}
                            <button
                                onClick={() => setIsBatchModalOpen(true)}
                                disabled={isBatchGenerating}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-violet-500/25 disabled:opacity-50"
                            >
                                {isBatchGenerating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Zap className="w-4 h-4" />
                                )}
                                <span className="text-sm">BATCH</span>
                            </button>
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Your Influencers</h1>
                    <p className="text-zinc-400">Create and manage your AI influencer personas</p>
                </div>

                {/* Influencer Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Create New Card */}
                    <Link
                        href={`/${username}/new`}
                        className="group relative aspect-[3/4] rounded-2xl border-2 border-dashed border-zinc-700 hover:border-violet-500/50 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all duration-300 flex flex-col items-center justify-center gap-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-medium">Create New</p>
                            <p className="text-zinc-500 text-sm">Add an influencer</p>
                        </div>
                    </Link>

                    {/* Existing Influencers */}
                    {storeInfluencers.map((inf) => (
                        <button
                            key={inf.id}
                            onClick={() => handleSelectInfluencer(inf)}
                            className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 hover:ring-2 hover:ring-violet-500/50 transition-all duration-300"
                        >
                            {/* Thumbnail */}
                            {inf.thumbnail ? (
                                <Image
                                    src={inf.thumbnail}
                                    alt={inf.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                    <User className="w-20 h-20 text-zinc-700" />
                                </div>
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="text-white font-semibold text-lg mb-1">{inf.name}</h3>
                                {inf.description && (
                                    <p className="text-zinc-400 text-sm line-clamp-2">{inf.description}</p>
                                )}
                            </div>

                            {/* Hover indicator */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-10 h-10 rounded-full bg-violet-500/90 backdrop-blur-sm flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Empty State */}
                {storeInfluencers.length === 0 && (
                    <div className="text-center py-20">
                        <User className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-400">Create your first AI influencer to get started</p>
                    </div>
                )}
            </main>

            {/* Batch Generation Modal */}
            <BatchGenerateModal
                isOpen={isBatchModalOpen}
                onClose={() => setIsBatchModalOpen(false)}
                activeInfluencers={getActiveInfluencers()}
                onStartBatch={handleStartBatch}
                isGenerating={isBatchGenerating}
            />

            {/* User Settings Modal */}
            <UserSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
}
