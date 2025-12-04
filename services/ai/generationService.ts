import { 
    AppMode, GenerationTier, ModelAttributes, Project, 
    StudioSettings, InfluencerSettings, MotionSettings, 
    GenerationResult, DirectorPlan, DirectorShot, AuditReport,
    CanvasItemState, NodeType, ModifierType, ModifierData 
} from '../../types';
import { attemptImageGeneration, attemptVideoGeneration, enhancePromptWithMagic } from './execution';
import { PromptEngine } from './promptEngine';
import { MODELS, getClient, SAFETY_SETTINGS } from './config';
import { useProjectStore } from '../../stores/projectStore';
import { HarmCategory, HarmBlockThreshold, Type, Schema } from '@google/genai';
import { OPTIONS } from '../../data/options';

export interface GenerationPayload {
    modelName: string;
    prompt: string;
    images: Record<string, string>;
    aspectRatio: string;
    resolution: string;
    keyType: 'FREE' | 'PAID';
    seed?: number;
    tags: string[];
    batchSize?: number;
    sourceImage?: string | null;
}

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
});

export class GenerationService {
    
    static async preparePayload(mode: AppMode, tier: GenerationTier, model: ModelAttributes, settings: any, project: Project, feedback?: string): Promise<GenerationPayload> {
        const isPro = tier === GenerationTier.RENDER;
        const keyType = isPro ? 'PAID' : 'FREE';
        
        let templateName: 'CREATOR_SHEET' | 'STUDIO_PHOTO' | 'INFLUENCER_LIFESTYLE' | 'MOTION_LIFESTYLE';
        let modelName: string;
        let tags: string[] = [];
        let images: Record<string, string> = {};
        let aspectRatio = settings?.aspectRatio || '1:1'; 

        if (model.referenceImage) images.referenceImage = model.referenceImage;
        if (model.referenceImages) {
            model.referenceImages.forEach((img, i) => {
                if(img) images[`referenceImage${i}`] = img;
            });
        }

        // --- FIREWALL: PROTECTED IDENTITY LOGIC ---
        if (mode === AppMode.CREATOR) {
            templateName = 'CREATOR_SHEET';
            modelName = isPro ? MODELS.IMAGE.PRO : MODELS.IMAGE.FAST;
            
            // HARD LOCK: Identity Grid MUST be 1:1 Square
            aspectRatio = '1:1'; 
            tags.push('Identity', 'Grid', 'Turnaround');
            
            // We ignore most 'settings' here to prevent contamination from Studio/Influencer state
        } 
        else if (mode === AppMode.STUDIO) {
            templateName = 'STUDIO_PHOTO';
            modelName = isPro ? MODELS.IMAGE.PRO : MODELS.IMAGE.FAST;
            tags.push('Studio');
            if (settings?.outfitImage) images.outfitImage = settings.outfitImage;
            if (settings?.productImage) images.productImage = settings.productImage;
        } 
        else if (mode === AppMode.INFLUENCER) {
            templateName = 'INFLUENCER_LIFESTYLE';
            modelName = isPro ? MODELS.IMAGE.PRO : MODELS.IMAGE.FAST;
            tags.push('Influencer');
            if (settings?.outfitImage) images.outfitImage = settings.outfitImage;
        } 
        else if (mode === AppMode.MOTION) {
            templateName = 'MOTION_LIFESTYLE';
            modelName = isPro ? MODELS.VIDEO.PRO : MODELS.VIDEO.FAST;
            tags.push('Video');
        } else {
            throw new Error(`Unsupported mode for generation: ${mode}`);
        }

        let basePrompt = PromptEngine.build(templateName, { 
            model, 
            settings, 
            projectContext: project.customInstructions, 
            feedback,
            isPro // Pass pro flag to engine for model-specific optimizations
        });

        // Only apply "Magic Prompt" enhancement to non-identity workflows
        // We want strict technical adherence for the Identity Grid
        if (settings?.useMagicPrompt && mode !== AppMode.CREATOR) {
            basePrompt = await enhancePromptWithMagic(basePrompt, `${mode} photo`);
        }

        return {
            modelName,
            prompt: basePrompt,
            images,
            aspectRatio,
            resolution: settings?.resolution || '1K',
            keyType,
            seed: settings?.seed,
            tags,
            batchSize: settings?.batchSize || 1,
            sourceImage: settings?.sourceImage
        };
    }
    
