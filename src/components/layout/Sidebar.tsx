'use client';

// Sidebar component with influencer selection, configuration, and uploads

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { InfluencerSelect } from '@/components/influencer/InfluencerSelect';
import { ConfigPanel } from '@/components/generation/ConfigPanel';
import { ImageUploader } from '@/components/upload/ImageUploader';
import { useGenerationStore } from '@/store';
import { cn } from '@/lib/utils';

export function Sidebar() {
    const { contentMode, isSidebarOpen, toggleSidebar } = useGenerationStore();
    const isSensual = contentMode === 'sensual';
    const isPorn = contentMode === 'porn';

    return (
        <aside className={cn(
            "border-r flex-shrink-0 flex flex-col h-full transition-all duration-300 ease-in-out",
            isSidebarOpen ? "w-[300px]" : "w-12",
            isSensual
                ? "border-rose-200 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/20"
                : isPorn
                    ? "border-amber-500/20 dark:border-amber-500/20 bg-amber-50/50 dark:bg-[#0a0a00]/50"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
        )}>
            {/* Toggle Header */}
            <div className={cn(
                "h-12 border-b flex items-center justify-between px-3",
                isSensual ? "border-rose-200 dark:border-rose-900/30" : isPorn ? "border-amber-500/20" : "border-gray-200 dark:border-gray-700"
            )}>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="p-2 h-8 w-8"
                >
                    <svg
                        className={cn(
                            'w-4 h-4 transition-transform duration-300',
                            isSidebarOpen ? 'rotate-0' : 'rotate-180'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            // Using same arrow as history panel but mirrored logic or same logic depending on preference (pointing inward to collapse)
                            // History uses: collapsed=w-12, expanded=w-350. Arrow points left (<) when open to collapse? 
                            // Current icon in history: d="M9 5l7 7-7 7" (>)
                            // Standard convention: 
                            // Expanded: < (collapse)
                            // Collapsed: > (expand)
                            // Let's use a simple chevron that rotates
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </Button>
            </div>

            {isSidebarOpen ? (
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        {/* Influencer Selection */}
                        <section>
                            <h2 className={cn(
                                "text-sm font-semibold mb-3 flex items-center gap-2",
                                isSensual
                                    ? "text-rose-700 dark:text-rose-300"
                                    : isPorn
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-gray-700 dark:text-gray-200"
                            )}>
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    isSensual ? "bg-rose-500" : isPorn ? "bg-amber-500" : "bg-[#FF6B9D]"
                                )}></span>
                                Influencer
                            </h2>
                            <InfluencerSelect />
                        </section>

                        {/* Configuration */}
                        <section>
                            <h2 className={cn(
                                "text-sm font-semibold mb-3 flex items-center gap-2",
                                isSensual
                                    ? "text-rose-700 dark:text-rose-300"
                                    : isPorn
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-gray-700 dark:text-gray-200"
                            )}>
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    isSensual ? "bg-rose-400" : isPorn ? "bg-amber-400" : "bg-[#4ECDC4]"
                                )}></span>
                                Configuration
                            </h2>
                            <ConfigPanel />
                        </section>

                        {/* Image Upload */}
                        <section>
                            <h2 className={cn(
                                "text-sm font-semibold mb-3 flex items-center gap-2",
                                isSensual
                                    ? "text-rose-700 dark:text-rose-300"
                                    : isPorn
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-gray-700 dark:text-gray-200"
                            )}>
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    isSensual ? "bg-rose-300" : isPorn ? "bg-amber-300" : "bg-purple-500"
                                )}></span>
                                Reference Images
                            </h2>
                            <ImageUploader />
                        </section>
                    </div>
                </ScrollArea>
            ) : (
                <div className="flex-1 flex items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={toggleSidebar}>
                    <div className={cn(
                        "[writing-mode:vertical-lr] text-xs font-medium tracking-widest",
                        isSensual
                            ? "text-rose-400"
                            : isPorn
                                ? "text-amber-500"
                                : "text-gray-400 dark:text-gray-500"
                    )}>
                        GENERATION
                    </div>
                </div>
            )}
        </aside>
    );
}
