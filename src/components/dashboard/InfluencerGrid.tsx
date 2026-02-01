'use client';

import React, { useState } from 'react';
import { Plus, User, Calendar, MoreVertical, Sparkles, Trash2, RefreshCw } from 'lucide-react';
import { InfluencerFilters } from './InfluencerFilters';

import { useGenerationStore } from '@/store';

interface InfluencerGridProps {
    onSelectInfluencer: (id: string) => void;
}

export const InfluencerGrid: React.FC<InfluencerGridProps> = ({ onSelectInfluencer }) => {
    const { influencerStatus, influencers, removeInfluencer, toggleInfluencerStatus, syncInfluencers } = useGenerationStore();
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // Filter and Sort influencers logic
    const filteredInfluencers = influencers.map(inf => ({
        ...inf,
        isActive: influencerStatus[inf.id] ?? true // Default to true
    })).filter(inf => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'active') return inf.isActive;
        if (statusFilter === 'inactive') return !inf.isActive;
        return true;
    }).sort((a, b) => {
        // Mock date sorting since we don't have created_at in INFLUENCERS constant yet
        // Just reversing order for demo
        return sortOrder === 'newest' ? -1 : 1;
    });

    // Specifically finding Lyra for the main demo card
    // In a real iteration we would map over `filteredInfluencers` to render cards
    const lyra = filteredInfluencers.find(i => i.id === 'lyra-chenet');
    const isLyraVisible = !!lyra;
    const isLyraActive = lyra?.isActive ?? true;

    return (
        <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#0a0a0a] p-8 md:p-12 transition-colors duration-300 relative overflow-hidden">

            {/* Abstract Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-500/5 dark:bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-blue-500/5 dark:bg-blue-900/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[0%] left-[20%] w-[30%] h-[30%] bg-pink-500/5 dark:bg-pink-900/10 rounded-full blur-[80px]" />

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.05]" />
            </div>

            <div className="max-w-7xl mx-auto space-y-12 relative z-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-200 dark:border-white/5 pb-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 dark:from-white dark:via-purple-200 dark:to-gray-400">
                            My Influencers
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Manage your creations and their identity
                        </p>
                    </div>

                    <InfluencerFilters
                        statusFilter={statusFilter}
                        sortOrder={sortOrder}
                        onStatusChange={setStatusFilter}
                        onSortChange={setSortOrder}
                    />

                    {/* Sync with Constants Button */}
                    <button
                        onClick={() => {
                            if (confirm('Refresh influencers list? This will replace your current list with the latest test influencers.')) {
                                syncInfluencers();
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-400 hover:text-white transition-all duration-300"
                        title="Sync with latest influencer data"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset to Defaults</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

                    {/* Dynamic Influencer Cards */}
                    {filteredInfluencers.map((influencer) => {
                        const isActive = influencer.isActive;

                        return (
                            <div
                                key={influencer.id}
                                onClick={() => onSelectInfluencer(influencer.id)}
                                className={`group relative h-[420px] bg-white dark:bg-[#121212] rounded-[32px] overflow-hidden cursor-pointer border border-gray-100 dark:border-white/5 shadow-lg dark:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${!isActive && 'opacity-70 grayscale hover:grayscale-0 hover:opacity-100'}`}
                            >
                                {/* Image Placeholder / Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-50 dark:from-[#1a1a1a] dark:to-[#121212]">
                                    {/* Profile Image */}
                                    {influencer.defaultReferenceImages && influencer.defaultReferenceImages.length > 0 ? (
                                        <div className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                                            style={{ backgroundImage: `url('${influencer.defaultReferenceImages[0]}')` }}
                                        />
                                    ) : (
                                        // Fallback for Custom Influencer (No Image)
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-transform duration-700 group-hover:scale-105">
                                            <span className="text-6xl font-bold text-gray-400 dark:text-gray-700 select-none">
                                                {influencer.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Gradient Overlay for Text Readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                </div>

                                {/* Status Indicator (Clickable Tag) */}
                                <div className="absolute top-5 right-5 z-20">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleInfluencerStatus(influencer.id);
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border transition-all duration-300 hover:scale-105 active:scale-95 ${isActive
                                            ? 'bg-black/40 border-white/10 hover:bg-black/60'
                                            : 'bg-gray-900/80 border-gray-700 hover:bg-gray-900'
                                            }`}>
                                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)] animate-pulse' : 'bg-gray-500'}`} />
                                        <span className={`text-xs font-semibold tracking-wide ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </button>
                                </div>

                                {/* Delete Button */}
                                {influencer.id !== 'custom-influencer' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Are you sure you want to delete ${influencer.name}?`)) {
                                                removeInfluencer(influencer.id);
                                            }
                                        }}
                                        className="absolute top-5 left-5 z-20 p-2 rounded-full bg-black/40 hover:bg-red-500/80 border border-white/10 text-white transition-all duration-300 backdrop-blur-md opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Content Content - Bottom Aligned */}
                                <div className="absolute inset-x-0 bottom-0 p-8 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-md">
                                        {influencer.name}
                                    </h3>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                                            <Calendar className="w-3 h-3" />
                                            <span>Created on Jan 15, 2026</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 group-hover:bg-purple-500 group-hover:border-purple-500 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                                        <span>Open Workspace</span>
                                        <MoreVertical className="w-4 h-4 rotate-90" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* New Influencer Card (Enhanced) */}
                    <div className="group relative h-[420px] rounded-[32px] border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-cyan-400 dark:hover:border-cyan-500 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 bg-gray-50/50 dark:bg-[#121212]/50 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/10">

                        {/* Glowing Button Container */}
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 bg-cyan-400/20 dark:bg-cyan-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-50 group-hover:opacity-100" />
                            <div className="relative w-20 h-20 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 group-hover:border-cyan-400 dark:group-hover:border-cyan-500 flex items-center justify-center transition-all duration-300 shadow-xl group-hover:scale-110">
                                <Plus className="w-10 h-10 text-gray-400 dark:text-gray-600 group-hover:text-cyan-500 transition-colors duration-300" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">New Influencer</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Start a new adventure</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