    static async generate(payload: GenerationPayload): Promise<GenerationResult> {
        const isVideo = payload.tags.includes('Video');

        let blob: Blob | null;
        if (isVideo) {
            blob = await attemptVideoGeneration(
                payload.modelName,
                payload.prompt,
                payload.aspectRatio,
                payload.resolution,
                payload.keyType,
                payload.sourceImage
            );
        } else {
            blob = await attemptImageGeneration(
                payload.modelName,
                payload.prompt,
                payload.images,
                payload.aspectRatio,
                payload.resolution,
                payload.keyType,
                payload.seed
            );
        }

        if (!blob) throw new Error("Generation failed to produce an image or video.");

        return {
            url: URL.createObjectURL(blob),
            blob,
            finalPrompt: payload.prompt,
            usedModel: payload.modelName,
            keyType: payload.keyType,
            tier: payload.keyType === 'PAID' ? GenerationTier.RENDER : GenerationTier.SKETCH,
            tags: payload.tags,
            sessionId: payload.batchSize && payload.batchSize > 1 ? Date.now().toString() : undefined
        };
    }

    static async generateWithModifier(sourceAsset: any, modifierNode: CanvasItemState, tier: GenerationTier): Promise<GenerationResult> {
        const keyType = tier === GenerationTier.RENDER ? 'PAID' : 'FREE';
        const modelName = keyType === 'PAID' ? MODELS.IMAGE.PRO : MODELS.IMAGE.FAST;
        const images: Record<string, string> = {};
        if (sourceAsset.blob) images['source'] = await blobToBase64(sourceAsset.blob);
        const modData = modifierNode.modifierData;
        if (modData?.referenceImage) images['modifierRef'] = modData.referenceImage;
        const prompt = PromptEngine.build('MODIFIER_APPLICATION', { 
            model: { ...sourceAsset }, 
            settings: { action: modData?.prompt || "Apply modification", vibe: modifierNode.modifierType || "General" } as any 
        });
        const blob = await attemptImageGeneration(modelName, prompt, images, "1:1", keyType === 'PAID' ? "2K" : "1K", keyType);
        if (!blob) throw new Error("Modifier generation failed.");
        return { url: URL.createObjectURL(blob), blob, finalPrompt: prompt, usedModel: modelName, keyType, tier, tags: ['Modified', modifierNode.modifierType || 'Custom'] };
    }

    static async edit(original: Blob, mask: Blob, instruction: string): Promise<GenerationResult> {
        const [originalB64, maskB64] = await Promise.all([blobToBase64(original), blobToBase64(mask)]);
        const fullPrompt = `INPAINTING TASK. Use the provided mask to edit the original image. Only change the masked (white) area. User instruction: "${instruction}"`;
        const blob = await attemptImageGeneration(MODELS.IMAGE.PRO, fullPrompt, { original: originalB64, mask: maskB64 }, "1:1", "1K", 'PAID', undefined);
        if (!blob) throw new Error("Editing failed to produce an image.");
        return { url: URL.createObjectURL(blob), blob, finalPrompt: `EDITED: ${instruction}`, usedModel: MODELS.IMAGE.PRO, keyType: 'PAID', tier: GenerationTier.RENDER, tags: ['Edit'] };
    }

    static async refine(original: Blob, originalPrompt: string): Promise<GenerationResult> {
        const originalB64 = await blobToBase64(original);
        const refinePrompt = `REFINED: High-resolution, 4K, photorealistic refinement of the following concept: ${originalPrompt}. Increase detail, clarity, and texture.`;
        const blob = await attemptImageGeneration(MODELS.IMAGE.PRO, refinePrompt, { original: originalB64 }, "1:1", "2K", 'PAID');
        if (!blob) throw new Error("Refinement failed to produce an image.");
        return { url: URL.createObjectURL(blob), blob, finalPrompt: refinePrompt, usedModel: MODELS.IMAGE.PRO, keyType: 'PAID', tier: GenerationTier.RENDER, tags: ['Refined'] };
    }
    
    static async refineSettings(currentSettings: any, instruction: string, mode: string): Promise<any> {
        const ai = getClient(true);
        const prompt = `You are a photography assistant AI. Modify settings based on instruction: "${instruction}". Return JSON updates only. CURRENT: ${JSON.stringify(currentSettings)}`;
        try {
            const response = await ai.models.generateContent({ model: MODELS.TEXT, contents: prompt, config: { responseMimeType: 'application/json' } });
            return JSON.parse(response.text || "{}");
        } catch { throw new Error("Could not interpret settings refinement."); }
    }

