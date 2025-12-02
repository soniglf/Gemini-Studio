import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppMode, GenerationTier, GenerationResult, StudioSettings, InfluencerSettings, MotionSettings, ModelAttributes, GeneratedAsset, DirectorShot } from '../types';
import { INITIAL_STUDIO, INITIAL_INFLUENCER, INITIAL_MOTION } from '../data/constants';
import { attemptImageGeneration, attemptVideoGeneration, generateLocationPreviews } from '../services/ai/execution';
import { ImageAgent } from '../services/ai/agents/imageAgent';
import { VideoAgent } from '../services/ai/agents/videoAgent';
import { EditAgent } from '../services/ai/agents/editAgent';
import { MODELS } from '../services/ai/config';
import { useUIStore } from './uiStore';
import { useProjectStore } from './projectStore';
import { useModelStore } from './modelStore';
import { useBillingStore } from './billingStore';
import { useGalleryStore } from './galleryStore';

// HELPER: Extracted execution logic
async function executeGeneration(
    prompt: string, 
    modelName: string, 
    config: any, 
    tier: GenerationTier, 
    mode: AppMode,
    model: ModelAttributes,
    activeProject: any,
    addAsset: (asset: GeneratedAsset) => Promise<void>,
    trackUsage: (asset: GeneratedAsset) => void,
    sessionId: string = `sess-${Date.now()}`
) {
    const { setLastGenerated } = useGenerationStore.getState();
    const { addToast } = useUIStore.getState();
    const settings = config.settings;

    let result: GenerationResult;
    const iterations = (mode === AppMode.STUDIO && settings.batchSize > 1) ? settings.batchSize : 1;
    
    // IMAGE PAYLOAD CONSTRUCTION
    const images: Record<string, string> = {};
    if (model.referenceImages && model.referenceImages.length > 0) {
        model.referenceImages.forEach((ref, index) => images[`face_${index}`] = ref);
    } else if (model.referenceImage) {
            images['face'] = model.referenceImage;
    }
    if (model.accessoriesImage) images['accessories'] = model.accessoriesImage;
    if (settings.outfitImage) images['outfit'] = settings.outfitImage;
    if (settings.productImage) images['product'] = settings.productImage;
    if (settings.selectedLocationPreview) images['background_ref'] = settings.selectedLocationPreview;

    for(let i=0; i<iterations; i++) {
        const keyType = tier === GenerationTier.SKETCH ? 'FREE' : 'PAID';
        
        let blob: Blob | null = null;

        if (mode === AppMode.MOTION) {
            // Motion requires separate handling for video
            blob = await attemptVideoGeneration(modelName, prompt, settings.aspectRatio, settings.resolution, 'PAID', settings.sourceImage);
             result = { 
                url: URL.createObjectURL(blob!), 
                blob: blob!, 
                finalPrompt: prompt, 
                usedModel: modelName, 
                keyType: 'PAID', 
                tier, 
                tags: ["Motion", "Video"],
                sessionId
            };
        } else {
             // Images
             blob = await attemptImageGeneration(modelName, prompt, images, settings.aspectRatio, settings.resolution, keyType, settings.seed);
             result = { 
                url: URL.createObjectURL(blob!), 
                blob: blob!, 
                finalPrompt: prompt, 
                usedModel: modelName, 
                keyType, 
                tier, 
                tags: [mode, settings.vibe || "Studio"],
                sessionId
            };
        }
        
        setLastGenerated(result);
        
        const asset: GeneratedAsset = {
            id: Date.now().toString() + i, 
            projectId: activeProject.id,
            sessionId: sessionId,
            url: result.url,
            blob: result.blob,
            type: mode === AppMode.MOTION ? 'VIDEO' : 'IMAGE',
            prompt: result.finalPrompt, timestamp: Date.now(), mode, isMagic: true, modelId: model.id,
            usedModel: result.usedModel, keyType: result.keyType, tier: result.tier,
            cost: result.keyType === 'FREE' ? 0 : (mode === AppMode.MOTION ? 0.20 : 0.04),
            settings: settings,
            tags: result.tags
        };
        
        await addAsset(asset);
        trackUsage(asset);
    }
    
    useGenerationStore.setState({ isGenerating: false });
    addToast("Generation Complete", 'success');
}

interface GenerationState {
    isGenerating: boolean;
    lastGenerated: GenerationResult | null;
    
    studioSettings: StudioSettings;
    influencerSettings: InfluencerSettings;
    motionSettings: MotionSettings;
    lockedKeys: string[];
    
    interceptEnabled: boolean;
    pendingPrompt: { prompt: string, modelName: string, config: any, tier: GenerationTier, mode: AppMode } | null;
    
    locationPreviews: string[];
    isPreviewLoading: boolean;

    history: any[]; 
    historyIndex: number;

