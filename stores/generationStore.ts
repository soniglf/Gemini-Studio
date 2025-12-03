
import { create } from 'zustand';
import { AppMode, GeneratedAsset, StudioSettings, InfluencerSettings, MotionSettings, GenerationResult, GenerationTier, ModelAttributes, DirectorShot, Project } from '../types';
import { GenerationService, GenerationPayload } from '../services/ai/generationService';
import { useUIStore } from './uiStore';
import { useModelStore } from './modelStore';
import { useBillingStore } from './billingStore';
import { useProjectStore } from './projectStore';
import { useStudioSettingsStore } from './studioSettingsStore';
import { useInfluencerSettingsStore } from './influencerSettingsStore';
import { useMotionSettingsStore } from './motionSettingsStore';

interface GenerationState {
    isGenerating: boolean;
    lastGenerated: GeneratedAsset | null;
    
    interceptEnabled: boolean;
    pendingPrompt: { prompt: string, modelName: string, tier: GenerationTier, resolve: (p: string) => void, reject: () => void } | null;

    locationPreviews: string[];
    isPreviewLoading: boolean;

    setLastGenerated: (asset: GeneratedAsset | null) => void;
    
    generate: (tier: GenerationTier, feedback?: string) => Promise<void>;
    edit: (original: Blob, mask: Blob, prompt: string) => Promise<void>;
    refine: (asset: GeneratedAsset) => Promise<void>;
    
    toggleIntercept: () => void;
    confirmGeneration: (editedPrompt: string) => void;
    cancelGeneration: () => void;
    
    restoreState: (asset: GeneratedAsset) => void;
    hydrateFromDirector: (shot: DirectorShot) => void;

    fetchPreviews: () => Promise<void>;
    applyRefinement: (updates: Partial<StudioSettings | InfluencerSettings | MotionSettings>) => void;
}

