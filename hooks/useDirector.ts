
import { useState } from 'react';
import { DirectorPlan, DirectorShot, GeneratedAsset, AppMode, ModelAttributes, GenerationTier, GenerationResult } from '../types';
import { generateDirectorPlan } from '../services/ai/director';
import { generateStudioImage, generateInfluencerImage } from '../services/geminiService';
import { DirectorAgent, DIRECTOR_VARS } from '../services/ai/agents/directorAgent';
import { DEFAULT_MODEL, INITIAL_STUDIO, INITIAL_INFLUENCER } from '../data/constants';

export const useDirector = (
    activeProjectId: string | undefined,
    addAsset: (a: GeneratedAsset) => Promise<void>,
    trackUsage: (a: GeneratedAsset) => void,
    addToast: (msg: string, type?: any) => void
) => {
    const [plan, setPlan] = useState<DirectorPlan | null>(null);
    const [brief, setBrief] = useState("");
    const [isPlanning, setIsPlanning] = useState(false);
    const [isShooting, setIsShooting] = useState(false);
    const [castModel, setCastModel] = useState<ModelAttributes | null>(null);

    const suggestBrief = () => {
        setBrief(DirectorAgent.generateProceduralBrief());
    };

    const createPlan = async () => {
        if (!brief.trim()) return;
        setIsPlanning(true);
        try {
            const newPlan = await generateDirectorPlan(brief, castModel || undefined);
            setPlan(newPlan);
        } catch (e) {
            addToast("Failed to create plan", 'error');
        } finally {
            setIsPlanning(false);
        }
    };

    const executePlan = async () => {
        if (!plan || !activeProjectId) return;
        setIsShooting(true);

        const campaignModel: ModelAttributes = castModel ? {
            ...castModel,
            clothingStyle: plan.modelBrief.clothingStyle || castModel.clothingStyle
        } : {
            ...DEFAULT_MODEL,
            ...plan.modelBrief,
            id: 'director-temp-' + Date.now(),
            distinctiveFeatures: plan.modelBrief.clothingStyle || ""
        } as ModelAttributes;

        const shots = [...plan.shots];

        for (let i = 0; i < shots.length; i++) {
            const shot = shots[i];
            
            const updateShotStatus = (id: string, status: DirectorShot['status']) => {
                setPlan(prev => prev ? ({
                    ...prev,
                    shots: prev.shots.map(s => s.id === id ? { ...s, status } : s)
                }) : null);
            };

            updateShotStatus(shot.id, 'GENERATING');

            const attemptShot = async (isRetry: boolean = false) => {
                let result: GenerationResult;
                const baseVibe = `${plan.campaignName} Aesthetic. ${plan.modelBrief.clothingStyle || "Fashion"}`;

                // Delegate mapping to Agent to ensure consistency
                const { settings, mode } = DirectorAgent.mapShotToSettings(shot, baseVibe);

                if (mode === 'STUDIO') {
                    result = await generateStudioImage(campaignModel, settings as any, GenerationTier.RENDER);
                } else {
                    result = await generateInfluencerImage(campaignModel, settings as any, GenerationTier.RENDER);
                }
                return result;
            };

            try {
                const result = await attemptShot(false);
                await finalizeShot(result, i, shot, updateShotStatus, campaignModel);
            } catch (e) {
                console.warn(`Shot ${i} failed. Retrying with simplified prompt...`, e);
                try {
                    const retryResult = await attemptShot(true);
                    await finalizeShot(retryResult, i, shot, updateShotStatus, campaignModel);
                } catch (retryError) {
                    console.error(`Shot ${i} failed permanently.`, retryError);
                    updateShotStatus(shot.id, 'FAILED');
                }
            }
        }
        
        setIsShooting(false);
        addToast("Campaign Shoot Complete", 'success');
    };

    const finalizeShot = async (result: GenerationResult, index: number, shot: DirectorShot, updateStatus: any, model: ModelAttributes) => {
        const asset: GeneratedAsset = {
            id: Date.now().toString() + index,
            projectId: activeProjectId!,
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
            cost: 0.04
        };
        await addAsset(asset);
        trackUsage(asset);
        updateStatus(shot.id, 'DONE');
    };

    return {
        brief, setBrief,
        plan, setPlan,
        isPlanning, isShooting,
        castModel, setCastModel,
        createPlan, executePlan, suggestBrief
    };
};
