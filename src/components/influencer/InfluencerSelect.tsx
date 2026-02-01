'use client';

// Influencer selection dropdown with profile card

import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useGenerationStore } from '@/store';
import { INFLUENCERS } from '@/lib/constants';
import { InfluencerSettings } from './InfluencerSettings';
import { cn } from '@/lib/utils';

export function InfluencerSelect() {
    const { selectedInfluencer, contentMode } = useGenerationStore();
    const isSensual = contentMode === 'sensual';
    const isPorn = contentMode === 'porn';

    return (
        <div className="space-y-3">
            {/* Dropdown */}
            <Select
                defaultValue={selectedInfluencer.id}
                onValueChange={(val) => {
                    const inf = INFLUENCERS.find(i => i.id === val);
                    if (inf) {
                        useGenerationStore.setState({ selectedInfluencer: inf });

                        // Load default reference images if any
                        if (inf.defaultReferenceImages && inf.defaultReferenceImages.length > 0) {
                            const { addReferenceImage, setReferenceImages } = useGenerationStore.getState();

                            // Clear existing (optional, or maybe we want to keep them? usually better to start fresh for a new influencer)
                            setReferenceImages([]);

                            // Add defaults
                            inf.defaultReferenceImages.forEach(url => {
                                addReferenceImage({
                                    influencer_name: inf.name,
                                    image_url: url,
                                    image_type: 'edit' // Default to edit type for defaults
                                });
                            });
                        }
                    }
                }}
            >
                <SelectTrigger className={cn(
                    "w-full transition-colors",
                    isSensual
                        ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 hover:border-rose-400"
                        : isPorn
                            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-400"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-[#FF6B9D]/50"
                )}>
                    <SelectValue placeholder="Select influencer" />
                </SelectTrigger>
                <SelectContent>
                    {INFLUENCERS.map((influencer) => (
                        <SelectItem key={influencer.id} value={influencer.id}>
                            <div className="flex items-center gap-2">
                                {influencer.defaultReferenceImages && influencer.defaultReferenceImages.length > 0 ? (
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                                        <img
                                            src={influencer.defaultReferenceImages[0]}
                                            alt={influencer.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold",
                                        isSensual
                                            ? "bg-gradient-to-br from-rose-500 to-rose-700"
                                            : isPorn
                                                ? "bg-gradient-to-br from-amber-500 to-amber-700"
                                                : "bg-gradient-to-br from-[#FF6B9D] to-[#4ECDC4]"
                                    )}>
                                        {influencer.name.charAt(0)}
                                    </div>
                                )}
                                {influencer.name}
                            </div>
                        </SelectItem>
                    ))}

                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 mx-1" />

                    <div className="p-1">
                        <button className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors group cursor-pointer outline-none select-none",
                            isPorn
                                ? "hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400"
                                : "hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400"
                        )}>
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform",
                                isPorn
                                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                    : "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
                            )}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </div>
                            <span className="font-medium">New Influencer</span>
                        </button>
                    </div>
                </SelectContent>
            </Select>

            {/* Profile Card */}
            <Card className={cn(
                "overflow-hidden shadow-sm hover:shadow-md transition-shadow",
                isSensual
                    ? "border-rose-200 dark:border-rose-800 dark:bg-rose-950/30"
                    : isPorn
                        ? "border-amber-200 dark:border-amber-800 dark:bg-amber-950/30"
                        : "border-gray-200 dark:border-gray-700 dark:bg-gray-800"
            )}>
                <CardContent className="p-0">
                    {/* Profile Image Placeholder */}
                    <div className={cn(
                        "h-32 relative",
                        isSensual
                            ? "bg-gradient-to-br from-rose-500/20 to-rose-700/20"
                            : isPorn
                                ? "bg-gradient-to-br from-amber-500/20 to-amber-700/20"
                                : "bg-gradient-to-br from-[#FF6B9D]/20 to-[#4ECDC4]/20"
                    )}>
                        {selectedInfluencer.defaultReferenceImages && selectedInfluencer.defaultReferenceImages.length > 0 ? (
                            <img
                                src={selectedInfluencer.defaultReferenceImages[0]}
                                alt={selectedInfluencer.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className={cn(
                                    "w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg",
                                    isSensual
                                        ? "bg-gradient-to-br from-rose-500 to-rose-700"
                                        : isPorn
                                            ? "bg-gradient-to-br from-amber-500 to-amber-700"
                                            : "bg-gradient-to-br from-[#FF6B9D] to-[#4ECDC4]"
                                )}>
                                    {selectedInfluencer.name.charAt(0)}
                                </div>
                            </div>
                        )}
                        {/* LLM System Prompt Editor Button */}
                        <InfluencerSettings influencerId={selectedInfluencer.id} />
                    </div>

                    {/* Info */}
                    <div className="p-4 text-center">
                        <h3 className={cn(
                            "font-semibold",
                            isSensual
                                ? "text-rose-800 dark:text-rose-200"
                                : isPorn
                                    ? "text-amber-600 dark:text-amber-200"
                                    : "text-gray-800 dark:text-gray-100"
                        )}>{selectedInfluencer.name}</h3>
                        <p className={cn(
                            "text-xs mt-1 line-clamp-2",
                            isSensual
                                ? "text-rose-600 dark:text-rose-400"
                                : isPorn
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-gray-500 dark:text-gray-400"
                        )}>
                            {selectedInfluencer.description}
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-2">
                            <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                isSensual
                                    ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                                    : isPorn
                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                        : "bg-[#FF6B9D]/10 text-[#FF6B9D]"
                            )}>
                                French-Laotian
                            </span>
                            <span className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                isSensual
                                    ? "bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-300"
                                    : isPorn
                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300"
                                        : "bg-[#4ECDC4]/10 text-[#4ECDC4]"
                            )}>
                                Lifestyle
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
