'use client';

// Individual history item component

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Generation } from '@/types';
import { cn } from '@/lib/utils';

interface HistoryItemProps {
    generation: Generation;
    onReusePrompt: () => void;
    onDelete: () => void;
    onDownload: (url: string) => void;
}

export function HistoryItem({ generation, onReusePrompt, onDelete, onDownload }: HistoryItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const truncatePrompt = (prompt: string, maxLength = 50) => {
        if (prompt.length <= maxLength) return prompt;
        return prompt.substring(0, maxLength) + '...';
    };

    return (
        <Card className="p-3 hover:shadow-md transition-shadow border-gray-200">
            {/* Header */}
            <div className="flex items-start gap-2 mb-2">
                {/* Thumbnail */}
                {generation.image_urls[0] && (
                    <div
                        className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 cursor-pointer hover:ring-2 hover:ring-[#FF6B9D] transition-all"
                        onClick={() => setLightboxImage(generation.image_urls[0])}
                        title="Click to enlarge"
                    >
                        <img
                            src={generation.image_urls[0]}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mb-1">
                        {generation.tags?.includes('steal-it') ? (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-500/10 text-red-500 border border-red-500/20">
                                ⚡ Steal It{generation.is_series ? ' Series' : ''}
                            </Badge>
                        ) : generation.is_series && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-[#4ECDC4]/10 text-[#4ECDC4]">
                                📸 Series
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {generation.parameters.aspectRatio}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {generation.image_urls.length} img
                        </Badge>
                    </div>

                    {/* Prompt preview */}
                    <p
                        className="text-xs text-gray-600 cursor-pointer hover:text-gray-800"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? generation.prompt : truncatePrompt(generation.prompt)}
                    </p>

                    {/* Date */}
                    <p className="text-[10px] text-gray-400 mt-1">
                        {formatDate(generation.created_at)}
                    </p>
                </div>
            </div>

            {/* Expanded content: all images */}
            {isExpanded && generation.image_urls.length > 1 && (
                <div className="grid grid-cols-4 gap-1 mt-2 mb-2">
                    {generation.image_urls.map((url, idx) => (
                        <div
                            key={idx}
                            className="aspect-square rounded overflow-hidden bg-gray-100 cursor-pointer hover:ring-2 hover:ring-[#FF6B9D] transition-all"
                            onClick={() => setLightboxImage(url)}
                            title="Click to enlarge"
                        >
                            <img
                                src={url}
                                alt={`Image ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 text-gray-600 hover:text-[#FF6B9D]"
                    onClick={onReusePrompt}
                >
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reuse
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 text-gray-600 hover:text-[#4ECDC4]"
                    onClick={() => onDownload(generation.image_urls[0])}
                >
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                </Button>

                <div className="flex-1" />

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 text-gray-400 hover:text-red-500"
                    onClick={onDelete}
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </Button>
            </div>

            {/* Lightbox Dialog */}
            <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
                <DialogContent
                    className="max-w-4xl w-auto p-2 bg-black/90 border-0"
                    showCloseButton={true}
                >
                    {lightboxImage && (
                        <div className="relative">
                            <img
                                src={lightboxImage}
                                alt="Enlarged Image"
                                className="max-h-[85vh] max-w-full object-contain rounded-lg"
                            />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
                                    onClick={() => {
                                        onDownload(lightboxImage);
                                    }}
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
}
