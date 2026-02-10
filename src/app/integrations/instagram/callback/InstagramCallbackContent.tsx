'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabaseAuth as supabase } from '@/lib/supabase-auth';
import { useGenerationStore } from '@/store';

export default function InstagramCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const [status, setStatus] = useState('Processing...');
    const { loadUserData } = useGenerationStore();

    useEffect(() => {
        if (!code) {
            setStatus('Error: No code received');
            toast.error('Instagram connection failed');
            setTimeout(() => router.push('/'), 2000);
            return;
        }

        const exchangeCode = async () => {
            try {
                const res = await fetch('/api/integrations/instagram/exchange', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code }),
                });

                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Failed to exchange token');

                // Now save to Supabase from the client side using the authenticated session
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('User not authenticated');

                const { error: dbError } = await supabase
                    .from('instagram_accounts')
                    .upsert({
                        user_id: user.id,
                        instagram_user_id: data.instagram_user_id,
                        username: data.username,
                        access_token: data.access_token,
                        token_expires_at: data.token_expires_at,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id,instagram_user_id'
                    });

                if (dbError) throw dbError;

                // Handle Influencer Linking if 'state' is present
                const stateParam = searchParams.get('state');
                if (stateParam) {
                    try {
                        const state = JSON.parse(decodeURIComponent(stateParam));
                        if (state.influencerId) {
                            // Fetch the newly created/updated instagram account ID
                            const { data: instagramAccount } = await supabase
                                .from('instagram_accounts')
                                .select('id')
                                .eq('user_id', user.id)
                                .eq('instagram_user_id', data.instagram_user_id)
                                .single();

                            if (instagramAccount) {
                                await supabase
                                    .from('influencers')
                                    .update({ instagram_account_id: instagramAccount.id })
                                    .eq('id', state.influencerId)
                                    .eq('user_id', user.id); // Security check

                                toast.success(`Linked to influencer!`);
                            }
                        }
                    } catch (e) {
                        console.error('Failed to parse state or link influencer:', e);
                    }
                }

                // CRITICAL: Refresh the global store to ensure influencer status updates
                console.log('[InstagramCallback] Refreshing store data...');
                await loadUserData(user.id);

                toast.success(`Connected to Instagram as @${data.username}`);
                router.push('/scheduler');
            } catch (error: any) {
                console.error(error);
                setStatus(`Error: ${error.message}`);
                toast.error('Failed to connect Instagram');
            }
        };

        exchangeCode();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Connecting to Instagram...</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{status}</p>
        </div>
    );
}
