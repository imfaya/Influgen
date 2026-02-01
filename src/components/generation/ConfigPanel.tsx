'use client';

// Configuration panel for outputs, format, and resolution

import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGenerationStore } from '@/store';
import { ASPECT_RATIOS, OUTPUT_OPTIONS, MODELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function ConfigPanel() {
    const { parameters, setNumOutputs, setAspectRatio, setModel, setResolution, setIsMaxResolution, contentMode } = useGenerationStore();
    const isSensual = contentMode === 'sensual';
    const isPorn = contentMode === 'porn';

    // Colors based on mode
    const accentColor = isSensual ? '#c93a5e' : isPorn ? '#FFD700' : '#FF6B9D';
    const secondaryColor = isSensual ? '#a04668' : isPorn ? '#B8860B' : '#4ECDC4';

    return (
        <div className="space-y-5">
            {/* Model Selection */}
            <div className="space-y-2">
                <Label className={cn(
                    "text-xs",
                    isSensual ? "text-rose-600 dark:text-rose-400" : isPorn ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"
                )}>AI Model</Label>
                <Select value={parameters.model} onValueChange={setModel}>
                    <SelectTrigger className={cn(
                        "w-full text-sm transition-colors",
                        isSensual
                            ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 hover:border-rose-400"
                            : isPorn
                                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-400"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                    )}>
                        <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                        {MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                                <div className="flex items-center justify-between w-full gap-3">
                                    <span>{model.name}</span>
                                    <span className="text-xs text-gray-400 font-mono">${model.cost.toFixed(2)}/img</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>



            {/* Aspect Ratio */}
            <div className="space-y-2">
                <Label className={cn(
                    "text-xs",
                    isSensual ? "text-rose-600 dark:text-rose-400" : isPorn ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"
                )}>Image Format</Label>
                <div className="grid grid-cols-5 gap-1.5">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio.value}
                            onClick={() => setAspectRatio(ratio.value)}
                            className={cn(
                                'flex flex-col items-center p-2 rounded-lg border transition-all duration-200',
                                parameters.aspectRatio === ratio.value
                                    ? isSensual
                                        ? 'border-rose-500 bg-rose-500/10 shadow-sm'
                                        : isPorn
                                            ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                                            : 'border-[#FF6B9D] bg-[#FF6B9D]/5 shadow-sm'
                                    : isSensual
                                        ? 'border-rose-200 dark:border-rose-800 hover:border-rose-400'
                                        : isPorn
                                            ? 'border-amber-200 dark:border-amber-800 hover:border-amber-400'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-[#FF6B9D]/50'
                            )}
                        >
                            {/* Visual representation */}
                            <div className="flex items-center justify-center h-8 w-full">
                                <div
                                    className={cn(
                                        'border-2 rounded-sm transition-colors',
                                        parameters.aspectRatio === ratio.value
                                            ? isSensual ? 'border-rose-500' : isPorn ? 'border-amber-500' : 'border-[#FF6B9D]'
                                            : isSensual ? 'border-rose-300 dark:border-rose-700' : isPorn ? 'border-amber-300 dark:border-amber-700' : 'border-gray-300'
                                    )}
                                    style={{
                                        width: ratio.value === '16:9' ? '24px' :
                                            ratio.value === '4:3' ? '20px' :
                                                ratio.value === '1:1' ? '16px' :
                                                    ratio.value === '3:4' ? '14px' : '10px',
                                        height: ratio.value === '9:16' ? '24px' :
                                            ratio.value === '3:4' ? '20px' :
                                                ratio.value === '1:1' ? '16px' :
                                                    ratio.value === '4:3' ? '14px' : '10px',
                                    }}
                                />
                            </div>
                            <span className={cn(
                                "text-[10px] mt-1",
                                isSensual ? "text-rose-500 dark:text-rose-400" : isPorn ? "text-amber-500 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"
                            )}>{ratio.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Resolution Header - Removed Switch */}
            <div className="flex items-center justify-between mb-2">
                <Label className={cn(
                    "text-xs",
                    isSensual ? "text-rose-600 dark:text-rose-400" : isPorn ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"
                )}>Resolution</Label>
            </div>

            <div className={cn(
                "rounded-lg p-4 border transition-all duration-300 relative overflow-hidden",
                isSensual
                    ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                    : isPorn
                        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
            )}>
                <div className="flex items-end justify-between gap-4">
                    {/* MAX Text with Switch */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className={cn(
                                "text-4xl font-black italic tracking-tighter transition-all duration-300 block",
                                parameters.isMaxResolution
                                    ? isSensual
                                        ? "text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)] [text-shadow:2px_2px_0px_#9f1239,4px_4px_0px_rgba(0,0,0,0.2)]"
                                        : isPorn
                                            ? "text-amber-500 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)] [text-shadow:2px_2px_0px_#B8860B,4px_4px_0px_rgba(0,0,0,0.2)]"
                                            : "text-[#4ECDC4] drop-shadow-[0_0_10px_rgba(78,205,196,0.8)] [text-shadow:2px_2px_0px_#2A9D8F,4px_4px_0px_rgba(0,0,0,0.2)]"
                                    : "text-gray-300 dark:text-gray-600"
                            )}>
                                MAX
                            </span>
                        </div>
                        <Switch
                            checked={parameters.isMaxResolution}
                            onCheckedChange={setIsMaxResolution}
                            className={cn(
                                "mt-1",
                                isSensual
                                    ? "data-[state=checked]:bg-rose-500"
                                    : isPorn
                                        ? "data-[state=checked]:bg-amber-500"
                                        : "data-[state=checked]:bg-[#4ECDC4]"
                            )}
                        />
                    </div>

                    {/* Resolution Value Display */}
                    <div className="text-right">
                        <span className={cn(
                            "text-sm font-mono font-medium block",
                            isSensual ? "text-rose-700 dark:text-rose-200" : isPorn ? "text-amber-700 dark:text-amber-200" : "text-gray-700 dark:text-gray-200"
                        )}>
                            {parameters.resolution}
                        </span>
                        <span className={cn(
                            "text-[10px]",
                            isSensual ? "text-rose-400 dark:text-rose-500" : isPorn ? "text-amber-500 dark:text-amber-500" : "text-gray-400 dark:text-gray-500"
                        )}>
                            {parameters.isMaxResolution ? "Ultra HD" : "Custom"}
                        </span>
                    </div>
                </div>

                {/* Slider Control */}
                <div className="mt-4">
                    <Slider
                        disabled={parameters.isMaxResolution}
                        min={512}
                        max={(() => {
                            const [wRatio, hRatio] = parameters.aspectRatio.split(':').map(Number);
                            // Calculate max width such that neither width nor height exceeds 4096
                            // If wRatio > hRatio (Landscape): Max Width = 4096.
                            // If wRatio < hRatio (Portrait): Max Width = 4096 * (w/h).
                            // If wRatio == hRatio (Square): Max Width = 4096.
                            // Formula: Math.min(4096, 4096 * (wRatio / hRatio))
                            return Math.floor(Math.min(4096, 4096 * (wRatio / hRatio)));
                        })()}
                        step={64}
                        value={[parseInt(parameters.resolution.split('x')[0])]}
                        onValueChange={(vals) => {
                            const newWidth = vals[0];
                            const [wRatio, hRatio] = parameters.aspectRatio.split(':').map(Number);
                            const newHeight = Math.round(newWidth * (hRatio / wRatio));
                            setResolution(`${newWidth}x${newHeight}`);
                        }}
                        className={cn(
                            "py-2",
                            isSensual
                                ? parameters.isMaxResolution ? "[&_.absolute]:bg-rose-200" : "[&_.absolute]:bg-rose-500"
                                : isPorn
                                    ? parameters.isMaxResolution ? "[&_.absolute]:bg-amber-200" : "[&_.absolute]:bg-amber-500"
                                    : parameters.isMaxResolution ? "[&_.absolute]:bg-gray-200" : "[&_.absolute]:bg-[#4ECDC4]"
                        )}
                    />
                </div>
            </div>
        </div>
    );
}
