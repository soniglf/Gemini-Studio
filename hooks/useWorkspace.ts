
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGenerationStore } from '../stores/generationStore';
import { useUIStore } from '../stores/uiStore';
import { GenerationTier, AppMode } from '../types';
import { useStudioSettingsStore } from '../stores/studioSettingsStore';
import { useInfluencerSettingsStore } from '../stores/influencerSettingsStore';
import { useMotionSettingsStore } from '../stores/motionSettingsStore';

export const useWorkspace = (mode: AppMode.STUDIO | AppMode.INFLUENCER | AppMode.MOTION) => {
    const { 
        generate, isGenerating,
        locationPreviews, isPreviewLoading, fetchPreviews
    } = useGenerationStore();
    
    const { isPro, tier } = useUIStore(); // Use global tier

    // Dynamic Store Selection Strategy
    const storeSelector = useMemo(() => {
        if (mode === AppMode.STUDIO) return useStudioSettingsStore;
        if (mode === AppMode.INFLUENCER) return useInfluencerSettingsStore;
        return useMotionSettingsStore;
    }, [mode]);

    // Connect to the specific store
    // @ts-ignore - Types are compatible for generic settings usage
    const { settings, setSettings } = storeSelector();
    
    // Auto-fetch location previews when relevant fields change
    const locationKey = (settings as any).location ? 'location' : 'background';
    const locationValue = (settings as any)[locationKey];

    // Core Reactor: Centralized Side Effect for Previews
    useEffect(() => {
        if(locationValue && !locationPreviews.length) {
            const timer = setTimeout(() => {
                fetchPreviews();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [locationValue, fetchPreviews]);

    // Use global tier for generation
    const onGenerate = useCallback(() => generate(tier), [generate, tier]);

    const update = useCallback((field: string, value: any) => {
        (setSettings as any)({ ...settings, [field]: value });
    }, [settings, setSettings]);

    return {
        settings,
        update,
        isPro,
        tier, // Return tier for read-only usage if needed
        onGenerate,
        isGenerating,
        locationPreviews,
        isPreviewLoading,
        setSettings,
    };
};