    setStudioSettings: (s: StudioSettings) => void;
    setInfluencerSettings: (s: InfluencerSettings) => void;
    setMotionSettings: (s: MotionSettings) => void;
    toggleLock: (key: string) => void;
    toggleIntercept: () => void;
    
    generate: (tier: GenerationTier) => Promise<void>;
    confirmGeneration: (editedPrompt: string) => Promise<void>;
    cancelGeneration: () => void;
    
    edit: (original: Blob, mask: Blob, instruction: string) => Promise<void>;
    refine: (asset: GeneratedAsset) => Promise<void>;
    applyRefinement: (updates: any) => void;
    
    hydrateFromDirector: (shot: DirectorShot) => void;
    restoreState: (metadata: any) => void;
    
    fetchPreviews: () => Promise<void>;
    
    undo: () => void;
    redo: () => void;
    setLastGenerated: (res: GenerationResult) => void;
}

export const useGenerationStore = create<GenerationState>()(
    persist(
        (set, get) => ({
            isGenerating: false,
            lastGenerated: null,
            studioSettings: INITIAL_STUDIO,
            influencerSettings: INITIAL_INFLUENCER,
            motionSettings: INITIAL_MOTION,
            lockedKeys: [],
            interceptEnabled: false,
            pendingPrompt: null,
            locationPreviews: [],
            isPreviewLoading: false,
            history: [],
            historyIndex: -1,

            setStudioSettings: (s) => set(state => {
                 // Push to history if different
                 // Implementation of history logic is simplified here
                 return { studioSettings: s };
            }),
            setInfluencerSettings: (s) => set({ influencerSettings: s }),
            setMotionSettings: (s) => set({ motionSettings: s }),
            
            toggleLock: (key) => set(state => ({ 
                lockedKeys: state.lockedKeys.includes(key) 
                    ? state.lockedKeys.filter(k => k !== key) 
                    : [...state.lockedKeys, key] 
            })),
            
            toggleIntercept: () => set(state => ({ interceptEnabled: !state.interceptEnabled })),

            generate: async (tier) => {
                const { mode, addToast } = useUIStore.getState();
                const { activeProject } = useProjectStore.getState();
                const { model } = useModelStore.getState();
                const { studioSettings, influencerSettings, motionSettings, interceptEnabled } = get();

                if (!activeProject) return addToast("Select a campaign first", 'error');
                if (!model) return addToast("Select a model first", 'error');

                set({ isGenerating: true });

                try {
                    let prompt = "";
                    let modelName = "";
                    let config: any = {};

                    if (mode === AppMode.STUDIO) {
                        prompt = await ImageAgent.buildStudioPrompt(model, studioSettings, activeProject.customInstructions);
                        modelName = tier === GenerationTier.RENDER ? MODELS.IMAGE.PRO : MODELS.IMAGE.FAST;
                        config = { settings: studioSettings };
                    } else if (mode === AppMode.INFLUENCER) {
                        prompt = await ImageAgent.buildInfluencerPrompt(model, influencerSettings, activeProject.customInstructions);
                        modelName = tier === GenerationTier.RENDER ? MODELS.IMAGE.PRO : MODELS.IMAGE.FAST;
                        config = { settings: influencerSettings };
                    } else if (mode === AppMode.MOTION) {
                        prompt = await VideoAgent.buildVideoPrompt(model, motionSettings, activeProject.customInstructions);
                        modelName = tier === GenerationTier.SKETCH ? MODELS.VIDEO.FAST : MODELS.VIDEO.PRO; // Video tiers slightly different mapping
                        config = { settings: motionSettings };
                    }

                    if (interceptEnabled) {
                        set({ 
                            pendingPrompt: { prompt, modelName, config, tier, mode },
                            isGenerating: false
                        });
                        return;
                    }

                    await executeGeneration(
                        prompt, modelName, config, tier, mode, model, activeProject, 
                        useGalleryStore.getState().addAsset, 
                        useBillingStore.getState().trackUsage
                    );

                } catch (e: any) {
                    console.error(e);
                    addToast(e.message, 'error');
                    set({ isGenerating: false });
                }
            },

            confirmGeneration: async (editedPrompt) => {
                const { pendingPrompt } = get();
                if (!pendingPrompt) return;

                set({ pendingPrompt: null, isGenerating: true });
                const { activeProject } = useProjectStore.getState();
                const { model } = useModelStore.getState();

                try {
                    await executeGeneration(
                        editedPrompt, pendingPrompt.modelName, pendingPrompt.config, pendingPrompt.tier, pendingPrompt.mode, model, activeProject, 
                        useGalleryStore.getState().addAsset, 
                        useBillingStore.getState().trackUsage
                    );
                } catch (e: any) {
                    useUIStore.getState().addToast(e.message, 'error');
                    set({ isGenerating: false });
                }
            },

            cancelGeneration: () => set({ pendingPrompt: null, isGenerating: false }),

            edit: async (original, mask, instruction) => {
                 const { addToast } = useUIStore.getState();
                 const { activeProject } = useProjectStore.getState();
                 const { model } = useModelStore.getState();
                 set({ isGenerating: true });
                 try {
                     const result = await EditAgent.edit(original, mask, instruction);
                     set({ lastGenerated: result, isGenerating: false });
                     
                     // Add asset
                     if (activeProject) {
                         const asset: GeneratedAsset = {
                             id: Date.now().toString(),
                             projectId: activeProject.id,
                             url: result.url,
                             blob: result.blob,
                             type: 'IMAGE',
                             prompt: result.finalPrompt,
                             timestamp: Date.now(),
                             mode: AppMode.STUDIO,
                             isMagic: true,
                             modelId: model.id,
                             usedModel: result.usedModel,
                             keyType: result.keyType,
                             tier: result.tier,
                             cost: 0.04,
                             tags: ["Edit"]
                         };
                         useGalleryStore.getState().addAsset(asset);
                         useBillingStore.getState().trackUsage(asset);
                     }
                 } catch(e: any) {
                     addToast(e.message, 'error');
                     set({ isGenerating: false });
                 }
            },

            refine: async (asset) => {
                 const { addToast } = useUIStore.getState();
                 set({ isGenerating: true });
                 try {
                     if (!asset.blob) throw new Error("Asset data missing");
                     const result = await EditAgent.refine(asset.blob, asset.prompt);
                     set({ lastGenerated: result, isGenerating: false });
                     
                     // Add asset
                      const { activeProject } = useProjectStore.getState();
                     if (activeProject) {
                         const newAsset: GeneratedAsset = {
                             ...asset,
                             id: Date.now().toString(),
                             url: result.url,
                             blob: result.blob,
                             prompt: result.finalPrompt,
                             timestamp: Date.now(),
                             tier: result.tier,
                             tags: [...(asset.tags || []), "Refined"]
                         };
                         useGalleryStore.getState().addAsset(newAsset);
                         useBillingStore.getState().trackUsage(newAsset);
                     }
                 } catch(e: any) {
                     addToast(e.message, 'error');
                     set({ isGenerating: false });
                 }
            },

            applyRefinement: (updates) => {
                 const { mode, addToast } = useUIStore.getState();
                 if (mode === AppMode.STUDIO) set(s => ({ studioSettings: { ...s.studioSettings, ...updates } }));
                 else if (mode === AppMode.INFLUENCER) set(s => ({ influencerSettings: { ...s.influencerSettings, ...updates } }));
                 else if (mode === AppMode.MOTION) set(s => ({ motionSettings: { ...s.motionSettings, ...updates } }));
                 addToast("Settings Updated", 'success');
            },
            
            hydrateFromDirector: (shot) => {
                 if (shot.type === 'STUDIO') {
                     set(s => ({ studioSettings: { ...s.studioSettings, productDescription: shot.description, background: shot.visualDetails } }));
                 } else {
                     set(s => ({ influencerSettings: { ...s.influencerSettings, action: shot.description, location: shot.visualDetails } }));
                 }
            },
            
            restoreState: (metadata) => {
                const { addToast, setMode } = useUIStore.getState();
                if (metadata.mode) setMode(metadata.mode);
                if (metadata.settings) {
                    if (metadata.mode === AppMode.STUDIO) set({ studioSettings: metadata.settings });
                    else if (metadata.mode === AppMode.INFLUENCER) set({ influencerSettings: metadata.settings });
                    else if (metadata.mode === AppMode.MOTION) set({ motionSettings: metadata.settings });
                }
                if (metadata.usedModel) {
                     // Try to match model? Maybe complicated.
                }
                addToast("State Restored from Asset", 'success');
            },

            fetchPreviews: async () => {
                const { mode } = useUIStore.getState();
                let location = "";
                if (mode === AppMode.STUDIO) location = get().studioSettings.background;
                else if (mode === AppMode.INFLUENCER) location = get().influencerSettings.location;
                else if (mode === AppMode.MOTION) location = get().motionSettings.location;

                if (!location || location.length < 3) return;

                set({ isPreviewLoading: true });
                try {
                    const previews = await generateLocationPreviews(location);
                    set({ locationPreviews: previews, isPreviewLoading: false });
                } catch {
                    set({ isPreviewLoading: false });
                }
            },

            undo: () => { /* Simplified */ },
            redo: () => { /* Simplified */ },
            setLastGenerated: (res) => set({ lastGenerated: res })
        }),
        {
            name: 'gemini-generation-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                studioSettings: state.studioSettings,
                influencerSettings: state.influencerSettings,
                motionSettings: state.motionSettings,
                lockedKeys: state.lockedKeys,
                interceptEnabled: state.interceptEnabled
            })
        }
    )
);