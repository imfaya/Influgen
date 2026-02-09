'use client';

import React, { useState } from 'react';
import { X, Zap, Users, Sparkles } from 'lucide-react';
import { ContentMode, Influencer } from '@/types';

interface BatchGenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeInfluencers: Influencer[];
    onStartBatch: (modes: ContentMode[], imagesPerInfluencer: number) => void;
    isGenerating?: boolean;
}

export const BatchGenerateModal: React.FC<BatchGenerateModalProps> = ({
    isOpen,
    onClose,
    activeInfluencers,
    onStartBatch,
    isGenerating = false
}) => {
    const [selectedModes, setSelectedModes] = useState<ContentMode[]>(['social']);
    const [imagesPerInfluencer, setImagesPerInfluencer] = useState(2);

    if (!isOpen) return null;

    const toggleMode = (mode: ContentMode) => {
        setSelectedModes(prev => {
            if (prev.includes(mode)) {
                // Don't allow deselecting if it's the only one
                if (prev.length === 1) return prev;
                return prev.filter(m => m !== mode);
            }
            return [...prev, mode];
        });
    };

    const handleStart = () => {
        if (selectedModes.length === 0 || activeInfluencers.length === 0) return;
        onStartBatch(selectedModes, imagesPerInfluencer);
    };

    const totalGenerations = activeInfluencers.length * selectedModes.length * imagesPerInfluencer;

    const modeConfig: { mode: ContentMode; label: string; emoji: string; color: string }[] = [
        { mode: 'social', label: 'Social', emoji: '📸', color: 'from-blue-500 to-cyan-500' },
        { mode: 'sensual', label: 'Sensual', emoji: '🔥', color: 'from-pink-500 to-rose-500' },
        { mode: 'porn', label: 'Explicit', emoji: '💋', color: 'from-red-500 to-orange-500' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="relative px-6 py-5 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Batch Generation</h2>
                            <p className="text-sm text-zinc-400">Générer sur tous les influenceurs actifs</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Active Influencers Preview */}
                    <div className="bg-zinc-800/50 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-medium text-zinc-300">
                                {activeInfluencers.length} influenceur{activeInfluencers.length > 1 ? 's' : ''} actif{activeInfluencers.length > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {activeInfluencers.slice(0, 5).map(inf => (
                                <div
                                    key={inf.id}
                                    className="px-3 py-1.5 bg-zinc-700/50 rounded-full text-xs text-zinc-300 flex items-center gap-2"
                                >
                                    {inf.avatar ? (
                                        <img src={inf.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full bg-zinc-600" />
                                    )}
                                    {inf.name}
                                </div>
                            ))}
                            {activeInfluencers.length > 5 && (
                                <div className="px-3 py-1.5 bg-zinc-700/50 rounded-full text-xs text-zinc-400">
                                    +{activeInfluencers.length - 5} autres
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-3">
                            Types de contenu
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {modeConfig.map(({ mode, label, emoji, color }) => (
                                <button
                                    key={mode}
                                    onClick={() => toggleMode(mode)}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${selectedModes.includes(mode)
                                        ? `border-transparent bg-gradient-to-br ${color} text-white shadow-lg`
                                        : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{emoji}</div>
                                    <div className="text-sm font-medium">{label}</div>
                                    {selectedModes.includes(mode) && (
                                        <Sparkles className="absolute top-2 right-2 w-4 h-4 text-white/80" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Images per Influencer */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-3">
                            Images par influenceur (par mode)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={1}
                                max={20}
                                value={imagesPerInfluencer}
                                onChange={(e) => setImagesPerInfluencer(parseInt(e.target.value))}
                                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                            />
                            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl font-bold text-white">
                                {imagesPerInfluencer}
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-2xl p-4">
                        <div className="flex items-center justify-center gap-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white mb-1">{totalGenerations}</div>
                                <div className="text-sm text-zinc-400">
                                    génération{totalGenerations > 1 ? 's' : ''}
                                </div>
                            </div>
                            <div className="w-px h-12 bg-zinc-700" />
                            <div className="text-center">
                                <div className="text-3xl font-bold text-emerald-400 mb-1">
                                    ${(totalGenerations * 0.04).toFixed(2)}
                                </div>
                                <div className="text-sm text-zinc-400">
                                    coût estimé
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-zinc-500 text-center">
                            {activeInfluencers.length} influenceurs × {selectedModes.length} mode{selectedModes.length > 1 ? 's' : ''} × {imagesPerInfluencer} image{imagesPerInfluencer > 1 ? 's' : ''} • $0.04/image
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
                    <button
                        onClick={handleStart}
                        disabled={isGenerating || activeInfluencers.length === 0 || selectedModes.length === 0}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-lg hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-violet-500/25"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Génération en cours...
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5" />
                                Lancer le Batch
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
