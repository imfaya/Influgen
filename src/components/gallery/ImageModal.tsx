'use client';

// Full-size image modal viewer

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import { useGenerationStore } from '@/store';

export function ImageModal() {
    const [isGeneratingCaption, setIsGeneratingCaption] = React.useState(false);
    const [caption, setCaption] = React.useState('');
    const [hashtags, setHashtags] = React.useState<string[]>([]);
    const [showSidebar, setShowSidebar] = React.useState(true);
    const { selectedInfluencer, contentMode, modalImage, setModalImage, generations } = useGenerationStore();
    const isOpen = !!modalImage;
    const onClose = () => setModalImage(null);

    const handleDownload = async () => {
        if (!modalImage) return;
        try {
            const response = await fetch(modalImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `influgen-hd-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    // Reset state when image changes
    React.useEffect(() => {
        setCaption('');
        setHashtags([]);
    }, [modalImage]);

    // Auto-generate caption for Quick Post or Series
    React.useEffect(() => {
        if (!isOpen || !modalImage || caption || isGeneratingCaption) return;

        const currentGen = generations.find(g => g.image_urls.includes(modalImage));
        if (currentGen) {
            const isQuickPost = currentGen.tags?.includes('quick_post');
            const isSeries = currentGen.is_series;

            if (isQuickPost || isSeries) {
                generateCaption();
            }
        }
    }, [modalImage, isOpen, generations, caption, isGeneratingCaption]);

    const generateCaption = async () => {
        setIsGeneratingCaption(true);
        try {
            const response = await fetch('/api/generate-caption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    influencerName: selectedInfluencer.name,
                    imageDescription: 'A generated influencer photo',
                    contentMode: contentMode,
                }),
            });
            const data = await response.json();
            if (data.caption) {
                setCaption(data.caption);
                setHashtags(data.hashtags || []);
            }
        } catch (error) {
            console.error('Failed to generate caption', error);
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const copyText = (text: string) => {
        navigator.clipboard.writeText(text);
        // You might want to use a toast here instead of alert in production
    };

    if (!isOpen || !modalImage) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-0 focus:outline-none flex flex-row">
                <VisuallyHidden>
                    <DialogTitle>Image Preview</DialogTitle>
                </VisuallyHidden>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Post Studio Sidebar */}
                {showSidebar && (
                    <div className="w-[350px] h-full bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 z-40">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-2xl">✨</span> Post Studio
                        </h3>

                        {/* Caption Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-400">Caption</label>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                                        onClick={() => copyText(caption)}
                                        disabled={!caption}
                                        title="Copy Caption"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                    </Button>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={generateCaption}
                                    disabled={isGeneratingCaption}
                                    className="h-7 text-xs border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                                >
                                    {isGeneratingCaption ? 'Generating...' : '✨ Auto-Generate'}
                                </Button>
                            </div>
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Write a caption or generate one..."
                                className="w-full min-h-[120px] bg-gray-800 border-gray-700 rounded-lg p-3 text-sm text-gray-200 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        {/* Hashtags Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-400">Hashtags</label>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                                    onClick={() => copyText(hashtags.map(h => `#${h}`).join(' '))}
                                    disabled={hashtags.length === 0}
                                    title="Copy Hashtags"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                </Button>
                            </div>

                            {/* Combined Tag Input Area */}
                            <div
                                className="bg-gray-800 border-gray-700 rounded-lg p-3 min-h-[100px] flex flex-wrap gap-2 content-start focus-within:ring-1 focus-within:ring-purple-500 hover:border-gray-600 transition-colors cursor-text"
                                onClick={() => document.getElementById('hashtag-input')?.focus()}
                            >
                                {hashtags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="group bg-purple-500/20 text-purple-300 text-xs pl-2 pr-1 py-1 rounded-md flex items-center gap-1 hover:bg-purple-500/30 transition-colors"
                                    >
                                        #{tag}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newTags = [...hashtags];
                                                newTags.splice(i, 1);
                                                setHashtags(newTags);
                                            }}
                                            className="p-0.5 hover:bg-white/10 rounded-full text-purple-300/50 group-hover:text-purple-300 hover:text-red-400 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                                <input
                                    id="hashtag-input"
                                    type="text"
                                    placeholder={hashtags.length === 0 ? "Add hashtags..." : ""}
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-200 min-w-[120px] placeholder:text-gray-500 h-6 p-0 focus:ring-0"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = e.currentTarget.value;
                                            if (val) {
                                                const newTags = val.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
                                                const uniqueTags = newTags.filter(t => !hashtags.includes(t));
                                                if (uniqueTags.length > 0) {
                                                    setHashtags([...hashtags, ...uniqueTags]);
                                                }
                                                e.currentTarget.value = '';
                                            }
                                        }
                                        if (e.key === 'Backspace' && e.currentTarget.value === '' && hashtags.length > 0) {
                                            // Optional: Remove last tag on backspace if input is empty
                                            const newTags = [...hashtags];
                                            newTags.pop();
                                            setHashtags(newTags);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto pt-4 flex flex-col gap-3">
                            {/* Actions removed as requested, copy buttons are now inline */}
                        </div>
                    </div>
                )}

                {/* Image Container */}
                <div className="flex-1 flex items-center justify-center h-full relative bg-black/50">
                    <img
                        src={modalImage}
                        alt="Full size preview"
                        className="max-w-full max-h-full object-contain p-4"
                    />

                    {/* Bottom Floating Actions */}
                    <div className="absolute bottom-6 flex gap-4">
                        <Button
                            variant="secondary"
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10"
                        >
                            {showSidebar ? 'Hide Studio' : 'Show Studio'}
                        </Button>

                        <Button
                            variant="default"
                            onClick={handleDownload}
                            className="bg-white text-black hover:bg-gray-200"
                        >
                            Download HD
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