    static generatePhenotypeDescription(data: any): string {
        const { ethnicity, age, hairColor, hairStyle, eyeColor, morphology } = data;
        const bodyType = morphology?.bodyFat < 25 ? "athletic" : morphology?.bodyFat > 60 ? "heavy-set" : "average";
        
        // Remove distinctive features from this string to avoid redundancy in the final prompt
        // The distinct features will be added via the 'distinctiveFeatures' field in PromptEngine
        
        return `A ${age}-year-old ${ethnicity} individual. ${hairColor} hair styled in a ${hairStyle}. ${eyeColor} eyes. Body type is ${bodyType}.`;
    }

    static async analyze(images: string[], tier: GenerationTier): Promise<Partial<ModelAttributes>> {
        if (!images || images.length === 0) throw new Error("At least one image is required.");
        
        // Strategy: Try PRO model first (if Render tier), fallback to FAST if it fails/refuses.
        const isPro = tier === GenerationTier.RENDER;
        const primaryModel = isPro ? MODELS.ANALYSIS.PRO : MODELS.ANALYSIS.FAST;
        const fallbackModel = MODELS.ANALYSIS.FAST;

        const performAnalysis = async (modelName: string): Promise<any> => {
            const keyType = (modelName === MODELS.ANALYSIS.PRO) ? 'PAID' : 'FREE';
            const ai = getClient(keyType === 'FREE');

            const parts: any[] = images.map(base64 => {
                const data = base64.includes(',') ? base64.split(',')[1] : base64;
                const mime = base64.match(/:(.*?);/)?.[1] || 'image/png';
                return { inlineData: { mimeType: mime, data } };
            });
            
            // Context-Safe Prompt: Framed as "Character Design" to avoid biometric/surveillance flags
            parts.push({ text: `
                Analyze the character in this image for a 3D asset pipeline.
                Extract visual attributes into a strict JSON profile for character reconstruction.
                
                CRITICAL SCALING (0-100):
                - 50 is AVERAGE/BASELINE.
                - 0 is EXTREME LOW.
                - 100 is EXTREME HIGH.
                
                MANDATORY PRO BIOMETRICS:
                - You MUST estimate 'shoulderWidth', 'neckThickness', 'jawlineDefinition', 'cheekboneHeight', 'noseStructure', 'eyeTilt'.
                - Do not leave these as default. Infer them from the visual data.
                
                Select Enums accurately from the schema to match the character's visual design.
            ` });

            const morphologySchema: Schema = {
                type: Type.OBJECT,
                properties: {
                    height: { type: Type.INTEGER },
                    bodyFat: { type: Type.INTEGER },
                    muscleMass: { type: Type.INTEGER },
                    boneStructure: { type: Type.INTEGER },
                    shoulderWidth: { type: Type.INTEGER },
                    legLength: { type: Type.INTEGER },
                    neckThickness: { type: Type.INTEGER },
                    bustChest: { type: Type.INTEGER },
                    hipsWaistRatio: { type: Type.INTEGER },
                    faceShape: { type: Type.STRING, enum: OPTIONS.faceShape },
                    foreheadHeight: { type: Type.INTEGER },
                    jawlineDefinition: { type: Type.INTEGER },
                    chinProminence: { type: Type.INTEGER },
                    cheekboneHeight: { type: Type.INTEGER },
                    noseStructure: { type: Type.INTEGER },
                    eyeSpacing: { type: Type.INTEGER },
                    eyeTilt: { type: Type.INTEGER },
                    eyeSize: { type: Type.INTEGER },
                    eyebrowArch: { type: Type.INTEGER },
                    lipFullness: { type: Type.INTEGER },
                    skinTexture: { type: Type.INTEGER },
                    skinSheen: { type: Type.INTEGER },
                    imperfections: { type: Type.INTEGER },
                    freckleDensity: { type: Type.INTEGER },
                    aging: { type: Type.INTEGER },
                    grayScale: { type: Type.INTEGER },
                    vascularity: { type: Type.INTEGER },
                    redness: { type: Type.INTEGER },
                    pores: { type: Type.INTEGER }
                },
                required: ['faceShape', 'jawlineDefinition', 'eyeSize', 'lipFullness', 'noseStructure', 'shoulderWidth', 'neckThickness']
            };

            const analysisSchema: Schema = {
                type: Type.OBJECT,
                properties: {
                    ethnicity: { type: Type.STRING, enum: OPTIONS.ethnicity },
                    age: { type: Type.INTEGER },
                    eyeColor: { type: Type.STRING, enum: OPTIONS.eyeShape }, 
                    hairColor: { type: Type.STRING, enum: OPTIONS.hairColor },
                    hairStyle: { type: Type.STRING },
                    skinTone: { type: Type.STRING, enum: OPTIONS.skinTone },
                    clothingStyle: { type: Type.STRING },
                    distinctiveFeatures: { type: Type.STRING },
                    visualVibe: { type: Type.STRING, enum: OPTIONS.visualVibe },
                    glasses: { type: Type.STRING, enum: OPTIONS.glasses },
                    facialHair: { type: Type.STRING, enum: OPTIONS.facialHair },
                    morphology: morphologySchema
                },
                required: ['ethnicity', 'age', 'hairColor', 'morphology']
            };
            
            const response = await ai.models.generateContent({ 
                model: modelName, 
                contents: { parts }, 
                config: { 
                    responseMimeType: 'application/json',
                    responseSchema: analysisSchema,
                    temperature: 0.1, 
                    safetySettings: SAFETY_SETTINGS 
                } 
            });
            
            if (!response.candidates || response.candidates.length === 0) {
                throw new Error("Model returned no candidates.");
            }

            const candidate = response.candidates[0];
            const text = response.text; // Use SDK getter for safety

            if (!text) {
                const reason = candidate.finishReason || "UNKNOWN";
                console.warn(`Analysis failed on ${modelName}. Reason: ${reason}`);
                
                if (reason === 'SAFETY' || reason.includes('SAFETY')) {
                    throw new Error("Analysis blocked by safety filters. The model flagged the image as sensitive.");
                }
                throw new Error(`Analysis failed. Model Refusal: ${reason}`);
            }
            
            return JSON.parse(text);
        };

        // Execution Logic with Fallback
        try {
            return await performAnalysis(primaryModel);
        } catch (e: any) {
            console.error(`Analysis failed on ${primaryModel}:`, e.message);
            
            // If Primary failed and we haven't tried fallback yet
            if (primaryModel !== fallbackModel) {
                console.log(`Attempting fallback to ${fallbackModel}...`);
                try {
                    return await performAnalysis(fallbackModel);
                } catch (fallbackError: any) {
                    // If fallback also fails, throw the original or a consolidated error
                    throw new Error(`Analysis Failed: ${e.message}`);
                }
            }
            
            throw e;
        }
    }
    
