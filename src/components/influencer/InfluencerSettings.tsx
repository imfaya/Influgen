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
import { useGenerationStore } from '@/store';
import { DEFAULT_LLM_SYSTEM_PROMPT, INFLUENCERS } from '@/lib/constants';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Settings, RotateCcw, User, Sparkles, Database } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InfluencerSettingsProps {
    influencerId: string;
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
        saveInfluencerSettings
    } = useGenerationStore();

    // Controlled state for dialog open
    const [isOpen, setIsOpen] = useState(false);
    const [isDbConnected, setIsDbConnected] = useState(true);

    useEffect(() => {
        setIsDbConnected(isSupabaseConfigured());
    }, []);

    // Local state for edits
    const [localSystemPrompt, setLocalSystemPrompt] = useState('');
    const [localBasePrompt, setLocalBasePrompt] = useState('');

    // Determine default base prompt for this influencer
    const defaultBasePrompt = INFLUENCERS.find(i => i.id === influencerId)?.basePrompt || '';

    // Load values when dialog opens or influencer changes
    useEffect(() => {
        if (isOpen) {
            // Initial load from local store
            setLocalSystemPrompt(getInfluencerPrompt(influencerId) || DEFAULT_LLM_SYSTEM_PROMPT);
            setLocalBasePrompt(getCustomBasePrompt(influencerId) || defaultBasePrompt);

            // Background sync from Supabase
            syncInfluencerSettings(influencerId).then(() => {
                // Update local state with fresh data from store after sync
                // We access the store directly via the getters which now have the updated data
                const freshSystem = getInfluencerPrompt(influencerId);
                const freshBase = getCustomBasePrompt(influencerId);
                if (freshSystem) setLocalSystemPrompt(freshSystem);
                if (freshBase) setLocalBasePrompt(freshBase);
            });
        }
    }, [isOpen, influencerId, getInfluencerPrompt, getCustomBasePrompt, defaultBasePrompt, syncInfluencerSettings]);

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

                <Tabs defaultValue="base" className="w-full flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="base" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Physical Appearance
                        </TabsTrigger>
                        <TabsTrigger value="system" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            LLM Behavior
                        </TabsTrigger>
                        <TabsTrigger value="debug" className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Debug
                        </TabsTrigger>
                    </TabsList>

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
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-[#FF6B9D] to-[#4ECDC4] hover:opacity-90"
                    >
                        Save All Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
