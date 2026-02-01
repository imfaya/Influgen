'use client';

// History list component with filtering

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useHistory } from '@/hooks/useHistory';
import { HistoryItem } from './HistoryItem';
import { INFLUENCERS } from '@/lib/constants';
import { ContentMode } from '@/types';

interface HistoryListProps {
    filterMode?: ContentMode;
}

export function HistoryList({ filterMode }: HistoryListProps) {
    const { generations, filterHistory, deleteGeneration, reusePrompt, downloadImage } = useHistory();
    const [filter, setFilter] = useState<string>('all');
    const [seriesOnly, setSeriesOnly] = useState(false);

    // Filter by content mode first, then apply other filters
    const modeFilteredGenerations = filterMode
        ? generations.filter(g => (g.content_mode || 'social') === filterMode)
        : generations;

    const filteredGenerations = modeFilteredGenerations.filter(g => {
        const matchesInfluencer = filter === 'all' || g.influencer_name === filter;
        const matchesSeries = !seriesOnly || g.is_series;
        return matchesInfluencer && matchesSeries;
    });

    if (generations.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No history yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Generated images will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Filters */}
            <div className="flex gap-2">
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Filter by influencer" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Influencers</SelectItem>
                        {INFLUENCERS.map((inf) => (
                            <SelectItem key={inf.id} value={inf.name}>
                                {inf.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant={seriesOnly ? 'default' : 'outline'}
                    size="sm"
                    className={`h-8 text-xs ${seriesOnly ? 'bg-[#4ECDC4] hover:bg-[#4ECDC4]/90' : ''}`}
                    onClick={() => setSeriesOnly(!seriesOnly)}
                >
                    📸 Series
                </Button>
            </div>

            {/* History items */}
            <div className="space-y-2">
                {filteredGenerations.map((gen) => (
                    <HistoryItem
                        key={gen.id}
                        generation={gen}
                        onReusePrompt={() => reusePrompt(gen)}
                        onDelete={() => deleteGeneration(gen.id)}
                        onDownload={(url: string) => downloadImage(url)}
                    />
                ))}
            </div>

            {/* Empty filtered state */}
            {filteredGenerations.length === 0 && generations.length > 0 && (
                <div className="text-center py-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No matching results</p>
                    <Button
                        variant="link"
                        size="sm"
                        className="text-[#FF6B9D]"
                        onClick={() => {
                            setFilter('all');
                            setSeriesOnly(false);
                        }}
                    >
                        Clear filters
                    </Button>
                </div>
            )}
        </div>
    );
}
