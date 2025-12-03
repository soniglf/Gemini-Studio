
import { useState, useEffect } from 'react';
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
    
    const { isPro } = useUIStore();
    const [tier, setTier] = useState<GenerationTier>(GenerationTier.RENDER);

    // DECOUPLED: Select the correct settings store based on the mode
    const { settings, setSettings } = 
        mode === AppMode.STUDIO ? useStudioSettingsStore() :
        mode === AppMode.INFLUENCER ? useInfluencerSettingsStore() :
        useMotionSettingsStore();
    
    const location = (settings as any).location || (settings as any).background;
    useEffect(() => {
        if(location) {
            fetchPreviews();
        }
    }, [location, fetchPreviews]);

    const onGenerate = () => generate(tier);

    const update = (field: string, value: any) => {
        setSettings({ ...settings, [field]: value } as any);
    };

    return {
        settings,
        update,
        isPro,
        tier,
        setTier,
        onGenerate,
        isGenerating,
        locationPreviews,
        isPreviewLoading,
        setSettings,
    };
};
