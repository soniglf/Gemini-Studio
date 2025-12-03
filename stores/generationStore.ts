
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppMode, GeneratedAsset, StudioSettings, InfluencerSettings, MotionSettings, GenerationResult, GenerationTier, ModelAttributes, DirectorShot } from '../types';
import { generateStudioImage, generateInfluencerImage, generateVideo, editImage, refineImage } from '../services/geminiService';
import { attemptImageGeneration, attemptVideoGeneration } from '../services/ai/execution';
import { MODELS } from '../services/ai/config';
import { useUIStore } from './uiStore';
import { useModelStore } from './modelStore';
import { useBillingStore } from './billingStore';
import { useProjectStore } from './projectStore';
import { DirectorAgent } from '../services/ai/agents/directorAgent';
import { INITIAL_STUDIO, INITIAL_INFLUENCER, INITIAL_MOTION } from '../data/constants';

interface GenerationState {
    studioSettings: StudioSettings;
    influencerSettings: InfluencerSettings;
    motionSettings: MotionSettings;
    
    isGenerating: boolean;
    lastGenerated: GeneratedAsset | null;
    history: GeneratedAsset[];
    historyIndex: number;
    
    // Glass Box Interceptor
    interceptEnabled: boolean;
    pendingPrompt: { prompt: string, modelName: string, tier: GenerationTier, resolve: (p: string) => void, reject: () => void } | null;

    // Location Previews
    locationPreviews: string[];
    isPreviewLoading: boolean;

    // UI State
    lockedKeys: string[];

    setStudioSettings: (s: StudioSettings) => void;
    setInfluencerSettings: (s: InfluencerSettings) => void;
    setMotionSettings: (s: MotionSettings) => void;
    setLastGenerated: (asset: GeneratedAsset | null) => void;
    
    generate: (tier: GenerationTier) => Promise<void>;
    edit: (original: Blob, mask: Blob, prompt: string) => Promise<void>;
    refine: (asset: GeneratedAsset) => Promise<void>;
    
    // Interceptor Actions
    toggleIntercept: () => void;
    confirmGeneration: (editedPrompt: string) => void;
    cancelGeneration: () => void;
    
    // History Actions
    undo: () => void;
    redo: () => void;
    restoreState: (asset: GeneratedAsset) => void;
    hydrateFromDirector: (shot: DirectorShot) => void;

    // Locking
    toggleLock: (key: string) => void;

    fetchPreviews: () => Promise<void>;
    applyRefinement: (updates: Partial<StudioSettings | InfluencerSettings | MotionSettings>) => void;
}

