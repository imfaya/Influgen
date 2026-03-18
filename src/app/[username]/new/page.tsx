'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import { supabaseAuth } from '@/lib/supabase-auth';
import { Loader2, ArrowLeft, User, Sparkles, Save, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { ReferenceImageDropZone, UploadedImage } from '@/components/influencer/ReferenceImageDropZone';
import { uploadReferenceImage, uploadThumbnail } from '@/lib/supabase-storage';
import { useGenerationStore } from '@/store';
import { WavespeedBalance } from '@/components/dashboard/WavespeedBalance';

export default function NewInfluencerPage() {
    const router = useRouter();
    const params = useParams();
    const username = params.username as string;
    const { user, profile, loading: authLoading } = useAuth();

    // Form state
    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [description, setDescription] = useState('');
    const [basePrompt, setBasePrompt] = useState('');
    const [thumbnailImages, setThumbnailImages] = useState<UploadedImage[]>([]);
    const [saving, setSaving] = useState(false);

    // Reference images state
    const [faceImages, setFaceImages] = useState<UploadedImage[]>([]);
    const [bodyImages, setBodyImages] = useState<UploadedImage[]>([]);
    const [boobsImages, setBoobsImages] = useState<UploadedImage[]>([]);
    const [pussyImages, setPussyImages] = useState<UploadedImage[]>([]);

    // Generate slug from first + last name
    const generateSlug = (first: string, last: string): string => {
        const combined = `${first} ${last}`.trim();
        return combined
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 50);
    };

    // Check if user is authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/auth/login');
        }
    }, [authLoading, user, router]);

    // Check if user is owner
    useEffect(() => {
        if (!authLoading && profile && profile.username !== username) {
            router.replace(`/${profile.username}/dashboard`);
        }
    }, [authLoading, profile, username, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !profile) {
            toast.error('You must be logged in');
            return;
        }

        if (!firstName.trim()) {
            toast.error('First name is required');
            return;
        }

        const slug = generateSlug(firstName, lastName);
        if (!slug) {
            toast.error('Cannot generate a valid URL from the name');
            return;
        }

        setSaving(true);

        try {
            // Check if slug is already taken for this user
            const { data: existing } = await supabaseAuth
                .from('influencers')
                .select('id')
                .eq('user_id', profile.id)
                .eq('slug', slug)
                .single();

            if (existing) {
                toast.error('You already have an influencer with this name');
                setSaving(false);
                return;
            }

            // Create the full name
            const fullName = lastName.trim()
                ? `${firstName.trim()} ${lastName.trim()}`
                : firstName.trim();

            // Create the influencer first (without thumbnail/avatar initially)
            const { data: influencer, error } = await supabaseAuth
                .from('influencers')
                .insert({
                    user_id: profile.id,
                    name: fullName,
                    slug: slug,
                    description: description.trim() || null,
                    base_prompt: basePrompt.trim() || null,
                    // We'll update these after upload if a file is provided
                    thumbnail_url: null,
                    avatar_url: null,
                })
                .select()
                .single();

            if (error) {
                throw error;
            }

            // Upload Thumbnail if provided
            if (thumbnailImages.length > 0 && thumbnailImages[0].file) {
                const thumbFile = thumbnailImages[0].file;
                try {
                    const uploadResult = await uploadThumbnail(thumbFile, influencer.id);
                    if (uploadResult.url) {
                        // Update influencer with the new storage URL
                        await supabaseAuth
                            .from('influencers')
                            .update({
                                thumbnail_url: uploadResult.url,
                                avatar_url: uploadResult.url // Use same for avatar for now
                            })
                            .eq('id', influencer.id);
                    }
                } catch (upErr) {
                    console.error('Thumbnail upload failed:', upErr);
                    toast.warning('Influencer created, but thumbnail upload failed');
                }
            }

            // Collect all reference images to upload
            const imagesToUpload: { file: File; type: 'face' | 'body' | 'boobs' | 'pussy' }[] = [];

            faceImages.forEach(img => { if (img.file) imagesToUpload.push({ file: img.file, type: 'face' }); });
            bodyImages.forEach(img => { if (img.file) imagesToUpload.push({ file: img.file, type: 'body' }); });
            boobsImages.forEach(img => { if (img.file) imagesToUpload.push({ file: img.file, type: 'boobs' }); });
            pussyImages.forEach(img => { if (img.file) imagesToUpload.push({ file: img.file, type: 'pussy' }); });

            // Upload all reference images in parallel
            if (imagesToUpload.length > 0) {
                const uploadPromises = imagesToUpload.map(async (item) => {
                    try {
                        const result = await uploadReferenceImage(item.file, influencer.id, item.type);
                        if (result.url) {
                            return {
                                influencer_id: influencer.id,
                                image_url: result.url,
                                image_type: item.type
                            };
                        }
                        return null;
                    } catch (e) {
                        console.error(`Failed to upload ${item.type} image:`, e);
                        return null;
                    }
                });

                const uploadedRecords = (await Promise.all(uploadPromises)).filter(Boolean);

                if (uploadedRecords.length > 0) {
                    const { error: refError } = await supabaseAuth
                        .from('reference_images')
                        .insert(uploadedRecords as any); // Cast to any to avoid strict type checks on insert

                    if (refError) {
                        console.error('Error saving reference images metadata:', refError);
                        toast.warning('Some reference images failed to link to the influencer');
                    }
                }
            }

            // Trigger a manual sync of the store to make sure the new influencer is available
            // before we redirect to its workspace
            await useGenerationStore.getState().loadUserData(user.id);

            toast.success('Influencer created successfully!');
            router.push(`/${username}/${slug}`);
        } catch (err) {
            console.error('Error creating influencer:', err);
            toast.error('Failed to create influencer');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            </div>
        );
    }

    const totalImages = faceImages.length + bodyImages.length + boobsImages.length + pussyImages.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            {/* Header */}
            <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/${username}/dashboard`}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-lg font-semibold text-white">Create New Influencer</h1>
                                <p className="text-sm text-zinc-500">Add a new AI persona to your collection</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <WavespeedBalance />
                        </div>
                    </div>
                </div>
            </header>

            {/* Form */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
                        <h2 className="text-lg font-medium text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-violet-400" />
                            Basic Information
                        </h2>

                        {/* First Name + Last Name */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    First Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Lyra"
                                    required
                                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Chenet"
                                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="French-Laotian lifestyle influencer from Paris..."
                                rows={3}
                                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none"
                            />
                        </div>

                        {/* Thumbnail Image */}
                        <div>
                            <ReferenceImageDropZone
                                imageType="face" // reuse face type for thumbnail style
                                label="Thumbnail / Avatar"
                                description="Main profile picture for the influencer"
                                images={thumbnailImages}
                                onImagesChange={setThumbnailImages}
                                maxImages={1}
                            />
                        </div>
                    </div>

                    {/* AI Settings */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
                        <h2 className="text-lg font-medium text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-fuchsia-400" />
                            AI Generation Settings
                        </h2>

                        {/* Base Prompt */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Base Prompt (Character Description)
                            </label>
                            <textarea
                                value={basePrompt}
                                onChange={(e) => setBasePrompt(e.target.value)}
                                placeholder="Young woman, 25 years old, Franco-Laotian mixed heritage..."
                                rows={6}
                                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none font-mono text-sm"
                            />
                            <p className="mt-1.5 text-xs text-zinc-500">
                                This description will be prepended to every generation prompt to maintain consistent character features.
                            </p>
                        </div>
                    </div>

                    {/* Reference Images */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium text-white flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-emerald-400" />
                                Reference Images
                            </h2>
                            {totalImages > 0 && (
                                <span className="text-sm text-zinc-400">{totalImages} image(s)</span>
                            )}
                        </div>
                        <p className="text-sm text-zinc-500 -mt-2">
                            Upload reference images to help maintain consistent appearance. These will be used as visual guides during generation.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Face */}
                            <ReferenceImageDropZone
                                imageType="face"
                                label="Face"
                                description="Clear face shots for facial consistency"
                                images={faceImages}
                                onImagesChange={setFaceImages}
                                maxImages={5}
                            />

                            {/* Body */}
                            <ReferenceImageDropZone
                                imageType="body"
                                label="Body"
                                description="Full body or torso reference"
                                images={bodyImages}
                                onImagesChange={setBodyImages}
                                maxImages={5}
                            />

                            {/* Boobs - Porn mode */}
                            <ReferenceImageDropZone
                                imageType="boobs"
                                label="Boobs"
                                description="Chest reference for adult content"
                                images={boobsImages}
                                onImagesChange={setBoobsImages}
                                maxImages={5}
                                isPornMode
                            />

                            {/* Pussy - Porn mode */}
                            <ReferenceImageDropZone
                                imageType="pussy"
                                label="Pussy"
                                description="Intimate reference for adult content"
                                images={pussyImages}
                                onImagesChange={setPussyImages}
                                maxImages={5}
                                isPornMode
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href={`/${username}/dashboard`}
                            className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving || !firstName.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Create Influencer
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
