
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DirectorPlan, DirectorShot, GeneratedAsset, AppMode, ModelAttributes, GenerationTier, GenerationResult, AuditReport } from '../types';
import { generateDirectorPlan } from '../services/ai/director';
import { generateStudioImage, generateInfluencerImage, auditCampaign } from '../services/geminiService';
import { DirectorAgent } from '../services/ai/agents/directorAgent';
import { DEFAULT_MODEL } from '../data/constants';
import { useUIStore } from './uiStore';
import { useProjectStore } from './projectStore';
import { useGalleryStore } from './galleryStore';
import { useBillingStore } from './billingStore';

interface DirectorState {
    plan: DirectorPlan | null;
    brief: string;
    isPlanning: boolean;
    isShooting: boolean;
    castModel: ModelAttributes | null;
    auditReport: AuditReport | null;
    isAuditing: boolean;

    setBrief: (s: string) => void;
    setCastModel: (m: ModelAttributes | null) => void;
    setPlan: (p: DirectorPlan | null) => void;
    suggestBrief: () => void;
    createPlan: () => Promise<void>;
    executePlan: () => Promise<void>;
    regenerateShot: (shotId: string, feedback: string) => Promise<void>;
    runAudit: () => Promise<void>;
    
    // CRUD Actions
    updateShot: (id: string, updates: Partial<DirectorShot>) => void;
    deleteShot: (id: string) => void;
    addShot: () => void;
}

// Helper for Concurrency limit
async function asyncPool(poolLimit: number, array: any[], iteratorFn: any) {
    const ret: Promise<any>[] = [];
    const executing: Promise<any>[] = [];
    for (const item of array) {
        const p = Promise.resolve().then(() => iteratorFn(item, array));
        ret.push(p);

        if (poolLimit <= array.length) {
            const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= poolLimit) {
                await Promise.race(executing);
            }
        }
    }
    return Promise.all(ret);
}

