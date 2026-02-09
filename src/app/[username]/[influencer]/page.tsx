'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { useGenerationStore } from '@/store';
import { InfluencerWorkspace } from '@/components/workspace/InfluencerWorkspace';
import { FluidBackground } from '@/components/ui/FluidBackground';
import { Loader2 } from 'lucide-react';

export default function InfluencerWorkspacePage() {
    const router = useRouter();
    const params = useParams();
    const username = params.username as string;
    const influencerSlug = params.influencer as string;
    const { user, profile, loading: authLoading } = useAuth();

    const [error, setError] = useState<string | null>(null);

    // Subscribe to store reactively
    const storeInfluencers = useGenerationStore(state => state.influencers);
    const selectedInfluencer = useGenerationStore(state => state.selectedInfluencer);
    const setSelectedInfluencer = useGenerationStore(state => state.setSelectedInfluencer);

    // Find matching influencer from store
    const matchingInfluencer = useMemo(() => {
        return storeInfluencers.find(inf => inf.slug === influencerSlug);
    }, [storeInfluencers, influencerSlug]);

    // Check if the correct influencer is already selected
    const isCorrectInfluencerSelected = useMemo(() => {
        return selectedInfluencer?.slug === influencerSlug;
    }, [selectedInfluencer, influencerSlug]);

    // Authentication check
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/auth/login');
        }
    }, [authLoading, user, router]);

    // Username check
    useEffect(() => {
        if (!authLoading && profile && profile.username !== username) {
            router.replace(`/${profile.username}/dashboard`);
        }
    }, [authLoading, profile, username, router]);

    // Select the matching influencer when found
    useEffect(() => {
        if (matchingInfluencer && !isCorrectInfluencerSelected) {
            console.log('[InfluencerWorkspace] Selecting influencer from store:', matchingInfluencer.name);
            setSelectedInfluencer(matchingInfluencer);
        }
    }, [matchingInfluencer, isCorrectInfluencerSelected, setSelectedInfluencer]);

    // Handle not found after store is loaded
    useEffect(() => {
        // Only check if profile is loaded, auth is done, store has data, and no matching influencer
        if (!authLoading && profile && storeInfluencers.length > 0 && !matchingInfluencer && !isCorrectInfluencerSelected) {
            console.warn('[InfluencerWorkspace] Influencer not found in store:', influencerSlug);

            // TRY RE-SYNCING once before giving up
            // This handles cases where we redirected before the store was fully up to date
            const retrySync = async () => {
                console.log('[InfluencerWorkspace] Retrying user data sync...');
                const success = await useGenerationStore.getState().loadUserData(profile.id);
                if (!success) {
                    setError('Influencer not found');
                }
            };

            retrySync();
        }
    }, [authLoading, profile, storeInfluencers, matchingInfluencer, isCorrectInfluencerSelected, influencerSlug]);

    const handleBack = () => {
        router.push(`/${username}/dashboard`);
    };

    // Show loading while auth initializes or store is empty (still syncing)
    const isLoading = authLoading || !profile || (storeInfluencers.length === 0 && !error);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400">Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => router.push(`/${username}/dashboard`)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                        Back to dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Wait for correct influencer to be selected
    if (!isCorrectInfluencerSelected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400">Preparing workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative">
            <FluidBackground />
            <InfluencerWorkspace onBack={handleBack} />
        </div>
    );
}
