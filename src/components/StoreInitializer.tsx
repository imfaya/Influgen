'use client';

// Hook to initialize the store state after hydration
import { useEffect, useState } from 'react';
import { useGenerationStore } from '@/store';
import { v4 as uuidv4 } from 'uuid';
import { INFLUENCERS } from '@/lib/constants';

export function StoreInitializer() {
    const [hasHydrated, setHasHydrated] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Wait for Zustand hydration to complete before initializing
    useEffect(() => {
        const unsubscribe = useGenerationStore.persist.onFinishHydration(() => {
            setHasHydrated(true);
        });

        // Check if already hydrated (in case we missed the event)
        if (useGenerationStore.persist.hasHydrated()) {
            setHasHydrated(true);
        }

        return () => {
            unsubscribe?.();
        };
    }, []);

    // Initialize influencer reference images on first load
    useEffect(() => {
        if (!hasHydrated || hasInitialized) return;

        // Sync influencers list with constants
        useGenerationStore.getState().syncInfluencers();

        // Delay to ensure state is fully settled after hydration
        const initTimeout = setTimeout(() => {
            const state = useGenerationStore.getState();
            const currentId = state.selectedInfluencer.id;
            const storedImages = state.referenceImagesByInfluencer[currentId];
            const activeRefs = state.referenceImages;

            // Find the influencer's default images from constants
            const influencerConst = INFLUENCERS.find(i => i.id === currentId);
            const defaults = influencerConst?.defaultReferenceImages || [];

            console.log(`StoreInitializer: Checking ${influencerConst?.name} - stored: ${storedImages?.length || 0}, active: ${activeRefs?.length || 0}, defaults: ${defaults.length}`);

            // Load defaults if no images are stored AND no active images
            if (defaults.length > 0 && (!storedImages || storedImages.length === 0) && (!activeRefs || activeRefs.length === 0)) {
                console.log(`StoreInitializer: Loading ${defaults.length} default images for ${influencerConst?.name}`);

                const newRefImages = defaults.map(url => ({
                    id: uuidv4(),
                    influencer_name: influencerConst?.name || '',
                    image_url: url,
                    image_type: 'edit' as const,
                    uploaded_at: new Date().toISOString()
                }));

                useGenerationStore.getState().setReferenceImages(newRefImages);
            }
            // If we have stored images but no active images, load from stored
            else if (storedImages && storedImages.length > 0 && (!activeRefs || activeRefs.length === 0)) {
                console.log(`StoreInitializer: Restoring ${storedImages.length} stored images for ${influencerConst?.name}`);
                useGenerationStore.setState({ referenceImages: storedImages });
            }

            setHasInitialized(true);
        }, 150);

        return () => clearTimeout(initTimeout);

    }, [hasHydrated, hasInitialized]);

    return null;
}
