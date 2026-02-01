// Custom hook for history management with Supabase

import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useGenerationStore } from '@/store';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { Generation } from '@/types';

export function useHistory() {
    const {
        generations,
        setGenerations,
        moveToTrash,
        restoreFromTrash,
        setPrompt,
    } = useGenerationStore();

    // Load history from Supabase on mount
    useEffect(() => {
        if (!isSupabaseConfigured()) return;

        const loadHistory = async () => {
            try {
                const supabase = getSupabase();
                if (!supabase) return;

                const { data, error } = await supabase
                    .from('generations')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) {
                    console.error('Error loading history:', error);
                    return;
                }

                if (data) {
                    setGenerations(data as Generation[]);
                }
            } catch (err) {
                console.error('Error loading history:', err);
            }
        };

        loadHistory();
    }, [setGenerations]);

    // Delete a generation (soft delete - move to trash)
    const deleteGeneration = useCallback((id: string) => {
        const trashId = moveToTrash(id);
        if (trashId) {
            toast("Generation moved to trash", {
                action: {
                    label: 'Undo',
                    onClick: () => restoreFromTrash(trashId),
                },
                duration: 4000,
            });
        }
    }, [moveToTrash, restoreFromTrash]);

    // Reuse a prompt from history
    const reusePrompt = useCallback((gen: Generation) => {
        setPrompt(gen.prompt);
    }, [setPrompt]);

    // Filter history by criteria
    const filterHistory = useCallback((
        influencer?: string,
        seriesOnly?: boolean,
        dateFrom?: Date,
        dateTo?: Date
    ): Generation[] => {
        return generations.filter(gen => {
            if (influencer && gen.influencer_name !== influencer) return false;
            if (seriesOnly && !gen.is_series) return false;
            if (dateFrom && new Date(gen.created_at) < dateFrom) return false;
            if (dateTo && new Date(gen.created_at) > dateTo) return false;
            return true;
        });
    }, [generations]);

    // Download an image
    const downloadImage = useCallback(async (imageUrl: string, filename?: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `influgen-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading image:', err);
        }
    }, []);

    return {
        generations,
        deleteGeneration,
        reusePrompt,
        filterHistory,
        downloadImage,
    };
}
