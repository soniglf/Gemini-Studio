import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DirectorPlan, DirectorShot, GeneratedAsset, AppMode, ModelAttributes, GenerationTier, GenerationResult, AuditReport } from '../types';
import { GenerationService } from '../services/ai/generationService';
import { useUIStore } from './uiStore';
import { useProjectStore } from './projectStore';
import { useGalleryStore } from './galleryStore';
import { useBillingStore } from './billingStore';
import { useModelStore } from './modelStore';
import { useTaskManagerStore } from './taskManagerStore';

const DIRECTOR_STORE_VERSION = 2;

interface DirectorState {
    version: number;
    plan: DirectorPlan | null;
    brief: string;
    intensity: number;
    isPlanning: boolean;
    isShooting: boolean;
    castModel: ModelAttributes | null;
    auditReport: AuditReport | null;
    isAuditing: boolean;
    editingShotId: string | null;
    rejectingShotId: string | null;
    feedbackText: string;

    setBrief: (s: string) => void;
    setIntensity: (n: number) => void;
    setCastModel: (m: ModelAttributes | null) => void;
    setPlan: (p: DirectorPlan | null) => void;
    suggestBrief: () => void;
    createPlan: () => Promise<void>;
    executePlan: () => Promise<void>;
    regenerateShot: (shotId: string, feedback: string) => Promise<void>;
    runAudit: () => Promise<void>;
    updateShot: (id: string, updates: Partial<DirectorShot>) => void;
    deleteShot: (id: string) => void;
    addShot: () => void;
    startEditing: (id: string) => void;
    cancelEditing: () => void;
    startRejection: (id: string) => void;
    cancelRejection: () => void;
    setFeedbackText: (text: string) => void;
    submitRejection: () => Promise<void>;
}

async function asyncPool<T>(poolLimit: number, array: T[], iteratorFn: (item: T, array: T[]) => Promise<any>): Promise<any[]> {
    const ret: Promise<any>[] = [];
    const executing: Promise<any>[] = [];
    for (const item of array) {
        const p = Promise.resolve().then(() => iteratorFn(item, array));
        ret.push(p);
        if (poolLimit <= array.length) {
            const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= poolLimit) await Promise.race(executing);
        }
    }
    return Promise.all(ret);
}

const stripHeavyData = (model: ModelAttributes | null): ModelAttributes | null => {
    if (!model) return null;
    const { referenceImage, referenceImages, accessoriesImage, ...rest } = model;
    return rest as ModelAttributes;
};
const rehydrateModel = (lightModel: ModelAttributes | null): ModelAttributes | null => {
    if (!lightModel) return null;
    const fullModel = useModelStore.getState().savedModels.find(m => m.id === lightModel.id);
    return fullModel || lightModel;
};

