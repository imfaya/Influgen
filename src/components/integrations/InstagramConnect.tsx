'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Instagram } from 'lucide-react';
import { toast } from 'sonner';

const INSTAGRAM_APP_ID = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || '';
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/integrations/instagram/callback` : '';

export function InstagramConnect({ influencerId }: { influencerId?: string }) {
    const handleConnect = () => {
        console.log('Connecting with App ID:', INSTAGRAM_APP_ID, 'Redirect:', REDIRECT_URI);
        if (!INSTAGRAM_APP_ID) {
            toast.error('Instagram App ID not configured');
            return;
        }

        const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';
        // Pass influencerId in state if provided
        const state = influencerId ? encodeURIComponent(JSON.stringify({ influencerId })) : '';
        const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code&state=${state}`;

        window.location.href = authUrl;
    };

    return (
        <Button
            onClick={handleConnect}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white font-medium shadow-md shadow-purple-500/20"
            size="sm"
        >
            <Instagram className="w-4 h-4 mr-2" />
            Connect
        </Button>
    );
}
