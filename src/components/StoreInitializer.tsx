'use client';

// Hook to initialize the store state after hydration
import { useEffect, useState, useRef } from 'react';
import { useGenerationStore } from '@/store';
import { v4 as uuidv4 } from 'uuid';
// Influencers are loaded from the store (Supabase data), not constants
import { useAuth } from '@/components/providers/AuthContext';

export function StoreInitializer() {
    const [hasHydrated, setHasHydrated] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);
    const { user } = useAuth();
    const syncedUserRef = useRef<string | null>(null);

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

    // Sync user data when authenticated and store is ready
    useEffect(() => {
        if (!hasHydrated || !user) return;

        // Prevent double sync for same user
        if (syncedUserRef.current === user.id) return;

        const syncData = async () => {
            console.log('[StoreInitializer] Triggering user data sync for:', user.id);
            const success = await useGenerationStore.getState().loadUserData(user.id);

            if (success) {
                syncedUserRef.current = user.id;
            } else {
                console.warn('[StoreInitializer] Sync failed or aborted - will retry on next auth update');
            }
        };

        // Run sync immediately - no artificial delay needed
        syncData();

    }, [hasHydrated, user]);

    // Initialize influencer reference images on first load
    useEffect(() => {
        if (!hasHydrated || hasInitialized) return;

        // NOTE: Do NOT call syncInfluencers() here - it overwrites Supabase data with local constants
        // Influencers should only be loaded from Supabase via loadUserData()

        // Delay to ensure state is fully settled after hydration
        const initTimeout = setTimeout(() => {
            const state = useGenerationStore.getState();
            const currentId = state.selectedInfluencer.id;
            const storedImages = state.referenceImagesByInfluencer[currentId];
            const activeRefs = state.referenceImages;

            // Find the influencer from the STORE (Supabase data), not constants
            const influencerFromStore = state.influencers.find(i => i.id === currentId);
            const defaults = influencerFromStore?.defaultReferenceImages || [];

            console.log(`StoreInitializer: Checking ${influencerFromStore?.name || currentId} - stored: ${storedImages?.length || 0}, active: ${activeRefs?.length || 0}, defaults: ${defaults.length}`);

            // Load defaults if no images are stored AND no active images
            if (defaults.length > 0 && (!storedImages || storedImages.length === 0) && (!activeRefs || activeRefs.length === 0)) {
                console.log(`StoreInitializer: Loading ${defaults.length} default images for ${influencerFromStore?.name}`);

                const newRefImages = defaults.map(url => ({
                    id: uuidv4(),
                    influencer_name: influencerFromStore?.name || '',
                    image_url: url,
                    image_type: 'edit' as const,
                    uploaded_at: new Date().toISOString()
                }));

                useGenerationStore.getState().setReferenceImages(newRefImages);
            }
            // If we have stored images but no active images, load from stored
            else if (storedImages && storedImages.length > 0 && (!activeRefs || activeRefs.length === 0)) {
                console.log(`StoreInitializer: Restoring ${storedImages.length} stored images for ${influencerFromStore?.name}`);
                useGenerationStore.setState({ referenceImages: storedImages });
            }

            setHasInitialized(true);
        }, 150);

        return () => clearTimeout(initTimeout);

    }, [hasHydrated, hasInitialized]);

    return null;
}