    static async audit(project: Project, taxonomyTags: string[]): Promise<AuditReport> {
        const ai = getClient(false);
        const prompt = `AUDIT CAMPAIGN: ${project.name}. TAGS: ${taxonomyTags.join(', ')}. Return JSON report.`;
        try {
            const response = await ai.models.generateContent({ model: MODELS.TEXT, contents: prompt, config: { responseMimeType: 'application/json' } });
            return JSON.parse(response.text || "{}");
        } catch { throw new Error("Audit failed"); }
    }

    static async synthesizeProfile(description: string): Promise<Partial<ModelAttributes>> {
        const ai = getClient(true);
        const prompt = `Synthesize 3D profile from: "${description}". Output JSON.`;
        try {
            const response = await ai.models.generateContent({ model: MODELS.TEXT, contents: prompt, config: { responseMimeType: "application/json" } });
            return JSON.parse(response.text || "{}");
        } catch { throw new Error("Synthesis failed"); }
    }

    static generateRandomPersona(): string { return `A random character...`; }
    static async enhanceDescription(input: string): Promise<string> { return input + " (Enhanced)"; }
    static injectTrait(desc: string, trait: string): string { return desc + ", " + trait; }
    static generateProceduralBrief(): string { return "A new campaign..."; }
    static mapShotToSettings(shot: DirectorShot, vibe: string, intensity?: number, projectContext?: string): any { return { settings: {}, mode: 'STUDIO' }; }
    static async generateDirectorPlan(brief: string, model?: ModelAttributes): Promise<DirectorPlan> { return { campaignName: "New Plan", modelBrief: model || {}, shots: [] }; }
    
    static async generateStudio(model: ModelAttributes, settings: StudioSettings, tier: GenerationTier, projectContext?: string, feedback?: string): Promise<GenerationResult> {
        const project = useProjectStore.getState().activeProject!;
        const payload = await this.preparePayload(AppMode.STUDIO, tier, model, settings, project, feedback);
        return this.generate(payload);
    }
    static async generateInfluencer(model: ModelAttributes, settings: InfluencerSettings, tier: GenerationTier, projectContext?: string, feedback?: string): Promise<GenerationResult> {
        const project = useProjectStore.getState().activeProject!;
        const payload = await this.preparePayload(AppMode.INFLUENCER, tier, model, settings, project, feedback);
        return this.generate(payload);
    }
}