'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { HistoryPanel } from '@/components/layout/HistoryPanel';
import { CategorySelector } from '@/components/layout/CategorySelector';
import { PromptGenerator } from '@/components/generation/PromptGenerator';
import { CentralHistoryDisplay } from '@/components/gallery/CentralHistoryDisplay';
import { ImageModal } from '@/components/gallery/ImageModal';
import { CustomScrollbar } from '@/components/ui/CustomScrollbar';
import { useGenerationStore } from '@/store';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wand2 } from 'lucide-react';

interface InfluencerWorkspaceProps {
    onBack: () => void;
}

export const InfluencerWorkspace: React.FC<InfluencerWorkspaceProps> = ({ onBack }) => {
    const {
        contentMode,
        isSidebarOpen,
        isHistoryPanelOpen,
        selectedInfluencer,
        influencerStatus,
        toggleInfluencerStatus
    } = useGenerationStore();
    const [hasMounted, setHasMounted] = useState(false);
    const [isStealItOpen, setIsStealItOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLElement>(null);

    // Default to true if not set
    const isActive = influencerStatus[selectedInfluencer.id] ?? true;

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Note: Default images are now loaded by StoreInitializer
    // Each influencer's images are stored separately in referenceImagesByInfluencer


    if (!hasMounted) {
        return null;
    }

    return (
        <div className={`h-screen flex flex-col transition-colors duration-300 app-enter ${contentMode === 'sensual' ? 'sensual-mode' : contentMode === 'porn' ? 'porn-mode' : ''
            } bg-transparent`}>
            {/* Header */}
            <Header />

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Return Button - Dynamic Positioning */}
                <button
                    onClick={onBack}
                    className={cn(
                        "absolute top-4 z-50 group flex items-center gap-2 px-6 py-3 backdrop-blur-md rounded-full transition-all duration-300 ease-in-out hover:scale-105",
                        contentMode === 'sensual'
                            ? "bg-rose-500/10 border border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] hover:shadow-[0_0_25px_rgba(244,63,94,0.8)]"
                            : contentMode === 'porn'
                                ? "bg-amber-500/10 border border-amber-500 shadow-[0_0_20px_rgba(255,215,0,0.5)] hover:shadow-[0_0_35px_rgba(255,215,0,0.8)]"
                                : "bg-cyan-500/10 border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.6)]",
                        isSidebarOpen ? 'left-[320px]' : 'left-20'
                    )}
                >
                    <ArrowLeft className={cn(
                        "w-5 h-5 transition-transform group-hover:-translate-x-1",
                        contentMode === 'sensual' ? "text-rose-400" : contentMode === 'porn' ? "text-amber-500" : "text-cyan-400"
                    )} />
                    <span className={cn(
                        "font-bold tracking-wider uppercase text-sm",
                        contentMode === 'sensual' ? "text-rose-400" : contentMode === 'porn' ? "text-amber-500" : "text-cyan-400"
                    )}>Back</span>
                </button>

                {/* Active Toggle Switch */}
                <button
                    onClick={() => toggleInfluencerStatus(selectedInfluencer.id)}
                    className={`absolute top-4 z-50 group flex items-center gap-2 px-6 py-3 backdrop-blur-md rounded-full transition-all duration-300 ease-in-out ${isActive
                        ? 'bg-green-500/10 border border-green-500 shadow-[0_0_20px_rgba(74,222,128,0.5)]'
                        : 'bg-white/5 dark:bg-black/20 border border-gray-500/30 hover:border-gray-400'
                        } ${isHistoryPanelOpen ? 'right-[370px]' : 'right-4'
                        }`}
                >
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className={`font-bold tracking-wider uppercase text-sm transition-colors ${isActive ? 'text-green-500' : 'text-gray-400'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                    </span>
                </button>

                {/* Steal It Button - Only visible in Social Mode */}
                {/* Left Sidebar */}
                <Sidebar />

                {/* Center Content */}
                <main ref={scrollContainerRef} className="flex-1 overflow-auto p-6 pt-20" style={{ scrollBehavior: 'auto' }}>
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Category Selector */}
                        <div className="mb-8">
                            <CategorySelector />
                        </div>

                        {/* Prompt Generator */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-md">
                            <PromptGenerator />
                        </div>

                        {/* History Display - Complete scrollable history for current mode */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[400px]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-200">History</h3>
                                <span className="text-xs text-gray-400 dark:text-gray-500">Click to view details</span>
                            </div>
                            <CentralHistoryDisplay />
                        </div>
                    </div>
                </main>

                {/* Custom Floating Scrollbar */}
                <CustomScrollbar scrollContainerRef={scrollContainerRef} />

                {/* Right History Panel */}
                <HistoryPanel />
            </div>

            {/* Global Modals */}
            <ImageModal />
        </div>
    );
};
