'use client';

// Prompt generator with textarea, randomize button, and Start Shooting

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

import { useGeneration } from '@/hooks/useGeneration';
import { MAX_PROMPT_LENGTH, DEFAULT_LLM_SYSTEM_PROMPT, MODELS } from '@/lib/constants';
import { useGenerationStore } from '@/store';
import { cn } from '@/lib/utils';

export function PromptGenerator() {
    const {
        prompt,
        setPrompt,
        randomizePrompt,
        generate,
        isGenerating,
        isRandomizing,
        error,
        selectedInfluencer,
        parameters,
        generateBatchOG,
    } = useGeneration();

    // Calculate total cost based on model and number of outputs
    const selectedModel = MODELS.find(m => m.id === parameters.model);
    const costPerImage = selectedModel?.cost || 0.04;
    const totalCost = (costPerImage * parameters.numOutputs).toFixed(2);

    const [isEnhancing, setIsEnhancing] = React.useState(false);

    // Start Shooting Settings
    const [showShootingPicker, setShowShootingPicker] = React.useState(false);
    const [isClosing, setIsClosing] = React.useState(false);
    const [shootingCount, setShootingCount] = React.useState(5);
    const [isShootingInProgress, setIsShootingInProgress] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const closeShootingPicker = React.useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setShowShootingPicker(false);
            setIsClosing(false);
        }, 300);
    }, []);

    const toggleShootingPicker = () => {
        if (showShootingPicker) {
            closeShootingPicker();
        } else {
            setShowShootingPicker(true);
        }
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showShootingPicker && !isClosing && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                closeShootingPicker();
            }
        };

        if (showShootingPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showShootingPicker, isClosing, closeShootingPicker]);

    const { getInfluencerPrompt, contentMode } = useGenerationStore();

    const enhancePrompt = async () => {
        if (!prompt) return;
        setIsEnhancing(true);
        try {
            // Get custom system prompt or use default
            const customSystemPrompt = getInfluencerPrompt(selectedInfluencer.id);
            const systemPrompt = customSystemPrompt || DEFAULT_LLM_SYSTEM_PROMPT;

            const response = await fetch('/api/enhance-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    context: selectedInfluencer?.basePrompt,
                    systemPrompt: systemPrompt,
                    contentMode: contentMode,
                }),
            });
            const data = await response.json();
            if (data.enhancedPrompt) {
                setPrompt(data.enhancedPrompt);
            } else if (data.error) {
                // We might want to show a toast here, but for now just console/alert
                console.error(data.error);
                if (data.error.includes('GEMINI_API_KEY')) {
                    alert('Please configure GEMINI_API_KEY in .env.local');
                }
            }
        } catch (error) {
            console.error('Failed to enhance prompt', error);
        } finally {
            setIsEnhancing(false);
        }
    };

    const [isStealMode, setIsStealMode] = React.useState(false);
    const [stealImage, setStealImage] = React.useState<string | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);

    // Handle paste events for images
    React.useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!isStealMode) return;
            const items = e.clipboardData?.items;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const blob = items[i].getAsFile();
                        if (blob) handleFile(blob);
                        break;
                    }
                }
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [isStealMode]);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            // prompt error
            return;
        }

        // 1. Resize/Compress Client Side
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => (img.onload = resolve));

        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxSize = 1024;

        if (width > maxSize || height > maxSize) {
            if (width > height) {
                height = (height / width) * maxSize;
                width = maxSize;
            } else {
                width = (width / height) * maxSize;
                height = maxSize;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setStealImage(compressedBase64);

        // 2. Auto-Trigger Analysis & Generation
        await handleStealGeneration(compressedBase64);
    };

    const handleStealGeneration = async (imageData: string) => {
        setIsAnalyzing(true);
        try {
            // A. Analyze Image (Visual Description)
            const response = await fetch('/api/steal-it', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageData: imageData.split(',')[1] }),
            });
            const data = await response.json();

            if (data.prompt) {
                // Enforce 3072x4096 resolution (3:4 Ratio + Max Resolution)
                useGenerationStore.getState().setAspectRatio('3:4');
                useGenerationStore.getState().setIsMaxResolution(true);
                useGenerationStore.getState().clearSeries(); // Clear any ongoing series before starting Steal It

                // B. Generate with Image Reference + Analysis Prompt
                await generate(undefined, undefined, {
                    tags: ['steal-it'],
                    promptOverride: data.prompt, // Visual description
                    stealItImage: imageData // Visual input
                });

                // Reset after success? Maybe keep it to show what was stolen?
                // setStealImage(null); 
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Drag Handlers
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleStartShooting = async () => {
        if (isShootingInProgress) return;
        setIsShootingInProgress(true);
        setShowShootingPicker(false);
        try {
            await generateBatchOG(shootingCount);
        } finally {
            setIsShootingInProgress(false);
        }
    };

    const characterCount = prompt.length;
    const isOverLimit = characterCount > MAX_PROMPT_LENGTH;

    return (
        <div className="space-y-4">

            {/* Prompt Section with Start Shooting Button */}
            <div className="flex gap-4">
                {/* Left: Prompt Input */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {isStealMode ? "Steal Reality" : "Prompt"}
                            </Label>

                            {/* Mode Toggle */}
                            <button
                                onClick={() => setIsStealMode(!isStealMode)}
                                className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full border transition-all",
                                    isStealMode
                                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-200"
                                )}
                            >
                                {isStealMode ? "Disable Steal Mode" : "Enable Steal Mode"}
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    'text-xs',
                                    isOverLimit ? 'text-red-500' : 'text-gray-400'
                                )}
                            >
                                {characterCount} chars
                            </span>
                        </div>
                    </div>
                    <div className="relative">
                        {isStealMode ? (
                            <div
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => document.getElementById('steal-input')?.click()}
                                className={cn(
                                    "min-h-[120px] rounded-md border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer text-center p-4",
                                    isDragging
                                        ? "border-red-500 bg-red-500/5 scale-[0.99]"
                                        : "border-gray-300 dark:border-gray-700 hover:border-red-400 hover:bg-red-500/5",
                                    (isAnalyzing || stealImage) && "border-solid border-red-500/20 bg-red-500/5"
                                )}
                            >
                                <input
                                    id="steal-input"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                />

                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center gap-2 animate-pulse">
                                        <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                                        <span className="text-xs font-medium text-red-500">Stealing Reality...</span>
                                    </div>
                                ) : stealImage ? (
                                    <div className="relative group w-full h-full flex items-center justify-center">
                                        <img src={stealImage} alt="Stolen reference" className="max-h-[100px] rounded object-contain opacity-50 group-hover:opacity-30 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xs font-bold text-red-500 bg-white/80 dark:bg-black/80 px-2 py-1 rounded shadow-sm">
                                                Tap to steal another
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2 text-red-500">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-medium text-gray-400">
                                            Drag & Drop or Paste Image
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1 opacity-60">
                                            Auto-generates immediately
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to generate... Leave empty to use the default character description."
                                className={cn(
                                    'min-h-[120px] resize-none border-gray-200 focus:border-[#FF6B9D] focus:ring-[#FF6B9D]/20 transition-all pr-12'
                                )}
                            />
                        )}

                        {!isStealMode && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className={cn(
                                    "absolute top-2 right-2 h-8 w-8 p-0",
                                    contentMode === 'porn'
                                        ? "text-gray-400 hover:bg-transparent cursor-not-allowed opacity-50"
                                        : "text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                                )}
                                onClick={enhancePrompt}
                                disabled={isEnhancing || !prompt || contentMode === 'porn'}
                                title={contentMode === 'porn' ? "Enhancer disabled in Porn mode" : "Enhance with AI"}
                            >
                                {isEnhancing ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : contentMode === 'porn' ? (
                                    <div className="relative">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-full h-0.5 bg-current rotate-45 transform origin-center scale-125"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right: Start Shooting Vertical Button */}
                <div className="relative flex flex-col" ref={dropdownRef}>
                    <button
                        onClick={toggleShootingPicker}
                        disabled={isShootingInProgress || isGenerating}
                        className={cn(
                            "w-16 h-full min-h-[148px] rounded-xl transition-all duration-300",
                            "flex flex-col items-center justify-center gap-2",
                            "shadow-lg",
                            isShootingInProgress
                                ? "bg-gray-100 dark:bg-gray-800 cursor-wait"
                                : cn(
                                    "bg-gradient-to-b from-[#4ECDC4] to-[#26A69A]",
                                    "hover:from-[#5ADBE2] hover:to-[#4DB6AC]",
                                    "shadow-[0_4px_14px_0_rgba(78,205,196,0.39)] hover:shadow-[0_6px_20px_rgba(78,205,196,0.23)]",
                                    "hover:scale-[1.02] active:scale-[0.98]"
                                ),
                            "group cursor-pointer",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        {isShootingInProgress ? (
                            <svg className="w-6 h-6 text-[#4ECDC4] animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <>
                                <div className="p-2 bg-white/20 rounded-full mb-1 group-hover:bg-white/30 transition-colors">
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold text-white transition-colors uppercase tracking-wider text-center leading-tight drop-shadow-md">
                                    Batch<br />Shoot
                                </span>
                            </>
                        )}
                    </button>

                    {/* Shooting Count Picker Popup */}
                    {(showShootingPicker || isClosing) && (
                        <div className={cn(
                            "absolute top-0 right-full mr-3 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4 z-50",
                            isClosing
                                ? "animate-out fade-out slide-out-to-right-2 duration-300 [animation-fill-mode:forwards]"
                                : "animate-in fade-in slide-in-from-right-2 duration-300 [animation-fill-mode:forwards]"
                        )}>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                        Batch Generation
                                    </h4>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                        Generate multiple OG photos at once
                                    </p>
                                </div>

                                <div className="flex items-center justify-center py-2 relative">
                                    <span className="text-4xl font-black bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] bg-clip-text text-transparent">
                                        {shootingCount}
                                    </span>
                                    <span className="text-sm text-gray-400 ml-2 font-medium">photos</span>
                                </div>

                                <Slider
                                    value={[shootingCount]}
                                    max={20}
                                    min={1}
                                    step={1}
                                    onValueChange={(vals) => setShootingCount(vals[0])}
                                    className="my-2"
                                />

                                <div className="flex justify-between text-[10px] text-gray-400 -mt-2">
                                    <span>1</span>
                                    <span>20</span>
                                </div>

                                <Button
                                    onClick={handleStartShooting}
                                    className="w-full h-10 text-sm font-bold bg-gradient-to-r from-[#4ECDC4] to-[#26A69A] hover:from-[#5ADBE2] hover:to-[#4DB6AC] text-white rounded-lg shadow-lg shadow-[#4ECDC4]/20"
                                >
                                    Start Shooting (${(costPerImage * shootingCount).toFixed(2)})
                                </Button>
                            </div>

                            {/* Arrow pointing to button */}
                            <div className="absolute top-6 -right-2 w-3 h-3 bg-white dark:bg-gray-800 border-t border-r border-gray-200 dark:border-gray-700 transform rotate-45"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}



            {/* Action Buttons */}
            <div className="flex gap-3">
                {/* Randomize */}
                <Button
                    variant="outline"
                    onClick={randomizePrompt}
                    disabled={isRandomizing}
                    className="w-40 h-12 border-gray-200 hover:border-[#4ECDC4] hover:bg-[#4ECDC4]/5 transition-all"
                >
                    {isRandomizing ? (
                        <>
                            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Generating...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Randomize
                        </>
                    )}
                </Button>

                {/* Generate */}
                <Button
                    onClick={() => generate()}
                    disabled={isOverLimit}
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-[#FF6B9D] to-[#4ECDC4] hover:opacity-90 text-white shadow-lg shadow-[#FF6B9D]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#FF6B9D]/30"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate (${totalCost})
                </Button>
            </div>


        </div>
    );
}

