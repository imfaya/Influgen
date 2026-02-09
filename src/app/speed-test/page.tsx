'use client';

import { useState } from 'react';
import { supabaseAuth } from '@/lib/supabase-auth';
import { useAuth } from '@/components/providers/AuthContext';

export default function SpeedTestPage() {
    const { user } = useAuth();
    const [results, setResults] = useState<string[]>([]);
    const [running, setRunning] = useState(false);

    const log = (msg: string) => setResults(prev => [...prev, msg]);

    const runTests = async () => {
        if (!user) {
            log('Error: Not authenticated');
            return;
        }
        setRunning(true);
        setResults([]);
        log(`Starting tests for User ID: ${user.id}`);

        try {
            // Test 1: Profile
            // Simple PK lookup - should be instant
            const t0 = performance.now();
            const { data: profile, error: err1 } = await supabaseAuth.from('profiles').select('*').eq('id', user.id).single();
            const t1 = performance.now();
            log(`1. Get Profile: ${(t1 - t0).toFixed(2)}ms ${err1 ? `(Error: ${err1.message})` : '(OK)'}`);

            // Test 2: Influencers
            // Simple RLS (auth.uid() = user_id)
            const t2 = performance.now();
            const { data: influencers, error: err2 } = await supabaseAuth.from('influencers').select('*').eq('user_id', user.id);
            const t3 = performance.now();
            log(`2. Get Influencers (${influencers?.length || 0}): ${(t3 - t2).toFixed(2)}ms ${err2 ? `(Error: ${err2.message})` : ''}`);

            // Test 3: Generations (Limited)
            // Complex RLS (EXISTS ...)
            const t4 = performance.now();
            const { data: gensLim, error: err3 } = await supabaseAuth.from('generations').select('id, created_at, influencer_id').limit(20);
            const t5 = performance.now();
            log(`3. Get Generations (Limit 20): ${(t5 - t4).toFixed(2)}ms (Count: ${gensLim?.length}) ${err3 ? `(Error: ${err3.message})` : ''}`);

            // Test 4: Generations (Full - simulation of loadUserData)
            // This uses the explicit IN clause which matches what the Store does
            if (influencers && influencers.length > 0) {
                const infIds = influencers.map(i => i.id);
                log(`\nTest 4: Simulating full sync for ${infIds.length} influencers...`);

                const t6 = performance.now();
                // Mimic store query: select * (all columns)
                const { data: gensFull, error: err4 } = await supabaseAuth
                    .from('generations')
                    .select('*')
                    .in('influencer_id', infIds);
                const t7 = performance.now();

                log(`4. Full Generations Fetch: ${(t7 - t6).toFixed(2)}ms`);
                log(`   Count: ${gensFull?.length || 0}`);
                log(`   Error: ${err4 ? err4.message : 'None'}`);

                if (gensFull && gensFull.length > 0) {
                    const sizeEstimate = JSON.stringify(gensFull).length / 1024;
                    log(`   Estimated Payload Size: ${sizeEstimate.toFixed(2)} KB`);
                }

            } else {
                log('Skipping Test 4 (No influencers found)');
            }

        } catch (e) {
            log(`Exception: ${e}`);
        }
        setRunning(false);
    };

    return (
        <div className="p-8 text-white min-h-screen bg-zinc-950 font-sans">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-violet-400">Database Performance Diagnostic</h1>

                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 mb-6">
                    <p className="text-zinc-300">User: <span className="text-white font-mono">{user?.email || 'Not logged in'}</span></p>
                    <p className="text-zinc-400 text-sm mt-1">This test measures the responsiveness of Supabase queries used by the application.</p>
                </div>

                <button
                    onClick={runTests}
                    disabled={running}
                    className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition-colors mb-6 flex items-center justify-center gap-2"
                >
                    {running ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Running Benchmarks...
                        </>
                    ) : (
                        'Run Diagnostics'
                    )}
                </button>

                <div className="bg-black rounded-lg border border-zinc-800 p-6 font-mono text-sm shadow-xl min-h-[300px]">
                    {results.length === 0 ? (
                        <span className="text-zinc-600 italic">Ready to start...</span>
                    ) : (
                        results.map((line, i) => (
                            <div key={i} className={`mb-1 ${line.startsWith('Test') ? 'text-blue-400 mt-4 font-bold' : line.includes('Error') ? 'text-red-400' : 'text-zinc-300'}`}>
                                {line}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
