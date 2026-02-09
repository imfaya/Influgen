'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * This page redirects to the dashboard.
 * The actual dashboard is at /username/dashboard
 */
export default function UserPage() {
    const router = useRouter();
    const params = useParams();
    const username = params.username as string;

    useEffect(() => {
        router.replace(`/${username}/dashboard`);
    }, [router, username]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        </div>
    );
}