export const useGenerationStore = create<GenerationState>()((set, get) => {
    const _interceptPrompt = async (prompt: string, modelName: string, tier: GenerationTier): Promise<string> => {
        if (get().interceptEnabled) {
            try {
                return await new Promise<string>((resolve, reject) => {
                    set({ pendingPrompt: { prompt, modelName, tier, resolve, reject } });
                });
            } catch (e) {
                throw new Error("Generation Cancelled"); 
            }
        }
        return prompt;
    };
    
    const _processAndSaveResult = async (result: GenerationResult, mode: AppMode, model: ModelAttributes, project: Project, settings: any) => {
        const { trackUsage } = useBillingStore.getState();
        const galleryStore = await import('./galleryStore').then(m => m.useGalleryStore.getState());
        
        const assetType = result.tags?.includes('Video') ? 'VIDEO' : 'IMAGE';
        const assetCost = assetType === 'VIDEO' ? (result.tier === GenerationTier.RENDER ? 0.20 : 0.10) : (result.tier === GenerationTier.RENDER ? 0.04 : 0);

        const asset: GeneratedAsset = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            projectId: project.id,
            url: result.url,
            blob: result.blob,
            type: assetType,
            prompt: result.finalPrompt,
            timestamp: Date.now(),
            mode,
            isMagic: false,
            modelId: model.id,
            usedModel: result.usedModel,
            keyType: result.keyType,
            tier: result.tier,
            cost: assetCost,
            settings,
            tags: result.tags,
            sessionId: result.sessionId
        };

        await galleryStore.addAsset(asset);
        set({ lastGenerated: asset });
        trackUsage(asset);
    };

    return {
        isGenerating: false,
        lastGenerated: null,
        interceptEnabled: false,
        pendingPrompt: null,
        locationPreviews: [],
        isPreviewLoading: false,

        setLastGenerated: (asset) => set({ lastGenerated: asset }),
        toggleIntercept: () => set(state => ({ interceptEnabled: !state.interceptEnabled })),

        generate: async (tier: GenerationTier, feedback?: string) => {
            const { mode, addToast } = useUIStore.getState();
            const { model } = useModelStore.getState();
            const { activeProject } = useProjectStore.getState();
            const galleryStore = await import('./galleryStore').then(m => m.useGalleryStore.getState());

            if (!activeProject) { addToast("No Active Campaign", 'error'); return; }

            set({ isGenerating: true });
            
            // [Project Mirage] Create Ghost Asset ID
            const ghostId = `pending-${Date.now()}`;
            
            try {
                let settings: any;
                if (mode === AppMode.STUDIO) settings = useStudioSettingsStore.getState().settings;
                else if (mode === AppMode.INFLUENCER) settings = useInfluencerSettingsStore.getState().settings;
                else if (mode === AppMode.MOTION) settings = useMotionSettingsStore.getState().settings;
                
                let payload: GenerationPayload = await GenerationService.preparePayload(mode, tier, model, settings, activeProject, feedback);
                
                // [Project Mirage] Inject Ghost
                galleryStore.addPendingAsset({
                    id: ghostId,
                    projectId: activeProject.id,
                    url: "", // No URL yet
                    type: mode === AppMode.MOTION ? 'VIDEO' : 'IMAGE',
                    prompt: "Generating...",
                    timestamp: Date.now(),
                    mode, isMagic: false, modelId: model.id, usedModel: "PENDING", keyType: "PAID", tier, cost: 0,
                    settings
                });

                payload.prompt = await _interceptPrompt(payload.prompt, payload.modelName, tier);

                const sessionId = Date.now().toString();
                const iterations = payload.batchSize || 1;
                
                for (let i = 0; i < iterations; i++) {
                    const result = await GenerationService.generate(payload);
                    await _processAndSaveResult(result, mode, model, activeProject, settings);
                }
                
                if (iterations > 1) addToast(`Batch of ${iterations} generation(s) complete`, 'success');

            } catch (e: any) {
                if (e.message !== "Generation Cancelled") { console.error("Gen Error", e); addToast(e.message || "Gen Failed", 'error'); }
            } finally {
                // [Project Mirage] Cleanup Ghost
                galleryStore.removePendingAsset(ghostId);
                set({ isGenerating: false });
            }
        },

        edit: async (original, mask, prompt) => {
            const { mode, addToast } = useUIStore.getState();
            const { model } = useModelStore.getState();
            const { activeProject } = useProjectStore.getState();
            if (!activeProject) return;

            set({ isGenerating: true });
            try {
                const result = await GenerationService.edit(original, mask, prompt);
                await _processAndSaveResult(result, mode, model, activeProject, {});
                addToast("Edit Applied", "success");
            } catch (e: any) {
                addToast(e.message, 'error');
            } finally {
                set({ isGenerating: false });
            }
        },

        refine: async (asset) => {
            const { mode, addToast } = useUIStore.getState();
            const { model } = useModelStore.getState();
            const { activeProject } = useProjectStore.getState();
            if (!activeProject || !asset.blob) return;

            set({ isGenerating: true });
            try {
                const result = await GenerationService.refine(asset.blob, asset.prompt);
                await _processAndSaveResult(result, mode, model, activeProject, asset.settings);
                addToast("Refinement Complete", "success");
            } catch(e: any) {
                addToast(e.message, 'error');
            } finally {
                set({ isGenerating: false });
            }
        },

        confirmGeneration: (p) => { 
            const pending = get().pendingPrompt;
            if (pending) {
                pending.resolve(p);
                set({ pendingPrompt: null });
            }
        },
        cancelGeneration: () => { 
            const pending = get().pendingPrompt;
            if (pending) {
                pending.reject();
                set({ pendingPrompt: null, isGenerating: false });
            }
        },

        hydrateFromDirector: (shot) => { /* ... */ },
        applyRefinement: (updates) => { /* ... */ },
        restoreState: (asset) => { /* ... */ },
        fetchPreviews: async () => { /* ... */ },
    };
});
