'use client';

import React, { useEffect, useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';

export function WavespeedBalance() {
    const [balance, setBalance] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        async function fetchBalance() {
            try {
                const res = await fetch('/api/wavespeed/balance');
                if (res.ok) {
                    const data = await res.json();
                    
                    if (data.balance === "N/A") {
                        if (isMounted) setBalance("N/A");
                    } else if (data.balance !== undefined) {
                        if (isMounted) setBalance(`$${Number(data.balance).toFixed(2)}`);
                    } else if (data.data?.balance !== undefined) {
                        if (isMounted) setBalance(`$${Number(data.data.balance).toFixed(2)}`);
                    } else {
                        // Fallback if balance is in another field
                        if (isMounted) setBalance(`$${Number(data).toFixed(2)}`);
                    }
                } else {
                    if (isMounted) setBalance("Err");
                }
            } catch (error) {
                console.error("Failed to fetch Wavespeed balance:", error);
                if (isMounted) setBalance("Err");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchBalance();

        // Poll every 30 seconds to keep balance up-to-date
        const interval = setInterval(fetchBalance, 30_000);

        // Listen for immediate refresh events (e.g. after a generation)
        const handleRefresh = () => fetchBalance();
        window.addEventListener('wavespeed-balance-refresh', handleRefresh);

        return () => {
            isMounted = false;
            clearInterval(interval);
            window.removeEventListener('wavespeed-balance-refresh', handleRefresh);
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/30 rounded-lg text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">--</span>
            </div>
        );
    }

    if (balance === "N/A") {
        return null; // Do not show if not configured
    }

    return (
        <div 
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg text-zinc-300 transition-colors" 
            title="Wavespeed Balance"
        >
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium tracking-wide">{balance}</span>
        </div>
    );
}
