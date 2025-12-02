
import { useCallback, useEffect } from 'react';
import { AppMode, GenerationTier, GeneratedAsset } from '../types';
import { useUIStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { useModelStore } from '../stores/modelStore';
import { useBillingStore } from '../stores/billingStore';
import { useGalleryStore } from '../stores/galleryStore';
import { useGenerationStore } from '../stores/generationStore';
import { useDirectorStore } from '../stores/directorStore';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { ProjectPacker } from '../services/io/projectPacker';

export const useAppController = () => {
    const { mode, mobileTab, isPro, isMobile, setMode, setMobileTab, togglePro, removeToast, setIsMobile, addToast, toasts } = useUIStore();
    const { loadProjects, activeProject } = useProjectStore();
    const { loadModels, setModel, model } = useModelStore();
    const { loadStats } = useBillingStore();
    const { loadAssets, loadCollections } = useGalleryStore();
    const { isGenerating, setLastGenerated, setStudioSettings, setInfluencerSettings, studioSettings, influencerSettings, generate } = useGenerationStore();
    const { executePlan } = useDirectorStore();

    // Initialization
    useEffect(() => {
        loadProjects();
        loadModels();
        loadStats();
        const chk = () => setIsMobile(window.innerWidth < 1024);
        chk(); window.addEventListener('resize', chk);
        return () => window.removeEventListener('resize', chk);
    }, []);

    // Load Assets and Collections when Project Changes
    useEffect(() => {
        if(activeProject) {
            loadAssets(activeProject.id);
            loadCollections(activeProject.id);
        }
    }, [activeProject]);

    // Auto-switch mobile tabs
    useEffect(() => { 
        if(isGenerating && isMobile) setMobileTab('PREVIEW'); 
    }, [isGenerating, isMobile]);

    // Handle Shortcuts
    const handleShortcutGenerate = useCallback(() => {
        if (mode === AppMode.DIRECTOR) {
            executePlan();
        } else if ([AppMode.CREATOR, AppMode.STUDIO, AppMode.INFLUENCER, AppMode.MOTION].includes(mode)) {
            generate(GenerationTier.RENDER);
        }
    }, [mode, generate, executePlan]);

    const handleShortcutSave = useCallback(async () => {
        if (activeProject) {
            try {
               const blob = await ProjectPacker.pack(activeProject.id);
               const url = URL.createObjectURL(blob);
               const a = document.createElement('a');
               a.href = url;
               a.download = `${activeProject.name.replace(/\s+/g, '_')}_QuickSave.gemini`;
               a.click();
               URL.revokeObjectURL(url);
               addToast("Quick Save (.gemini) Complete", 'success');
            } catch(e) { 
                console.error(e);
                addToast("Quick Save Failed", 'error');
            }
        }
    }, [activeProject, addToast]);

    useKeyboardShortcuts({
        onGenerate: handleShortcutGenerate,
        onSave: handleShortcutSave,
        onCancel: () => { /* Optional */ }
    });

    const handleRemix = (type: 'FACE' | 'OUTFIT' | 'REUSE', url: string) => {
        if (type === 'FACE') {
            setModel({ ...model, referenceImage: url });
            setMode(AppMode.CREATOR);
            addToast("Face reference updated", 'success');
            setMobileTab('EDITOR');
        } else if (type === 'OUTFIT') {
            if (mode === AppMode.STUDIO) setStudioSettings({ ...studioSettings, outfitImage: url });
            if (mode === AppMode.INFLUENCER) setInfluencerSettings({ ...influencerSettings, outfitImage: url });
            addToast("Outfit reference updated", 'success');
            setMobileTab('EDITOR');
        }
    };

    const handleAssetSelect = (asset: GeneratedAsset) => {
        setLastGenerated({
            url: asset.url,
            blob: asset.blob!,
            finalPrompt: asset.prompt,
            keyType: asset.keyType,
            tier: asset.tier,
            usedModel: asset.usedModel,
            tags: asset.tags
        });
    };

    return {
        // State
        mode, mobileTab, isPro, isMobile, toasts,
        
        // Actions
        setMobileTab, togglePro, removeToast,
        handleRemix, handleAssetSelect
    };
};
