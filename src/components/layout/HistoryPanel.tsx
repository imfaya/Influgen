'use client';

// History panel with collapsible sidebar

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useGenerationStore } from '@/store';
import { HistoryGrid } from '@/components/history/HistoryGrid';
import { SeriesCreatorBubble } from '@/components/history/SeriesCreatorBubble';
import { cn } from '@/lib/utils';

export function HistoryPanel() {
    const { isHistoryPanelOpen, toggleHistoryPanel, contentMode, generations } = useGenerationStore();
    const isSensual = contentMode === 'sensual';
    const [historyFilter, setHistoryFilter] = React.useState<'all' | 'continued' | 'not_continued'>('all');
    const [viewMode, setViewMode] = React.useState<'history' | 'trash'>('history');
    const { trash } = useGenerationStore();

    return (
        <aside
            className={cn(
                'border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out',
                isHistoryPanelOpen ? 'w-[350px]' : 'w-12'
            )}
        >
            {/* Toggle button */}
            <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3">
                {isHistoryPanelOpen && (
                    <h2 className={cn(
                        "text-sm font-semibold",
                        isSensual ? "text-rose-400" : "text-gray-700 dark:text-gray-200"
                    )}>
                        {isSensual ? '🔥 Sensual History' : '📸 History'}
                    </h2>
                )}
                <div className="flex items-center gap-1">
                    {isHistoryPanelOpen && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode(viewMode === 'history' ? 'trash' : 'history')}
                            className={cn(
                                "p-2 h-8 w-8 transition-colors",
                                viewMode === 'trash'
                                    ? "text-red-400 bg-red-400/10 hover:bg-red-400/20"
                                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                            title={viewMode === 'history' ? "View Trash" : "Back to History"}
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleHistoryPanel}
                        className="p-2 h-8 w-8"
                    >
                        <svg
                            className={cn(
                                'w-4 h-4 transition-transform duration-300',
                                isHistoryPanelOpen ? 'rotate-0' : 'rotate-180'
                            )}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </Button>
                </div>
            </div>

            {/* History content */}
            {isHistoryPanelOpen && (
                <>
                    {/* Status Filter Slider - Hidden in Trash Mode */}
                    {viewMode === 'history' && (
                        <div className="p-3 pb-1">
                            <div
                                className="relative flex items-center bg-gray-100 dark:bg-white/5 backdrop-blur-md p-1 rounded-full border border-gray-200 dark:border-white/5 h-10 w-full cursor-pointer touch-none select-none"
                                onPointerDown={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const percent = (e.clientX - rect.left) / rect.width;
                                    if (percent < 0.33) setHistoryFilter('all');
                                    else if (percent < 0.66) setHistoryFilter('continued');
                                    else setHistoryFilter('not_continued');
                                }}
                            >
                                {/* Sliding Bubble Background */}
                                <div
                                    className={cn(
                                        "absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out z-0",
                                        isSensual
                                            ? historyFilter === 'continued'
                                                ? 'bg-rose-500/20 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                                                : 'bg-white dark:bg-zinc-800 shadow-sm border border-gray-200 dark:border-white/5'
                                            : historyFilter === 'continued'
                                                ? 'bg-[#4ECDC4]/20 border border-[#4ECDC4]/50 shadow-[0_0_15px_rgba(78,205,196,0.3)]'
                                                : 'bg-white dark:bg-zinc-800 shadow-sm border border-gray-200 dark:border-white/5'
                                    )}
                                    style={{
                                        left: historyFilter === 'all' ? '4px' : historyFilter === 'continued' ? '33.33%' : '66.66%',
                                        width: 'calc(33.33% - 4px)',
                                        transform: historyFilter === 'continued' ? 'translateX(2px)' : historyFilter === 'not_continued' ? 'translateX(-2px)' : 'none'
                                    }}
                                />

                                {(['all', 'continued', 'not_continued'] as const).map((status) => (
                                    <div
                                        key={status}
                                        className={cn(
                                            "relative z-10 w-1/3 h-full rounded-full text-[10px] font-bold transition-colors duration-300 flex items-center justify-center pointer-events-none uppercase tracking-tight",
                                            historyFilter === status
                                                ? historyFilter === 'continued'
                                                    ? isSensual ? 'text-rose-400' : 'text-[#4ECDC4]'
                                                    : 'text-gray-900 dark:text-white'
                                                : 'text-gray-400 dark:text-gray-500'
                                        )}
                                    >
                                        {status === 'all' && 'ALL'}
                                        {status === 'continued' && 'Continued'}
                                        {status === 'not_continued' && 'Originals'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Series Creator Provider Wrapper */}
                    <SeriesCreatorBubble
                        isVisible={isHistoryPanelOpen && historyFilter === 'not_continued'}
                        contentMode={contentMode}
                    >
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-3 pt-2">
                                <HistoryGrid filterMode={contentMode} historyFilter={historyFilter} isTrashView={viewMode === 'trash'} />
                            </div>
                        </ScrollArea>
                    </SeriesCreatorBubble>
                </>
            )}

            {/* Collapsed state icon */}
            {!isHistoryPanelOpen && (
                <div className="flex-1 flex items-center justify-center">
                    <div className={cn(
                        "[writing-mode:vertical-rl] rotate-180 text-xs font-medium",
                        isSensual ? "text-rose-400" : "text-gray-400 dark:text-gray-500"
                    )}>
                        {isSensual ? 'SENSUAL' : 'HISTORY'}
                    </div>
                </div>
            )}
        </aside>
    );
}
