'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabaseAuth } from '@/lib/supabase-auth';
import { toast } from 'sonner';
import { Key, Eye, EyeOff, Loader2, ExternalLink, CheckCircle2, XCircle, Instagram, User as UserIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { useGenerationStore } from '@/store';
import { InstagramConnect } from '../integrations/InstagramConnect';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthContext';
import Image from 'next/image';

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
    const { user } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasExistingKey, setHasExistingKey] = useState(false);

    // Load current API key when modal opens
    useEffect(() => {
        if (isOpen && user) {
            loadApiKey();
        }
    }, [isOpen, user]);

    const loadApiKey = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabaseAuth
                .from('profiles')
                .select('wavespeed_api_key')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error loading API key:', error);
                return;
            }

            if (data?.wavespeed_api_key) {
                setApiKey(data.wavespeed_api_key);
                setHasExistingKey(true);
            } else {
                setApiKey('');
                setHasExistingKey(false);
            }
        } catch (err) {
            console.error('Failed to load API key:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabaseAuth
                .from('profiles')
                .update({
                    wavespeed_api_key: apiKey || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) {
                console.error('Error saving API key:', error);
                toast.error('Erreur lors de la sauvegarde', {
                    description: error.message
                });
                return;
            }

            setHasExistingKey(!!apiKey);
            toast.success('Clé API sauvegardée', {
                description: 'Votre clé API Wavespeed a été mise à jour.'
            });
            onClose();
        } catch (err) {
            console.error('Failed to save API key:', err);
            toast.error('Erreur inattendue');
        } finally {
            setSaving(false);
        }
    };

    const handleClear = async () => {
        setApiKey('');
    };

    // Mask the API key for display
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <Key className="w-5 h-5 text-violet-400" />
                        Paramètres du compte
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Configurez votre clé API Wavespeed pour générer des images.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-zinc-800 border-zinc-700">
                        <TabsTrigger value="general" className="data-[state=active]:bg-zinc-700">Général</TabsTrigger>
                        <TabsTrigger value="connections" className="data-[state=active]:bg-zinc-700">Connexions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="py-4 space-y-4">
                        {/* API Key Status */}
                        <div className="flex items-center gap-2 text-sm">
                            {hasExistingKey ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-emerald-400">Clé API configurée</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4 text-amber-500" />
                                    <span className="text-amber-400">Aucune clé API configurée</span>
                                </>
                            )}
                        </div>

                        {/* API Key Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">
                                Clé API Wavespeed
                            </label>
                            <div className="relative">
                                <Input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Entrez votre clé API..."
                                    className="pr-20 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                                    disabled={loading}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                                        title={showApiKey ? 'Masquer' : 'Afficher'}
                                    >
                                        {showApiKey ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Help text */}
                        <Alert className="bg-zinc-800/50 border-zinc-700">
                            <AlertDescription className="text-xs text-zinc-400">
                                <p className="mb-2">
                                    Vous pouvez obtenir votre clé API Wavespeed sur:
                                </p>
                                <a
                                    href="https://wavespeed.ai/account"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors"
                                >
                                    wavespeed.ai/account
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </AlertDescription>
                        </Alert>

                        <div className="flex justify-end gap-2 pt-2">
                            {apiKey && (
                                <Button
                                    variant="ghost"
                                    onClick={handleClear}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                    Effacer
                                </Button>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={saving || loading}
                                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sauvegarde...
                                    </>
                                ) : (
                                    'Sauvegarder'
                                )}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="connections" className="py-4 space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        <div className="text-sm text-zinc-400 mb-4">
                            Gérez les connexions Instagram pour vos influenceurs.
                        </div>

                        <div className="space-y-3">
                            <InfluencerList />
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

function InfluencerList() {
    const { influencers, loadUserData } = useGenerationStore();
    const [accounts, setAccounts] = useState<Record<string, { username: string }>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchAccounts = async () => {
            const accountIds = influencers
                .map(i => i.instagram_account_id)
                .filter(Boolean) as string[];

            if (accountIds.length === 0) return;

            const { data } = await supabase
                .from('instagram_accounts')
                .select('id, username')
                .in('id', accountIds);

            if (data) {
                const map: Record<string, { username: string }> = {};
                data.forEach((acc: any) => {
                    map[acc.id] = { username: acc.username };
                });
                setAccounts(map);
            }
        };

        fetchAccounts();
    }, [influencers]);

    const handleDisconnect = async (influencerId: string) => {
        if (!confirm('Voulez-vous vraiment déconnecter ce compte Instagram ?')) return;

        setLoading(prev => ({ ...prev, [influencerId]: true }));
        try {
            await supabase.from('influencers').update({ instagram_account_id: null }).eq('id', influencerId);
            const { data: { user } } = await supabaseAuth.auth.getUser();
            if (user) await loadUserData(user.id);
            toast.success('Déconnecté avec succès');
        } catch (error) {
            console.error(error);
            toast.error('Erreur lors de la déconnexion');
        } finally {
            setLoading(prev => ({ ...prev, [influencerId]: false }));
        }
    };

    return (
        <>
            {influencers.map((inf) => {
                const account = inf.instagram_account_id ? accounts[inf.instagram_account_id] : null;
                const isInfLoading = loading[inf.id];

                return (
                    <div key={inf.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-700">
                                {inf.avatar ? (
                                    <Image src={inf.avatar} alt={inf.name} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-zinc-500" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-white">{inf.name}</h4>
                                <p className="text-xs text-zinc-500 flex items-center gap-1">
                                    <Instagram className={`w-3 h-3 ${account ? 'text-fuchsia-400' : ''}`} />
                                    {account ? `@${account.username}` : 'Non connecté'}
                                </p>
                            </div>
                        </div>

                        {account ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDisconnect(inf.id)}
                                disabled={isInfLoading}
                                className="h-8 px-3 text-xs"
                            >
                                {isInfLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Déconnecter'}
                            </Button>
                        ) : (
                            <InstagramConnect influencerId={inf.id} />
                        )}
                    </div>
                );
            })}
        </>
    );
}