export const useDirectorStore = create<DirectorState>()(
    persist(
        (set, get) => ({
            plan: null,
            brief: "",
            isPlanning: false,
            isShooting: false,
            castModel: null,
            auditReport: null,
            isAuditing: false,

            setBrief: (brief) => set({ brief }),
            setCastModel: (castModel) => set({ castModel }),
            setPlan: (plan) => set({ plan }),

            suggestBrief: () => {
                set({ brief: DirectorAgent.generateProceduralBrief() });
            },

            createPlan: async () => {
                const { brief, castModel } = get();
                if (!brief.trim()) return;
                set({ isPlanning: true });
                try {
                    const newPlan = await generateDirectorPlan(brief, castModel || undefined);
                    set({ plan: newPlan });
                } catch (e) {
                    useUIStore.getState().addToast("Failed to create plan", 'error');
                } finally {
                    set({ isPlanning: false });
                }
            },

            executePlan: async () => {
                const { plan, castModel } = get();
                const { activeProject } = useProjectStore.getState();
                
                if (!plan || !activeProject) return;
                set({ isShooting: true });

                const campaignModel: ModelAttributes = castModel ? {
                    ...castModel,
                    clothingStyle: plan.modelBrief.clothingStyle || castModel.clothingStyle
                } : {
                    ...DEFAULT_MODEL,
                    ...plan.modelBrief,
                    id: 'director-temp-' + Date.now(),
                    distinctiveFeatures: plan.modelBrief.clothingStyle || ""
                } as ModelAttributes;

                const shotsToProcess = plan.shots.filter(s => s.status !== 'DONE');

                // PARALLEL EXECUTION PIPELINE
                const concurrency = 2; // Reduced slightly for better stability

                await asyncPool(concurrency, shotsToProcess, async (shot: DirectorShot) => {
                    set(state => ({ 
                        plan: state.plan ? { 
                            ...state.plan, 
                            shots: state.plan.shots.map(s => s.id === shot.id ? { ...s, status: 'GENERATING' } : s) 
                        } : null 
                    }));

                    try {
                        await executeSingleShot(shot, campaignModel, activeProject.id, activeProject.customInstructions);
                        
                        set(state => ({ 
                            plan: state.plan ? { 
                                ...state.plan, 
                                shots: state.plan.shots.map(s => s.id === shot.id ? { ...s, status: 'DONE' } : s) 
                            } : null 
                        }));
                    } catch (e) {
                        set(state => ({ 
                            plan: state.plan ? { 
                                ...state.plan, 
                                shots: state.plan.shots.map(s => s.id === shot.id ? { ...s, status: 'FAILED' } : s) 
                            } : null 
                        }));
                    }
                });

                set({ isShooting: false });
                useUIStore.getState().addToast("Campaign Shoot Complete", 'success');
            },

            runAudit: async () => {
                const { activeProject } = useProjectStore.getState();
                const { assets } = useGalleryStore.getState();
                if(!activeProject) return;

                set({ isAuditing: true });
                try {
                    const allTags = assets.flatMap(a => a.tags || []);
                    const report = await auditCampaign(activeProject, allTags);
                    set({ auditReport: report });
                    useUIStore.getState().addToast("Campaign Audit Complete", 'success');
                } catch(e) {
                    console.error(e);
                    useUIStore.getState().addToast("Audit Failed", 'error');
                } finally {
                    set({ isAuditing: false });
                }
            },

            regenerateShot: async (shotId: string, feedback: string) => {
                const { plan, castModel } = get();
                const { activeProject } = useProjectStore.getState();
                
                if (!plan || !activeProject) return;

                const shot = plan.shots.find(s => s.id === shotId);
                if(!shot) return;

                set({ plan: { ...plan, shots: plan.shots.map(s => s.id === shotId ? { ...s, status: 'GENERATING', feedback } : s) } });

                const campaignModel: ModelAttributes = castModel ? {
                    ...castModel,
                    clothingStyle: plan.modelBrief.clothingStyle || castModel.clothingStyle
                } : {
                    ...DEFAULT_MODEL,
                    ...plan.modelBrief,
                    id: 'director-temp-' + Date.now(),
                    distinctiveFeatures: plan.modelBrief.clothingStyle || ""
                } as ModelAttributes;

                try {
                     await executeSingleShot(shot, campaignModel, activeProject.id, activeProject.customInstructions, feedback);
                     set({ plan: { ...plan, shots: get().plan!.shots.map(s => s.id === shotId ? { ...s, status: 'DONE' } : s) } });
                     useUIStore.getState().addToast("Shot Regenerated with Feedback", 'success');
                } catch(e) {
                     set({ plan: { ...plan, shots: get().plan!.shots.map(s => s.id === shotId ? { ...s, status: 'FAILED' } : s) } });
                     useUIStore.getState().addToast("Regeneration Failed", 'error');
                }
            },

            updateShot: (id, updates) => {
                const { plan } = get();
                if(!plan) return;
                set({ plan: { ...plan, shots: plan.shots.map(s => s.id === id ? { ...s, ...updates } : s) } });
            },

            deleteShot: (id) => {
                const { plan } = get();
                if(!plan) return;
                set({ plan: { ...plan, shots: plan.shots.filter(s => s.id !== id) } });
            },

            addShot: () => {
                const { plan } = get();
                if(!plan) return;
                const newShot: DirectorShot = {
                    id: `shot-${Date.now()}`,
                    type: 'STUDIO',
                    description: "New shot description...",
                    visualDetails: "Lighting and camera details...",
                    status: 'PENDING'
                };
                set({ plan: { ...plan, shots: [...plan.shots, newShot] } });
            }
        }),
        {
            name: 'gemini-director-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                // Only persist data, not transient loading states
                plan: state.plan, 
                brief: state.brief, 
                castModel: state.castModel,
                auditReport: state.auditReport 
            })
        }
    )
);

async function executeSingleShot(shot: DirectorShot, model: ModelAttributes, projectId: string, projectContext?: string, feedback?: string) {
    const { addAsset } = useGalleryStore.getState();
    const { trackUsage } = useBillingStore.getState();
    const { plan } = useDirectorStore.getState();

    const baseVibe = `${plan?.campaignName || 'Campaign'} Aesthetic. ${plan?.modelBrief.clothingStyle || "Fashion"}`;
    const { settings, mode } = DirectorAgent.mapShotToSettings(shot, baseVibe);

    let result: GenerationResult;
    if (mode === 'STUDIO') {
        result = await generateStudioImage(model, settings as any, GenerationTier.RENDER, projectContext, feedback);
    } else {
        result = await generateInfluencerImage(model, settings as any, GenerationTier.RENDER, projectContext, feedback);
    }

    const asset: GeneratedAsset = {
        id: Date.now().toString(),
        projectId: projectId,
        url: result.url,
        blob: result.blob,
        type: 'IMAGE',
        prompt: result.finalPrompt,
        timestamp: Date.now(),
        mode: AppMode.DIRECTOR,
        isMagic: true,
        modelId: model.id,
        usedModel: result.usedModel,
        keyType: result.keyType,
        tier: result.tier,
        cost: 0.04,
        tags: result.tags
    };
    await addAsset(asset);
    trackUsage(asset);
}
