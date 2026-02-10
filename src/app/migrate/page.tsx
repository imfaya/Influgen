'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthContext';
import { supabaseAuth } from '@/lib/supabase-auth';
import { useGenerationStore } from '@/store';
import { Loader2, Check, AlertTriangle, ArrowRight, Database, Users, Image } from 'lucide-react';
import { toast } from 'sonner';

interface MigrationStats {
    influencers: number;
    generations: number;
    referenceImages: number;
}

export default function MigratePage() {
    const { user, profile, loading: authLoading } = useAuth();
    const [migrating, setMigrating] = useState(false);
    const [migrated, setMigrated] = useState(false);
    const [stats, setStats] = useState<MigrationStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    const {
        generations,
        referenceImagesByInfluencer,
        customBasePrompts,
        influencerPrompts,
        selectedInfluencer,
        setGenerations,
    } = useGenerationStore();

    // Load generations from Supabase after migration
    const loadGenerationsFromSupabase = async () => {
        if (!profile) return;

        try {
            // First get all influencers for this user
            const { data: influencers, error: infError } = await supabaseAuth
                .from('influencers')
                .select('id, name')
                .eq('user_id', profile.id);

            if (infError || !influencers) return;

            // Build a map of influencer_id -> name
            const influencerMap = new Map<string, string>();
            for (const inf of influencers) {
                influencerMap.set(inf.id, inf.name);
            }

            // Get all generations for user's influencers
            const influencerIds = influencers.map(i => i.id);
            const { data: dbGenerations, error: genError } = await supabaseAuth
                .from('generations')
                .select('*')
                .in('influencer_id', influencerIds)
                .order('created_at', { ascending: false });

            if (genError || !dbGenerations) return;

            // Transform to local format
            const localGenerations = dbGenerations.map(gen => ({
                id: gen.id,
                influencer_id: gen.influencer_id, // Add missing field
                influencer_name: influencerMap.get(gen.influencer_id) || 'Unknown',
                prompt: gen.prompt,
                parameters: gen.parameters,
                image_urls: gen.image_urls,
                is_series: gen.is_series,
                series_id: gen.series_id,
                content_mode: gen.content_mode || 'social',
                tags: gen.tags || [],
                caption: gen.caption,
                hashtags: gen.hashtags || [],
                created_at: gen.created_at,
            }));

            // Update store with migrated data
            setGenerations(localGenerations);
        } catch (err) {
            console.error('Failed to load generations from Supabase:', err);
        }
    };

    // Check if migration is needed
    const hasLocalData = generations.length > 0 || Object.keys(referenceImagesByInfluencer).length > 0;

    const handleMigration = async () => {
        if (!user || !profile) {
            setError('You must be logged in to migrate data');
            return;
        }

        setMigrating(true);
        setError(null);

        try {
            const migratedStats: MigrationStats = {
                influencers: 0,
                generations: 0,
                referenceImages: 0,
            };

            // 1. Create or get Lyra Chenet influencer for this user
            let influencerId: string | null = null;

            // Check if user already has lyra-chenet
            const { data: existingLyra } = await supabaseAuth
                .from('influencers')
                .select('id')
                .eq('user_id', profile.id)
                .eq('slug', 'lyrachenet')
                .single();

            if (existingLyra) {
                influencerId = existingLyra.id;
            } else {
                // Create Lyra Chenet for this user
                const lyraData = {
                    user_id: profile.id,
                    slug: 'lyrachenet',
                    name: 'Lyra Chenet',
                    description: 'French-Laotian lifestyle influencer from Paris. Known for her elegant Parisian aesthetic blended with Southeast Asian heritage.',
                    base_prompt: customBasePrompts['lyra-chenet'] || 'Young woman, 25 years old, Franco-Laotian mixed heritage (French father, Laotian mother). Delicate Asian-European features with almond-shaped eyes, warm olive skin tone, high cheekbones, soft jawline. Long silky dark brown hair with natural subtle highlights. Elegant and refined facial features blending Southeast Asian beauty with French sophistication. Naturally full lips, expressive dark brown eyes with a gentle, warm gaze. Slender figure with graceful posture. Natural beauty with minimal makeup appearance.',
                    llm_system_prompt: influencerPrompts['lyra-chenet'] || null,
                    thumbnail_url: '/influencers/lyra-chenet/lyra1.png',
                    avatar_url: '/influencers/lyra-chenet/lyra1.png',
                    default_reference_images: [
                        '/influencers/lyra-chenet/lyra1.png',
                        '/influencers/lyra-chenet/_01.png',
                        '/influencers/lyra-chenet/_03.png',
                        '/influencers/lyra-chenet/1 - Copie.png',
                        '/influencers/lyra-chenet/2 - Copie.png',
                        '/influencers/lyra-chenet/4 - Copie.png',
                    ],
                };

                const { data: newLyra, error: createError } = await supabaseAuth
                    .from('influencers')
                    .insert(lyraData)
                    .select()
                    .single();

                if (createError) {
                    throw new Error(`Failed to create influencer: ${createError.message}`);
                }

                influencerId = newLyra.id;
                migratedStats.influencers++;
            }

            // 2. Migrate generations
            if (influencerId && generations.length > 0) {
                // Filter for Lyra generations
                const lyraGenerations = generations.filter(
                    (g) => g.influencer_name === 'Lyra Chenet' || g.influencer_name === 'lyra-chenet'
                );

                for (const gen of lyraGenerations) {
                    const { error: genError } = await supabaseAuth
                        .from('generations')
                        .insert({
                            influencer_id: influencerId,
                            prompt: gen.prompt,
                            parameters: gen.parameters,
                            image_urls: gen.image_urls,
                            is_series: gen.is_series,
                            series_id: gen.series_id || null,
                            content_mode: gen.content_mode || 'social',
                            tags: gen.tags || [],
                            caption: gen.caption || null,
                            hashtags: gen.hashtags || [],
                            created_at: gen.created_at,
                        });

                    if (!genError) {
                        migratedStats.generations++;
                    }
                }
            }

            // 3. Migrate reference images
            const lyraRefImages = referenceImagesByInfluencer['lyra-chenet'] || [];
            if (influencerId && lyraRefImages.length > 0) {
                for (const img of lyraRefImages) {
                    // Skip default images (already in influencer data)
                    if (img.image_url.startsWith('/influencers/')) continue;

                    const { error: imgError } = await supabaseAuth
                        .from('reference_images')
                        .insert({
                            influencer_id: influencerId,
                            image_url: img.image_url,
                            image_type: img.image_type,
                            uploaded_at: img.uploaded_at,
                        });

                    if (!imgError) {
                        migratedStats.referenceImages++;
                    }
                }
            }

            setStats(migratedStats);
            setMigrated(true);
            toast.success('Migration completed successfully!');

            // Reload generations from Supabase to update HistoryGrid
            await loadGenerationsFromSupabase();

        } catch (err) {
            console.error('Migration error:', err);
            setError(err instanceof Error ? err.message : 'Migration failed');
        } finally {
            setMigrating(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            </div>
        );
    }

    if (!user || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">Login Required</h2>
                    <p className="text-zinc-400">Please log in to migrate your data.</p>
                </div>
            </div>
        );
    }

    if (migrated && stats) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4">
                <div className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                        <Check className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Migration Complete!</h2>
                    <p className="text-zinc-400 mb-6">Your data has been successfully migrated.</p>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-zinc-800/50 rounded-xl p-4">
                            <Users className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">{stats.influencers}</div>
                            <div className="text-xs text-zinc-500">Influencers</div>
                        </div>
                        <div className="bg-zinc-800/50 rounded-xl p-4">
                            <Image className="w-6 h-6 text-fuchsia-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">{stats.generations}</div>
                            <div className="text-xs text-zinc-500">Generations</div>
                        </div>
                        <div className="bg-zinc-800/50 rounded-xl p-4">
                            <Database className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-white">{stats.referenceImages}</div>
                            <div className="text-xs text-zinc-500">References</div>
                        </div>
                    </div>

                    <a
                        href={`/${profile.username}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all"
                    >
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4">
            <div className="max-w-md w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <Database className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Migrate Your Data</h2>
                    <p className="text-zinc-400">
                        Move your existing local data to your new account: <span className="text-white font-medium">{profile.username}</span>
                    </p>
                </div>

                {/* Current data stats */}
                <div className="bg-zinc-800/30 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">Data to migrate:</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-zinc-400">
                            <span>Generations</span>
                            <span className="text-white">{generations.length}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                            <span>Reference Images</span>
                            <span className="text-white">{Object.values(referenceImagesByInfluencer).flat().length}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {!hasLocalData ? (
                    <div className="text-center text-zinc-400 mb-6">
                        <p>No local data found to migrate.</p>
                    </div>
                ) : null}

                <button
                    onClick={handleMigration}
                    disabled={migrating || !hasLocalData}
                    className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {migrating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Migrating...
                        </>
                    ) : (
                        <>
                            <ArrowRight className="w-5 h-5" />
                            Start Migration
                        </>
                    )}
                </button>

                <p className="text-xs text-zinc-500 text-center mt-4">
                    This will create your influencers and copy all generations to the database.
                </p>
            </div>
        </div>
    );
}