export const useDirectorStore = create<DirectorState>()(
    persist(
        (set, get) => ({
            version: DIRECTOR_STORE_VERSION,
            plan: null, brief: "", intensity: 50, isPlanning: false, isShooting: false, castModel: null, auditReport: null, isAuditing: false,
            editingShotId: null, rejectingShotId: null, feedbackText: "",

            setBrief: (brief) => set({ brief }),
            setIntensity: (intensity) => set({ intensity }),
            setCastModel: (castModel) => set({ castModel }),
            setPlan: (plan) => set({ plan }),
            suggestBrief: () => set({ brief: GenerationService.generateProceduralBrief() }),

            createPlan: async () => {
                const { brief, castModel } = get();
                if (!brief.trim()) return;
                set({ isPlanning: true, plan: null });
                try {
                    const fullCastModel = rehydrateModel(castModel);
                    const newPlan = await GenerationService.generateDirectorPlan(brief, fullCastModel || undefined);
                    set({ plan: newPlan });
                } catch (e: any) {
                    useUIStore.getState().addToast(e.message, 'error');
                } finally {
                    set({ isPlanning: false });
                }
            },

            executePlan: async () => {
                const { plan, castModel, intensity, isShooting } = get();
                const { activeProject } = useProjectStore.getState();
                const { addTask, updateTask, removeTask } = useTaskManagerStore.getState();

                if (!plan || !activeProject || isShooting) return;

                const fullCastModel = rehydrateModel(castModel) || (plan.modelBrief as ModelAttributes);
                if (!fullCastModel) {
                    useUIStore.getState().addToast("Casting model not found.", 'error');
                    return;
                }

                const shotsToRun = plan.shots.filter(s => s.status === 'PENDING');
                if (shotsToRun.length === 0) return;

                set({ isShooting: true });
                const taskId = `campaign-${Date.now()}`;
                addTask({ id: taskId, name: `Shooting: ${plan.campaignName}`, status: 'running', progress: 0 });

                let completed = 0;

                const worker = async (shot: DirectorShot) => {
                    try {
                        set(state => ({ plan: { ...state.plan!, shots: state.plan!.shots.map(s => s.id === shot.id ? { ...s, status: 'GENERATING' } : s) }}));
                        const assetId = await executeSingleShot(shot, fullCastModel, activeProject.id, intensity, activeProject.customInstructions);
                        set(state => ({ plan: { ...state.plan!, shots: state.plan!.shots.map(s => s.id === shot.id ? { ...s, status: 'DONE', resultAssetId: assetId } : s) }}));
                    } catch (e) {
                        console.error("Shot failed:", e);
                        set(state => ({ plan: { ...state.plan!, shots: state.plan!.shots.map(s => s.id === shot.id ? { ...s, status: 'FAILED' } : s) }}));
                    } finally {
                        completed++;
                        updateTask(taskId, { progress: (completed / shotsToRun.length) * 100 });
                    }
                };

                await asyncPool(2, shotsToRun, worker);

                set({ isShooting: false });
                updateTask(taskId, { status: 'completed', message: 'Campaign shoot finished.' });
                setTimeout(() => removeTask(taskId), 5000);
            },
            
            regenerateShot: async (shotId, feedback) => {
                const { plan, castModel, intensity } = get();
                const { activeProject } = useProjectStore.getState();
                if (!plan || !activeProject) return;

                const shot = plan.shots.find(s => s.id === shotId);
                if (!shot) return;
                
                const fullCastModel = rehydrateModel(castModel) || (plan.modelBrief as ModelAttributes);
                
                set(state => ({ plan: { ...state.plan!, shots: state.plan!.shots.map(s => s.id === shotId ? { ...s, status: 'GENERATING', feedback } : s) }}));
                
                try {
                    const assetId = await executeSingleShot(shot, fullCastModel, activeProject.id, intensity, activeProject.customInstructions, feedback);
                    set(state => ({ plan: { ...state.plan!, shots: state.plan!.shots.map(s => s.id === shotId ? { ...s, status: 'DONE', resultAssetId: assetId, feedback: undefined } : s) }}));
                } catch (e) {
                    set(state => ({ plan: { ...state.plan!, shots: state.plan!.shots.map(s => s.id === shotId ? { ...s, status: 'FAILED' } : s) }}));
                }
            },

            runAudit: async () => {
                const { activeProject } = useProjectStore.getState();
                const { assets } = useGalleryStore.getState();
                if (!activeProject) return;

                set({ isAuditing: true, auditReport: null });
                try {
                    const tags = assets.flatMap(a => a.tags || []);
                    const report = await GenerationService.audit(activeProject, tags);
                    set({ auditReport: report });
                } catch (e: any) {
                    useUIStore.getState().addToast(e.message, 'error');
                } finally {
                    set({ isAuditing: false });
                }
            },
            updateShot: (id, updates) => set(state => state.plan ? { plan: { ...state.plan, shots: state.plan.shots.map(s => s.id === id ? { ...s, ...updates } : s) } } : {}),
            deleteShot: (id) => set(state => state.plan ? { plan: { ...state.plan, shots: state.plan.shots.filter(s => s.id !== id) } } : {}),
            addShot: () => set(state => state.plan ? { plan: { ...state.plan, shots: [...state.plan.shots, { id: `shot-${Date.now()}`, type: 'INFLUENCER', description: 'New shot', visualDetails: 'As per campaign vibe', status: 'PENDING' }]}} : {}),
            startEditing: (id) => set({ editingShotId: id }),
            cancelEditing: () => set({ editingShotId: null }),
            startRejection: (id) => set({ rejectingShotId: id, feedbackText: "" }),
            cancelRejection: () => set({ rejectingShotId: null, feedbackText: "" }),
            setFeedbackText: (text) => set({ feedbackText: text }),
            submitRejection: async () => {
                const { rejectingShotId, feedbackText } = get();
                if (rejectingShotId) {
                    await get().regenerateShot(rejectingShotId, feedbackText);
                    set({ rejectingShotId: null, feedbackText: "" });
                }
            },
        }),
        {
            name: 'gemini-director-store',
            storage: createJSONStorage(() => localStorage),
            version: DIRECTOR_STORE_VERSION,
            onRehydrateStorage: (state) => {
                if (state?.version !== DIRECTOR_STORE_VERSION) {
                    console.warn("Director store version mismatch, resetting plan.");
                    state?.setPlan(null);
                }
            },
            partialize: (state) => ({
                version: state.version,
                brief: state.brief,
                plan: state.plan,
                intensity: state.intensity,
                castModel: stripHeavyData(state.castModel)
            })
        }
    )
);

async function executeSingleShot(shot: DirectorShot, model: ModelAttributes, projectId: string, intensity: number, projectContext?: string, feedback?: string): Promise<string> {
    const { settings, mode } = GenerationService.mapShotToSettings(shot, model.visualVibe, intensity, projectContext);
    let result: GenerationResult;
    
    // [Project Chimera] Using the unified GenerationService compatibility wrappers
    if (mode === AppMode.STUDIO) {
        result = await GenerationService.generateStudio(model, settings as any, GenerationTier.RENDER, projectContext, feedback);
    } else {
        result = await GenerationService.generateInfluencer(model, settings as any, GenerationTier.RENDER, projectContext, feedback);
    }

    const asset: GeneratedAsset = {
        id: `asset-${Date.now()}`, projectId, url: result.url, blob: result.blob,
        type: 'IMAGE', prompt: result.finalPrompt, timestamp: Date.now(),
        mode, isMagic: false, modelId: model.id, usedModel: result.usedModel,
        keyType: result.keyType, tier: result.tier, cost: 0.04, settings, tags: result.tags
    };
    
    await useGalleryStore.getState().addAsset(asset);
    useBillingStore.getState().trackUsage(asset);
    return asset.id;
}
