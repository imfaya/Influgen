'use client';

import { toast } from 'sonner';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useGenerationStore } from '@/store';
import { DEFAULT_LLM_SYSTEM_PROMPT, INFLUENCERS } from '@/lib/constants';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { supabaseAuth } from '@/lib/supabase-auth';
import { Settings, RotateCcw, User, Sparkles, Database, Instagram, ImageIcon } from 'lucide-react';
import { InstagramConnect } from '../integrations/InstagramConnect';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EditableReferenceImages } from './EditableReferenceImages';
import { ReferenceImageDropZone, UploadedImage } from './ReferenceImageDropZone';

interface InfluencerSettingsProps {
    influencerId: string;
}

function InfluencerConnectionsTab({ influencerId }: { influencerId: string }) {
    const { influencers, syncInfluencerSettings, loadUserData } = useGenerationStore();
    const [isLoading, setIsLoading] = useState(false);
    const influencer = influencers.find(i => i.id === influencerId);
    // Find linked instagram account if any
    // For now we rely on the influencer object having the ID, then we might need to fetch the account details
    // But wait, the store only has the ID. We need the username to display "Connected as @username".
    // We should probably fetch the account details here if connected.

    const [instagramAccount, setInstagramAccount] = useState<{ username: string } | null>(null);

    useEffect(() => {
        if (influencer?.instagram_account_id) {
            const fetchAccount = async () => {
                const { data } = await supabase
                    .from('instagram_accounts')
                    .select('username')
                    .eq('id', influencer.instagram_account_id!)
                    .single();
                if (data) setInstagramAccount(data);
            };
            fetchAccount();
        } else {
            setInstagramAccount(null);
        }
    }, [influencer?.instagram_account_id]);

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect this Instagram account?')) return;
        setIsLoading(true);
        try {
            // Update influencer to remove link
            await supabase.from('influencers').update({ instagram_account_id: null }).eq('id', influencerId);

            // Refresh store
            const { data: { user } } = await supabaseAuth.auth.getUser();
            if (user) await loadUserData(user.id);

            toast.success('Disconnected from Instagram');
        } catch (error) {
            console.error(error);
            toast.error('Failed to disconnect');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${instagramAccount ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                        <Instagram className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-medium dark:text-gray-200">Instagram</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {instagramAccount ? `Connected as @${instagramAccount.username}` : 'Not connected'}
                        </p>
                    </div>
                </div>

                {instagramAccount ? (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={isLoading}
                    >
                        Disconnect
                    </Button>
                ) : (
                    <InstagramConnect influencerId={influencerId} />
                )}
            </div>

            {!instagramAccount && (
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                    Connect an Instagram account to enable auto-posting and scheduling for this influencer.
                </div>
            )}
        </div>
    );
}

export function InfluencerSettings({ influencerId }: InfluencerSettingsProps) {
    const {
        influencerPrompts,
        setInfluencerPrompt,
        getInfluencerPrompt,
        customBasePrompts,
        setCustomBasePrompt,
        getCustomBasePrompt,
        syncInfluencerSettings,
        saveInfluencerSettings,
        influencers,
        loadUserData
    } = useGenerationStore();

    // Controlled state for dialog open
    const [isOpen, setIsOpen] = useState(false);
    const [isDbConnected, setIsDbConnected] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setIsDbConnected(isSupabaseConfigured());
    }, []);

    // Local state for edits (AI Prompts)
    const [localSystemPrompt, setLocalSystemPrompt] = useState('');
    const [localBasePrompt, setLocalBasePrompt] = useState('');

    // Local state for profile editing
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [newThumbnailFile, setNewThumbnailFile] = useState<UploadedImage | null>(null);

    // Reference images state
    interface DbReferenceImage {
        id: string;
        image_url: string;
        image_type: 'face' | 'body' | 'boobs' | 'pussy';
    }

    const [loadedRefImages, setLoadedRefImages] = useState<{
        face: DbReferenceImage[];
        body: DbReferenceImage[];
        boobs: DbReferenceImage[];
        pussy: DbReferenceImage[];
    }>({ face: [], body: [], boobs: [], pussy: [] });

    const [newRefImages, setNewRefImages] = useState<{
        face: UploadedImage[];
        body: UploadedImage[];
        boobs: UploadedImage[];
        pussy: UploadedImage[];
    }>({ face: [], body: [], boobs: [], pussy: [] });

    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

    // Determine default base prompt for this influencer
    const defaultBasePrompt = INFLUENCERS.find(i => i.id === influencerId)?.basePrompt || '';

    // Load values when dialog opens or influencer changes
    useEffect(() => {
        if (isOpen) {
            // Load AI prompts
            setLocalSystemPrompt(getInfluencerPrompt(influencerId) || DEFAULT_LLM_SYSTEM_PROMPT);
            setLocalBasePrompt(getCustomBasePrompt(influencerId) || defaultBasePrompt);

            // Load profile data
            const influencer = influencers.find(i => i.id === influencerId);
            if (influencer) {
                const nameParts = influencer.name.split(' ');
                setFirstName(nameParts[0] || '');
                setLastName(nameParts.slice(1).join(' ') || '');
                setDescription(influencer.description || '');
                setThumbnailUrl(influencer.thumbnail || influencer.avatar || '');
            }

            // Reset edit states
            setNewThumbnailFile(null);
            setNewRefImages({ face: [], body: [], boobs: [], pussy: [] });
            setImagesToDelete([]);

            // Load reference images from DB
            loadReferenceImages();

            // Background sync from Supabase for prompts
            syncInfluencerSettings(influencerId).then(() => {
                const freshSystem = getInfluencerPrompt(influencerId);
                const freshBase = getCustomBasePrompt(influencerId);
                if (freshSystem) setLocalSystemPrompt(freshSystem);
                if (freshBase) setLocalBasePrompt(freshBase);
            });
        }
    }, [isOpen, influencerId, getInfluencerPrompt, getCustomBasePrompt, defaultBasePrompt, syncInfluencerSettings, influencers]);

    const loadReferenceImages = async () => {
        try {
            const { data, error } = await supabase
                .from('reference_images')
                .select('*')
                .eq('influencer_id', influencerId);

            if (!error && data) {
                const categorized = {
                    face: data.filter((img: any) => img.image_type === 'face'),
                    body: data.filter((img: any) => img.image_type === 'body'),
                    boobs: data.filter((img: any) => img.image_type === 'boobs'),
                    pussy: data.filter((img: any) => img.image_type === 'pussy'),
                };
                setLoadedRefImages(categorized as any);
            }
        } catch (err) {
            console.error('[InfluencerSettings] Failed to load reference images:', err);
        }
    };


    const handleSave = async () => {
        // Optimistic update happens inside basic setters? No, saveInfluencerSettings handles it.
        // We will strictly use the save action which handles both store and DB.
        await saveInfluencerSettings(influencerId, localBasePrompt, localSystemPrompt);
        setIsOpen(false);
    };

    const handleResetSystem = () => {
        setLocalSystemPrompt(DEFAULT_LLM_SYSTEM_PROMPT);
    };

    const handleResetBase = () => {
        setLocalBasePrompt(defaultBasePrompt);
    };

    // calculate modified states
    const isSystemModified = localSystemPrompt !== DEFAULT_LLM_SYSTEM_PROMPT;
    const isBaseModified = localBasePrompt !== defaultBasePrompt;

    // Check if anything is customized for the indicator icon
    const hasCustomSystem = influencerPrompts[influencerId] && influencerPrompts[influencerId] !== DEFAULT_LLM_SYSTEM_PROMPT;
    const hasCustomBase = customBasePrompts[influencerId] && customBasePrompts[influencerId] !== defaultBasePrompt;
    const hasAnyCustomization = hasCustomSystem || hasCustomBase;

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            // 1. Update basic influencer info
            const fullName = lastName.trim()
                ? `${firstName.trim()} ${lastName.trim()}`
                : firstName.trim();

            if (!fullName) {
                toast.error('Please provide at least a first name');
                setIsSaving(false);
                return;
            }

            const newSlug = fullName.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 50);

            await supabase
                .from('influencers')
                .update({
                    name: fullName,
                    slug: newSlug,
                    description: description.trim() || null,
                })
                .eq('id', influencerId);

            // 2. Upload new thumbnail if changed
            if (newThumbnailFile?.file) {
                const { uploadThumbnail } = await import('@/lib/supabase-storage');
                const result = await uploadThumbnail(newThumbnailFile.file, influencerId);
                if (result.url) {
                    await supabase
                        .from('influencers')
                        .update({
                            thumbnail_url: result.url,
                            avatar_url: result.url
                        })
                        .eq('id', influencerId);
                }
            }

            // 3. Upload new reference images
            const { uploadReferenceImage } = await import('@/lib/supabase-storage');

            for (const [type, files] of Object.entries(newRefImages)) {
                for (const uploadedImg of files) {
                    if (uploadedImg?.file) {
                        const result = await uploadReferenceImage(
                            uploadedImg.file,
                            influencerId,
                            type as 'face' | 'body' | 'boobs' | 'pussy'
                        );
                        if (result.url) {
                            await supabase
                                .from('reference_images')
                                .insert({
                                    influencer_id: influencerId,
                                    image_url: result.url,
                                    image_type: type
                                });
                        }
                    }
                }
            }

            // 4. Delete removed reference images (STRATEGY B: Keep files in Storage, remove DB references only)
            if (imagesToDelete.length > 0) {
                await supabase
                    .from('reference_images')
                    .delete()
                    .in('id', imagesToDelete);
            }

            // 5. Reload user data to sync the store
            const { data: { user } } = await supabaseAuth.auth.getUser();
            if (user) await loadUserData(user.id);

            toast.success('Influencer updated successfully!');

        } catch (error) {
            console.error('[InfluencerSettings] Failed to update influencer:', error);
            toast.error('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 shadow-sm backdrop-blur-sm transition-all ${hasAnyCustomization ? 'ring-2 ring-[#FF6B9D]' : ''}`}
                    title="Influencer Settings"
                >
                    <Settings className={`h-4 w-4 ${hasAnyCustomization ? 'text-[#FF6B9D]' : 'text-gray-600 dark:text-gray-300'}`} />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] dark:bg-gray-900 dark:border-gray-700 flex flex-col">
                <DialogHeader>
                    <DialogTitle className="dark:text-gray-100 flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Influencer Settings
                    </DialogTitle>
                    <DialogDescription className="dark:text-gray-400">
                        Customize appearance and AI behavior for this influencer.
                    </DialogDescription>
                    {!isDbConnected && (
                        <Alert variant="destructive" className="mt-2 py-2">
                            <Database className="h-4 w-4" />
                            <AlertDescription className="text-xs ml-2">
                                Database not connected. Changes will not be saved permanently.
                                <br />
                                <strong>Try restarting the server</strong> if you just added API keys.
                            </AlertDescription>
                        </Alert>
                    )}
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Edit Profile
                        </TabsTrigger>
                        <TabsTrigger value="base" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Physical Appearance
                        </TabsTrigger>
                        <TabsTrigger value="system" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            LLM Behavior
                        </TabsTrigger>
                        <TabsTrigger value="connections" className="flex items-center gap-2">
                            <Instagram className="h-4 w-4" />
                            Connections
                        </TabsTrigger>
                    </TabsList>

                    {/* EDIT PROFILE TAB */}
                    <TabsContent value="profile" className="flex-1 flex flex-col overflow-y-auto data-[state=active]:flex py-2 space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                            <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">First Name</label>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Amy"
                                        className="dark:bg-gray-800 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Last Name</label>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Crowe"
                                        className="dark:bg-gray-800 dark:border-gray-600"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe this influencer..."
                                    rows={3}
                                    className="dark:bg-gray-800 dark:border-gray-600"
                                />
                            </div>
                        </div>

                        {/* Thumbnail / Avatar */}
                        <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                            <h3 className="font-semibold text-zinc-200">Thumbnail / Avatar</h3>
                            {(thumbnailUrl || newThumbnailFile) && (
                                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-zinc-600">
                                    <img
                                        src={newThumbnailFile ? newThumbnailFile.url : thumbnailUrl}
                                        alt="Thumbnail"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <ReferenceImageDropZone
                                imageType="face"
                                label="Upload new thumbnail"
                                description="Recommended: Square image, at least 512x512px"
                                images={[]}
                                onImagesChange={(uploads) => {
                                    if (uploads.length > 0) {
                                        setNewThumbnailFile(uploads[0]);
                                    }
                                }}
                                maxImages={1}
                            />
                        </div>

                        {/* Reference Images */}
                        <div className="space-y-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                            <h3 className="font-semibold text-zinc-200">Reference Images</h3>
                            <p className="text-xs text-zinc-500">
                                These images are used by the AI to generate consistent appearances for this influencer.
                            </p>

                            {/* Face Images */}
                            <EditableReferenceImages
                                type="face"
                                label="Face"
                                description="Clear frontal face shots"
                                existingImages={loadedRefImages.face}
                                newFiles={newRefImages.face}
                                onAddFiles={(files) => setNewRefImages(prev => ({ ...prev, face: [...prev.face, ...files] }))}
                                onRemoveExisting={(id) => setImagesToDelete(prev => [...prev, id])}
                                onRemoveNew={(idx) => setNewRefImages(prev => ({
                                    ...prev,
                                    face: prev.face.filter((_, i) => i !== idx)
                                }))}
                                maxImages={5}
                            />

                            {/* Body Images */}
                            <EditableReferenceImages
                                type="body"
                                label="Body"
                                description="Full body or torso shots"
                                existingImages={loadedRefImages.body}
                                newFiles={newRefImages.body}
                                onAddFiles={(files) => setNewRefImages(prev => ({ ...prev, body: [...prev.body, ...files] }))}
                                onRemoveExisting={(id) => setImagesToDelete(prev => [...prev, id])}
                                onRemoveNew={(idx) => setNewRefImages(prev => ({
                                    ...prev,
                                    body: prev.body.filter((_, i) => i !== idx)
                                }))}
                                maxImages={5}
                            />

                            {/* Boobs Images */}
                            <EditableReferenceImages
                                type="boobs"
                                label="Boobs"
                                description="Chest reference photos"
                                existingImages={loadedRefImages.boobs}
                                newFiles={newRefImages.boobs}
                                onAddFiles={(files) => setNewRefImages(prev => ({ ...prev, boobs: [...prev.boobs, ...files] }))}
                                onRemoveExisting={(id) => setImagesToDelete(prev => [...prev, id])}
                                onRemoveNew={(idx) => setNewRefImages(prev => ({
                                    ...prev,
                                    boobs: prev.boobs.filter((_, i) => i !== idx)
                                }))}
                                isPornMode
                                maxImages={5}
                            />

                            {/* Pussy Images */}
                            <EditableReferenceImages
                                type="pussy"
                                label="Pussy"
                                description="Intimate reference photos"
                                existingImages={loadedRefImages.pussy}
                                newFiles={newRefImages.pussy}
                                onAddFiles={(files) => setNewRefImages(prev => ({ ...prev, pussy: [...prev.pussy, ...files] }))}
                                onRemoveExisting={(id) => setImagesToDelete(prev => [...prev, id])}
                                onRemoveNew={(idx) => setNewRefImages(prev => ({
                                    ...prev,
                                    pussy: prev.pussy.filter((_, i) => i !== idx)
                                }))}
                                isPornMode
                                maxImages={5}
                            />
                        </div>
                    </TabsContent>

                    {/* PHYSICAL APPEARANCE TAB */}
                    <TabsContent value="base" className="flex-1 flex flex-col overflow-hidden data-[state=active]:flex py-2">
                        <Alert className="mb-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200">
                            <AlertDescription className="text-xs">
                                <strong>Warning:</strong> Changing the physical description will significantly alter the influencer's look.
                            </AlertDescription>
                        </Alert>

                        <div className="flex-1 flex flex-col min-h-0">
                            <Textarea
                                value={localBasePrompt}
                                onChange={(e) => setLocalBasePrompt(e.target.value)}
                                placeholder="Describe the physical appearance..."
                                className="flex-1 min-h-[200px] resize-none font-mono text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                            />
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {localBasePrompt.length} characters
                                </span>
                                {isBaseModified && (
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs text-[#FF6B9D]">Modified</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleResetBase}
                                            className="h-6 px-2 text-xs"
                                        >
                                            <RotateCcw className="h-3 w-3 mr-1" />
                                            Reset
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* CONNECTIONS TAB */}
                    <TabsContent value="connections" className="flex-1 flex flex-col overflow-hidden data-[state=active]:flex py-2">
                        <InfluencerConnectionsTab influencerId={influencerId} />
                    </TabsContent>

                    {/* LLM SYSTEM PROMPT TAB */}
                    <TabsContent value="system" className="flex-1 flex flex-col overflow-hidden data-[state=active]:flex py-2">
                        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                            Customize how the API enhances your prompts (creating the scene context).
                        </div>
                        <div className="flex-1 flex flex-col min-h-0">
                            <Textarea
                                value={localSystemPrompt}
                                onChange={(e) => setLocalSystemPrompt(e.target.value)}
                                placeholder="Enter custom system prompt..."
                                className="flex-1 min-h-[200px] resize-none font-mono text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                            />
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {localSystemPrompt.length} characters
                                </span>
                                {isSystemModified && (
                                    <div className="flex gap-2 items-center">
                                        <span className="text-xs text-[#FF6B9D]">Modified</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleResetSystem}
                                            className="h-6 px-2 text-xs"
                                        >
                                            <RotateCcw className="h-3 w-3 mr-1" />
                                            Reset
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* DEBUG TAB */}
                    <TabsContent value="debug" className="flex-1 flex flex-col overflow-hidden data-[state=active]:flex py-2">
                        <div className="flex-1 overflow-auto space-y-4">
                            <div className="p-4 rounded-md border text-sm font-mono dark:bg-gray-800 dark:border-gray-700">
                                <div className="mb-2 font-bold">Connection Status:</div>
                                <div className={isDbConnected ? 'text-green-500' : 'text-red-500'}>
                                    {isDbConnected ? 'Variables Configured' : 'Missing Variables'}
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="relative z-10"
                                onClick={async () => {
                                    console.log('Button clicked!');
                                    // Debug configuration first
                                    const configured = isSupabaseConfigured();
                                    const envStatus = {
                                        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                                        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                                    };
                                    console.log('[InfluencerSettings] Env Status:', envStatus, 'Configured:', configured);

                                    if (!configured) {
                                        toast.error(`Configuration Error`, {
                                            description: `Supabase variables are missing. URL: ${envStatus.url}, Key: ${envStatus.key}`
                                        });
                                        return;
                                    }

                                    // Direct DB Fetch check
                                    const { data, error } = await supabase
                                        .from('influencer_settings')
                                        .select('*')
                                        .eq('influencer_id', influencerId)
                                        .single();

                                    if (error) {
                                        console.error('DB Error:', error);
                                        toast.error(`DB Connection Error`, {
                                            description: error.message
                                        });
                                    } else {
                                        console.log('DB Success:', data);
                                        toast.success(`Connected to Supabase!`, {
                                            description: `Fetched Data: ${data?.base_prompt?.slice(0, 20)}...`
                                        });

                                        // Schema Inspection
                                        const { data: infData } = await supabase.from('influencers').select('*').limit(1);
                                        const { data: instaData } = await supabase.from('instagram_accounts').select('*').limit(1);
                                        const { data: infSettingsData } = await supabase.from('influencer_settings').select('*').limit(1);

                                        console.log('--- SCHEMA INSPECTION ---');
                                        if (infData && infData[0]) console.log('Influencers Keys:', Object.keys(infData[0]));
                                        if (instaData && instaData[0]) console.log('Instagram Accounts Keys:', Object.keys(instaData[0]));
                                        if (infSettingsData && infSettingsData[0]) console.log('Influencer Settings Keys:', Object.keys(infSettingsData[0]));
                                        console.log('-------------------------');
                                    }
                                }}
                            >
                                Check DB Content (Raw)
                            </Button>

                            <div className="p-4 rounded-md border text-xs font-mono dark:bg-gray-800 dark:border-gray-700 whitespace-pre-wrap">
                                <div className="mb-2 font-bold">Current Local State:</div>
                                {JSON.stringify({
                                    id: influencerId,
                                    base: localBasePrompt,
                                    system: localSystemPrompt
                                }, null, 2)}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        className="dark:text-gray-400 dark:hover:text-gray-200"
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={async () => {
                            await handleSave(); // Save prompts
                            await handleSaveProfile(); // Save profile & images
                        }}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-[#FF6B9D] to-[#4ECDC4] hover:opacity-90"
                    >
                        {isSaving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent >
        </Dialog >
    );
}
