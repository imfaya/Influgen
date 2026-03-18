'use client';

import React from 'react';
import { CalendarView } from '@/components/scheduler/CalendarView';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { WavespeedBalance } from '@/components/dashboard/WavespeedBalance';

export default function SchedulerPage() {
    const params = useParams();
    const username = params.username as string;

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/${username}/dashboard`}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
                        >
                            <ArrowLeft className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                                Content Scheduler
                            </h1>
                            <p className="text-zinc-400">Manage and schedule your Instagram posts.</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <WavespeedBalance />
                    </div>
                </div>

                <CalendarView />
            </div>
        </div>
    );
}