export const useGenerationStore = create<GenerationState>()(
    persist(
        (set, get) => ({
            studioSettings: INITIAL_STUDIO,
            influencerSettings: INITIAL_INFLUENCER,
            motionSettings: INITIAL_MOTION,
            
            isGenerating: false,
            lastGenerated: null,
            history: [],
            historyIndex: -1,
            
            interceptEnabled: false,
            pendingPrompt: null,
            
            locationPreviews: [],
            isPreviewLoading: false,
            lockedKeys: [],

            setStudioSettings: (s) => set({ studioSettings: s }),
            setInfluencerSettings: (s) => set({ influencerSettings: s }),
            setMotionSettings: (s) => set({ motionSettings: s }),
            setLastGenerated: (asset) => set({ lastGenerated: asset }),

            toggleLock: (key) => set(state => {
                const locked = state.lockedKeys.includes(key) 
                    ? state.lockedKeys.filter(k => k !== key)
                    : [...state.lockedKeys, key];
                return { lockedKeys: locked };
            }),

            toggleIntercept: () => set(state => ({ interceptEnabled: !state.interceptEnabled })),

            confirmGeneration: (editedPrompt) => {
                const { pendingPrompt } = get();
                if (pendingPrompt) {
                    pendingPrompt.resolve(editedPrompt);
                    set({ pendingPrompt: null });
                }
            },

            cancelGeneration: () => {
                const { pendingPrompt } = get();
                if (pendingPrompt) {
                    pendingPrompt.reject();
                    set({ pendingPrompt: null, isGenerating: false });
                }
            },

            hydrateFromDirector: (shot) => {
                const { settings, mode } = DirectorAgent.mapShotToSettings(shot, "Director Mode");
                if (mode === 'STUDIO') set({ studioSettings: settings as StudioSettings });
                else set({ influencerSettings: settings as InfluencerSettings });
            },

            applyRefinement: (updates) => {
                const { mode } = useUIStore.getState();
                if (mode === AppMode.STUDIO) set(s => ({ studioSettings: { ...s.studioSettings, ...updates } }));
                else if (mode === AppMode.INFLUENCER) set(s => ({ influencerSettings: { ...s.influencerSettings, ...updates } }));
                else if (mode === AppMode.MOTION) set(s => ({ motionSettings: { ...s.motionSettings, ...updates } }));
            },

            generate: async (tier: GenerationTier) => {
                const { mode, addToast } = useUIStore.getState();
                const { model } = useModelStore.getState();
                const { activeProject } = useProjectStore.getState();
                const { trackUsage } = useBillingStore.getState();
                
                // Lazy load to avoid cycle, and await it properly
                const { addAsset } = await import('./galleryStore').then(m => m.useGalleryStore.getState());
                
                const { studioSettings, influencerSettings, motionSettings, interceptEnabled } = get();

                if (!activeProject) {
                    addToast("No Active Campaign", 'error');
                    return;
                }

                set({ isGenerating: true });

                try {
                    let result: GenerationResult;
                    const sessionId = Date.now().toString();
                    
                    // 1. DETERMINE PROMPT & MODEL
                    let settings: any = {};
                    let builderMethod: Function;
                    let modelName = "";

                    if (mode === AppMode.CREATOR) {
                        // Creator Mode Logic (Turnaround Sheet)
                        // Uses ImageAgent but with special handling
                        settings = { resolution: '2K', aspectRatio: '1:1', seed: undefined };
                        modelName = MODELS.IMAGE.PRO;
                    } else if (mode === AppMode.STUDIO) {
                        settings = studioSettings;
                        builderMethod = generateStudioImage;
                        modelName = tier === GenerationTier.RENDER ? MODELS.IMAGE.PRO : MODELS.IMAGE.FAST;
                    } else if (mode === AppMode.INFLUENCER) {
                        settings = influencerSettings;
                        builderMethod = generateInfluencerImage;
                        modelName = tier === GenerationTier.RENDER ? MODELS.IMAGE.PRO : MODELS.IMAGE.FAST;
                    } else if (mode === AppMode.MOTION) {
                        settings = motionSettings;
                        builderMethod = generateVideo;
                        modelName = tier === GenerationTier.SKETCH ? MODELS.VIDEO.FAST : MODELS.VIDEO.PRO;
                    }

                    // 2. BUILD PROMPT (And Intercept if needed)
                    let prompt = "";
                    if (mode === AppMode.CREATOR) {
                        const { ImageAgent } = await import('../services/ai/agents/imageAgent');
                        prompt = await ImageAgent.buildCreatorPrompt(model);
                    } else if (mode === AppMode.STUDIO) {
                        const { ImageAgent } = await import('../services/ai/agents/imageAgent');
                        prompt = await ImageAgent.buildStudioPrompt(model, settings, activeProject.customInstructions);
                    } else if (mode === AppMode.INFLUENCER) {
                        const { ImageAgent } = await import('../services/ai/agents/imageAgent');
                        prompt = await ImageAgent.buildInfluencerPrompt(model, settings, activeProject.customInstructions);
                    } else if (mode === AppMode.MOTION) {
                         const { VideoAgent } = await import('../services/ai/agents/videoAgent');
                         prompt = await VideoAgent.buildVideoPrompt(model, settings, activeProject.customInstructions);
                    }

                    // GLASS BOX INTERCEPTION
                    if (interceptEnabled) {
                        try {
                            prompt = await new Promise<string>((resolve, reject) => {
                                set({ pendingPrompt: { prompt, modelName, tier, resolve, reject } });
                            });
                        } catch (e) {
                            // Cancelled
                            return; 
                        }
                    }

                    // 3. EXECUTE GENERATION
                    const images: Record<string, string> = {};
                    const keyType = tier === GenerationTier.SKETCH ? 'FREE' : 'PAID';
                    const iterations = (mode === AppMode.STUDIO && settings.batchSize) ? settings.batchSize : 1;
                    
                    // CRITICAL FIX: Allow Identity/Reference images in ALL modes if strictness is active
                    if (model.strictness > 0) {
                         if (model.referenceImages && model.referenceImages.length > 0) {
                            model.referenceImages.slice(0, 3).forEach((ref, i) => images[`ref_${i}`] = ref);
                        } else if (model.referenceImage) {
                            images['face'] = model.referenceImage;
                        }
                    }

                    if (mode !== AppMode.CREATOR) {
                        if (settings.outfitImage) images['outfit'] = settings.outfitImage;
                        if (settings.productImage) images['product'] = settings.productImage;
                        if (settings.selectedLocationPreview) images['background_ref'] = settings.selectedLocationPreview;
                    }

                    if (model.accessoriesImage) images['accessories'] = model.accessoriesImage;

                    for(let i=0; i<iterations; i++) {
                        let blob: Blob | null = null;

                        if (mode === AppMode.MOTION) {
                            blob = await attemptVideoGeneration(modelName, prompt, settings.aspectRatio, settings.resolution, 'PAID', settings.sourceImage);
                            
                            if (!blob) throw new Error("Video generation failed to return valid data.");

                             result = { 
                                url: URL.createObjectURL(blob), 
                                blob: blob, 
                                finalPrompt: prompt, 
                                usedModel: modelName, 
                                keyType: 'PAID', 
                                tier, 
                                tags: ["Motion", "Video"],
                                sessionId
                            };
                        } else {
                             // Images
                             // Creator Mode forces 1:1 for the square turnaround sheet
                             const ratio = mode === AppMode.CREATOR ? '1:1' : (settings.aspectRatio || '1:1');
                             const res = mode === AppMode.CREATOR ? '2K' : (settings.resolution || '1K');

                             blob = await attemptImageGeneration(modelName, prompt, images, ratio, res, keyType, settings.seed);
                             
                             if (!blob) throw new Error("Image generation failed to return valid data.");

                             result = { 
                                url: URL.createObjectURL(blob), 
                                blob: blob, 
                                finalPrompt: prompt, 
                                usedModel: modelName, 
                                keyType, 
                                tier, 
                                tags: [mode, settings.vibe || "Reference"],
                                sessionId
                            };
                        }
                        
                        const asset: GeneratedAsset = {
                            id: Date.now().toString() + i,
                            projectId: activeProject.id,
                            url: result.url,
                            blob: result.blob,
                            type: result.tags?.includes('Video') ? 'VIDEO' : 'IMAGE',
                            prompt: result.finalPrompt,
                            timestamp: Date.now(),
                            mode: mode,
                            isMagic: false,
                            modelId: model.id,
                            usedModel: result.usedModel,
                            keyType: result.keyType,
                            tier: result.tier,
                            cost: 0.04,
                            settings: settings,
                            tags: result.tags,
                            sessionId
                        };

                        // 4. SAVE & DISPLAY
                        await addAsset(asset);
                        
                        set({ lastGenerated: asset });
                        set(s => {
                            const newHistory = [...s.history, asset];
                            return { history: newHistory, historyIndex: newHistory.length - 1 };
                        });
                        
                        trackUsage(asset);
                    }

                    addToast("Generation Complete", 'success');

                } catch (e: any) {
                    console.error("Generation Error", e);
                    addToast(e.message || "Generation Failed", 'error');
                } finally {
                    set({ isGenerating: false });
                }
            },

            edit: async (original, mask, prompt) => {
                const { activeProject } = useProjectStore.getState();
                const { model } = useModelStore.getState();
                
                set({ isGenerating: true });
                try {
                    const result = await editImage(original, mask, prompt);
                    
                    const asset: GeneratedAsset = {
                        id: Date.now().toString(),
                        projectId: activeProject!.id,
                        url: result.url,
                        blob: result.blob,
                        type: 'IMAGE',
                        prompt: result.finalPrompt,
                        timestamp: Date.now(),
                        mode: AppMode.STUDIO,
                        isMagic: true,
                        modelId: model.id,
                        usedModel: result.usedModel,
                        keyType: 'PAID',
                        tier: GenerationTier.RENDER,
                        cost: 0.02,
                        tags: ['Edited']
                    };

                    const galleryStore = await import('./galleryStore').then(m => m.useGalleryStore.getState());
                    await galleryStore.addAsset(asset);
                    set({ lastGenerated: asset });

                } catch (e: any) {
                    useUIStore.getState().addToast(e.message, 'error');
                } finally {
                    set({ isGenerating: false });
                }
            },

            refine: async (asset) => {
                 if (!asset.blob) return;
                 set({ isGenerating: true });
                 try {
                     const result = await refineImage(asset.blob, asset.prompt);
                     const newAsset = { ...asset, id: Date.now().toString(), url: result.url, blob: result.blob, prompt: "REFINED: " + asset.prompt, timestamp: Date.now() };
                     
                     const galleryStore = await import('./galleryStore').then(m => m.useGalleryStore.getState());
                     await galleryStore.addAsset(newAsset);
                     set({ lastGenerated: newAsset });
                 } catch (e: any) {
                     useUIStore.getState().addToast(e.message, 'error');
                 } finally {
                     set({ isGenerating: false });
                 }
            },

            undo: () => set(state => {
                if (state.historyIndex > 0) {
                    return { 
                        historyIndex: state.historyIndex - 1,
                        lastGenerated: state.history[state.historyIndex - 1]
                    };
                }
                return state;
            }),

            redo: () => set(state => {
                if (state.historyIndex < state.history.length - 1) {
                    return {
                        historyIndex: state.historyIndex + 1,
                        lastGenerated: state.history[state.historyIndex + 1]
                    };
                }
                return state;
            }),

            restoreState: (asset) => {
                 if (asset.settings) {
                     if (asset.mode === AppMode.STUDIO) set({ studioSettings: asset.settings as StudioSettings });
                     if (asset.mode === AppMode.INFLUENCER) set({ influencerSettings: asset.settings as InfluencerSettings });
                     if (asset.mode === AppMode.MOTION) set({ motionSettings: asset.settings as MotionSettings });
                     
                     useUIStore.getState().setMode(asset.mode);
                     useUIStore.getState().addToast("Settings Restored from DNA", 'success');
                 }
            },

            fetchPreviews: async () => {
                const { studioSettings, influencerSettings, motionSettings } = get();
                const { mode } = useUIStore.getState();
                
                let location = "";
                if (mode === AppMode.STUDIO) location = studioSettings.background;
                else if (mode === AppMode.INFLUENCER) location = influencerSettings.location;
                else if (mode === AppMode.MOTION) location = motionSettings.location;

                if (!location) return;

                set({ isPreviewLoading: true });
                const { generateLocationPreviews } = await import('../services/geminiService');
                const previews = await generateLocationPreviews(location);
                set({ locationPreviews: previews, isPreviewLoading: false });
            }
        }),
        {
            name: 'gemini-generation-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                studioSettings: state.studioSettings,
                influencerSettings: state.influencerSettings,
                motionSettings: state.motionSettings,
                lockedKeys: state.lockedKeys
            })
        }
    )
);
