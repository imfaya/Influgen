'use client';

// Individual image card with hover effects and actions

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useGenerationStore } from '@/store';

import { toast } from 'sonner';
import { uploadToDrive } from '@/lib/storage';

interface ImageCardProps {
    imageUrl: string;
    index: number;
    isSeries?: boolean;
    onDownload?: () => void;
    onContinueSeries?: () => void;
}

export function ImageCard({ imageUrl, index, isSeries = false, onDownload, onContinueSeries }: ImageCardProps) {
    const { setModalImage, contentMode } = useGenerationStore();
    const [isLoaded, setIsLoaded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleSendToPhone = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isUploading) return;

        setIsUploading(true);
        try {
            await uploadToDrive(imageUrl, contentMode);
            toast.success('Sent to Phone Drive!', {
                description: 'Image saved to your organized cloud folder.'
            });
        } catch (error) {
            console.error(error);
            toast.error('Failed to send to phone', {
                description: 'Please check your internet connection.'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `influgen-${Date.now()}-${index}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    return (
        <div
            className={cn(
                'group relative rounded-xl overflow-hidden bg-gray-100 cursor-pointer transition-all duration-300',
                'hover:shadow-lg hover:shadow-[#FF6B9D]/10',
                !isLoaded && 'animate-pulse'
            )}
            style={{
                animationDelay: `${index * 100}ms`,
            }}
        >
            {/* Image */}
            <img
                src={imageUrl}
                alt={`Generated image ${index + 1}`}
                className={cn(
                    'w-full h-auto object-cover transition-all duration-500',
                    isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                )}
                onLoad={() => setIsLoaded(true)}
                onClick={() => setModalImage(imageUrl)}
            />

            {/* Series Badge */}
            {isSeries && (
                <Badge
                    className="absolute top-2 left-2 bg-[#4ECDC4] text-white shadow-sm"
                >
                    📸 Series
                </Badge>
            )}

            {/* Overlay with actions */}
            <div className={cn(
                'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
                'flex items-end justify-center pb-4'
            )}>
                <div className="flex gap-2 flex-wrap justify-center">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white text-gray-700 shadow-lg"
                        onClick={() => setModalImage(imageUrl)}
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        View
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white text-gray-700 shadow-lg"
                        onClick={handleDownload}
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white text-gray-700 shadow-lg"
                        onClick={handleSendToPhone}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mr-1" />
                        ) : (
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        )}
                        Phone
                    </Button>
                    {onContinueSeries && (
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-[#4ECDC4]/90 hover:bg-[#4ECDC4] text-white shadow-lg"
                            onClick={onContinueSeries}
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            Continue
                        </Button>
                    )}
                </div>
            </div>

            {/* Loading placeholder */}
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#FF6B9D]/20 border-t-[#FF6B9D] rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
