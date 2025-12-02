import { useState, useEffect } from 'react';
import { GeneratedAsset, AppMode, GenerationResult } from '../types';
import { useGenerationStore } from '../stores/generationStore';
import { useDirectorStore } from '../stores/directorStore';
import { useGalleryStore } from '../stores/galleryStore';
import { useModelStore } from '../stores/modelStore';
import { PngMetadataService } from '../services/utils/pngMetadata';
import { refineSettings } from '../services/geminiService';
import { useUIStore } from '../stores/uiStore';

export const usePreviewController = (onAssetSelect?: (asset: GeneratedAsset) => void) => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [compareMode, setCompareMode] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    
    const { isGenerating, lastGenerated, edit, restoreState, refine, applyRefinement, studioSettings, influencerSettings, motionSettings, setStudioSettings, setInfluencerSettings, setMotionSettings } = useGenerationStore();
    const { isShooting } = useDirectorStore();
    const { assets } = useGalleryStore();
    const { updateReferenceImage, model } = useModelStore();
    const { mode } = useUIStore();

    const activeData = lastGenerated || (assets && assets[0] ? assets[0] : null);
    
    // Accessors for union types
    const activePrompt = (activeData as GeneratedAsset)?.prompt || (activeData as GenerationResult)?.finalPrompt;
    const activeId = (activeData as GeneratedAsset)?.id;
    
    // Find previous version if this is a refinement/edit for Comparison
    const previousVersion = activeData && activePrompt?.startsWith('REFINED:') 
        ? assets.find(a => activePrompt.includes(a.prompt) && a.id !== activeId) 
        : null;

    const isLoading = isGenerating || isShooting;

    useEffect(() => {
        setIsEditing(false);
        setCompareMode(!!previousVersion);
    }, [activeId]);

    const handleShare = async () => {
        if (!activeData?.blob) return;
        try {
            const file = new File([activeData.blob], "gemini-creation.png", { type: activeData.blob.type });
            if (navigator.share) {
                await navigator.share({
                    files: [file],
                    title: 'Gemini Studio Creation',
                    text: 'Check out this AI asset I generated with Gemini Studio.',
                });
            }
        } catch (e) { console.error("Share failed", e); }
    };

    const handleDownload = async () => {
        if (!activeData?.blob) return;
        // Inject DNA
        const blobWithDNA = await PngMetadataService.injectMetadata(activeData.blob, activeData);
        const url = URL.createObjectURL(blobWithDNA);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemini_${activeId || 'preview'}.png`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyPrompt = () => {
        if(activePrompt) {
            navigator.clipboard.writeText(activePrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    const handleApplyEdit = (mask: Blob, prompt: string) => {
        if (!activeData?.blob) return;
        edit(activeData.blob, mask, prompt);
        setIsEditing(false);
    };

    const handleRestore = () => {
        if (activeData) restoreState(activeData);
    };

    const handleRefine = () => {
        if (activeData && 'id' in activeData) refine(activeData as GeneratedAsset);
    };

    const handleSetReference = () => {
        if (activeData?.url && model) {
            if(confirm(`Update ${model.name}'s official face reference to this image?`)) {
                updateReferenceImage(activeData.url);
            }
        }
    };

    const handleVoiceRefinement = async (instruction: string) => {
        setIsRefining(true);
        try {
            let currentSettings: any;
            if (mode === AppMode.STUDIO) currentSettings = studioSettings;
            else if (mode === AppMode.INFLUENCER) currentSettings = influencerSettings;
            else if (mode === AppMode.MOTION) currentSettings = motionSettings;
            else {
                setIsRefining(false);
                return;
            }

            const updates = await refineSettings(currentSettings, instruction, mode);
            applyRefinement(updates);
        } catch(e) {
            console.error(e);
        } finally {
            setIsRefining(false);
        }
    };

    const handleSeedReuse = () => {
        const settings = (activeData as GeneratedAsset)?.settings;
        if (settings?.seed) {
            applyRefinement({ seed: settings.seed });
        }
    };

    const isVideo = activeData?.url?.startsWith('data:video') || activeData?.blob?.type?.includes('video');

    return {
        // State
        activeData,
        assets,
        isLoading,
        showPrompt, setShowPrompt,
        copied,
        isEditing, setIsEditing,
        compareMode, setCompareMode,
        previousVersion,
        isVideo,
        isRefining,

        // Actions
        handleShare,
        handleDownload,
        copyPrompt,
        handleApplyEdit,
        handleRestore,
        handleRefine,
        handleSetReference,
        handleVoiceRefinement,
        handleSeedReuse
    };
};