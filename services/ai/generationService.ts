
import { AppMode, GenerationTier, ModelAttributes, StudioSettings, InfluencerSettings, MotionSettings, Project, GenerationResult, AuditReport, DirectorPlan, DirectorShot } from "../../types";
import { MODELS, getClient } from "./config";
import { PromptEngine } from "./promptEngine";
import { enhancePromptWithMagic, attemptImageGeneration, attemptVideoGeneration } from "./execution";
import { DEFAULT_MORPHOLOGY } from "../../data/defaults";
import { DIRECTOR_VARS, MUTATION_TRAITS } from "../../data/presets";
import { INITIAL_STUDIO, INITIAL_INFLUENCER } from "../../data/defaults";
import { useProjectStore } from "../../stores/projectStore";
import { Type } from "@google/genai";

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

export class GenerationService {
    
    static async preparePayload(mode: AppMode, tier: GenerationTier, model: ModelAttributes, settings: any, project: Project, feedback?: string): Promise<GenerationPayload> {
        const isPro = tier === GenerationTier.RENDER;
        const keyType = isPro ? 'PAID' : 'FREE';
        
        let templateName: 'CREATOR_SHEET' | 'STUDIO_PHOTO' | 'INFLUENCER_LIFESTYLE' | 'MOTION_LIFESTYLE';
        let modelName: string;
        let tags: string[] = [];
        let images: Record<string, string> = {};

        if (model.referenceImage) images.referenceImage = model.referenceImage;
        if (model.referenceImages) {
            model.referenceImages.forEach((img, i) => {
                if(img) images[`referenceImage${i}`] = img;
            });
        }

        if (settings?.outfitImage) images.outfitImage = settings.outfitImage;
        if (settings?.productImage) images.productImage = settings.productImage;

        switch(mode) {
            case AppMode.CREATOR:
                templateName = 'CREATOR_SHEET';
                modelName = MODELS.IMAGE.PRO;
                tags.push('Turnaround');
                break;
            case AppMode.STUDIO:
                templateName = 'STUDIO_PHOTO';
                modelName = isPro ? MODELS.IMAGE.PRO : MODELS.IMAGE.FAST;
                tags.push('Studio');
                break;
            case AppMode.INFLUENCER:
                templateName = 'INFLUENCER_LIFESTYLE';
                modelName = isPro ? MODELS.IMAGE.PRO : MODELS.IMAGE.FAST;
                tags.push('Influencer');
                break;
            case AppMode.MOTION:
                templateName = 'MOTION_LIFESTYLE';
                modelName = isPro ? MODELS.VIDEO.PRO : MODELS.VIDEO.FAST;
                tags.push('Video');
                break;
            default:
                throw new Error(`Unsupported mode for generation: ${mode}`);
        }

        let basePrompt = PromptEngine.build(templateName, { model, settings, projectContext: project.customInstructions, feedback });
        if (settings?.useMagicPrompt && mode !== AppMode.CREATOR) {
            basePrompt = await enhancePromptWithMagic(basePrompt, `${mode} photo`);
        }

        return {
            modelName,
            prompt: basePrompt,
            images,
            aspectRatio: settings?.aspectRatio || '1:1',
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

    static async edit(original: Blob, mask: Blob, instruction: string): Promise<GenerationResult> {
        const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    
        const [originalB64, maskB64] = await Promise.all([
            blobToBase64(original),
            blobToBase64(mask),
        ]);
        
        const fullPrompt = `INPAINTING TASK. Use the provided mask to edit the original image. Only change the masked (white) area. User instruction: "${instruction}"`;
    
        const blob = await attemptImageGeneration(
            MODELS.IMAGE.PRO,
            fullPrompt,
            { original: originalB64, mask: maskB64 },
            "1:1",
            "1K",
            'PAID',
            undefined
        );
    
        if (!blob) throw new Error("Editing failed to produce an image.");
    
        return {
            url: URL.createObjectURL(blob),
            blob,
            finalPrompt: `EDITED: ${instruction}`,
            usedModel: MODELS.IMAGE.PRO,
            keyType: 'PAID',
            tier: GenerationTier.RENDER,
            tags: ['Edit']
        };
    }

    static async refine(original: Blob, originalPrompt: string): Promise<GenerationResult> {
        const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    
        const originalB64 = await blobToBase64(original);
    
        const refinePrompt = `REFINED: High-resolution, 4K, photorealistic refinement of the following concept: ${originalPrompt}. Increase detail, clarity, and texture.`;
    
        const blob = await attemptImageGeneration(
            MODELS.IMAGE.PRO,
            refinePrompt,
            { original: originalB64 },
            "1:1",
            "2K",
            'PAID'
        );
        
        if (!blob) throw new Error("Refinement failed to produce an image.");
        
        return {
            url: URL.createObjectURL(blob),
            blob,
            finalPrompt: refinePrompt,
            usedModel: MODELS.IMAGE.PRO,
            keyType: 'PAID',
            tier: GenerationTier.RENDER,
            tags: ['Refined']
        };
    }
    
    static async refineSettings(currentSettings: any, instruction: string, mode: string): Promise<any> {
        const ai = getClient(true);
        
        const relevantSettings: any = {};
        const keysToInclude = ['background', 'lighting', 'shotType', 'editorialVibe', 'location', 'timeOfDay', 'vibe', 'action', 'cameraModel', 'lensFocalLength', 'aperture', 'iso', 'shutterSpeed', 'colorGrading'];
        for(const key of keysToInclude) {
            if(currentSettings[key]) {
                relevantSettings[key] = currentSettings[key];
            }
        }
        
        const prompt = `
        You are a photography assistant AI.
        Your task is to modify a set of camera and scene settings based on a user's instruction.
        Only output the JSON object with the changed values. Do not output unchanged values.
    
        CURRENT SETTINGS:
        ${JSON.stringify(relevantSettings, null, 2)}
        
        USER INSTRUCTION: "${instruction}"
        
        EXAMPLE: if instruction is "make it sunset", output: {"timeOfDay": "Golden Hour"}
        EXAMPLE: if instruction is "use a wide angle lens", output: {"lensFocalLength": "24mm"}
        
        Output ONLY the JSON object of changes.
        `;
    
        try {
            const response = await ai.models.generateContent({
                model: MODELS.TEXT,
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            const json = JSON.parse(response.text || "{}");
            return json;
        } catch (e) {
            console.error("Settings refinement failed", e);
            throw new Error("Could not interpret settings refinement.");
        }
    }

    static async analyze(images: string[]): Promise<Partial<ModelAttributes>> {
        if (!images || images.length === 0) {
            throw new Error("At least one image is required for analysis.");
        }
    
        const ai = getClient(false);
    
        const parts: any[] = images.map(base64 => {
            const data = base64.includes(',') ? base64.split(',')[1] : base64;
            const mime = base64.match(/:(.*?);/)?.[1] || 'image/png';
            return { inlineData: { mimeType: mime, data } };
        });
    
        parts.push({
            text: `
            Analyze the person in these images and generate a highly detailed, forensic "Synthetic DNA" description string.
            Focus on unique facial identifiers: bone structure, eye shape/spacing, nose bridge, lip shape, skin texture, and unique markers like scars or moles.
            Describe them as if you were a forensic artist creating a police report. This is for a CGI character creation pipeline.
            
            Output format: a single string.
            `
        });
    
        try {
            const response = await ai.models.generateContent({
                model: MODELS.IMAGE.PRO,
                contents: { parts },
                config: { maxOutputTokens: 500 }
            });
    
            const dna = response.text?.trim();
            if (!dna) throw new Error("Analysis did not return a description.");
            
            return {
                syntheticDNA: dna
            };
        } catch (e) {
            console.error("DNA analysis failed", e);
            throw new Error("Failed to analyze image and extract DNA.");
        }
    }
    
    static async audit(project: Project, taxonomyTags: string[]): Promise<AuditReport> {
        const ai = getClient(false);
        
        const context = `
        PROJECT: "${project.name}"
        BRAND BIBLE / GUIDELINES: "${project.customInstructions || 'Not specified.'}"
        EXISTING SHOT TAGS: ${taxonomyTags.join(', ')}
        `;
    
        const prompt = `
        You are an AI Art Director conducting a campaign audit.
        Analyze the provided campaign data and generate a report in JSON format.
        
        CONTEXT:
        ${context}
        
        TASKS:
        1. Score the campaign's completion and consistency from 0-100 based on the Brand Bible and the variety of shots.
        2. Write a 1-sentence analysis of the campaign's current state.
        3. Check for obvious gaps in the shot list (e.g., no close-ups, no wide shots). List up to 3 missing shot types as an array of strings.
        4. Check for consistency in model appearance, lighting, and style across the tags. Write a 1-sentence assessment.
    
        SCHEMA:
        {
            "score": number,
            "analysis": "string",
            "missingShots": ["string"],
            "consistencyCheck": "string"
        }
        
        OUTPUT JSON ONLY.
        `;
    
        try {
            const response = await ai.models.generateContent({
                model: MODELS.TEXT,
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
            const json = JSON.parse(response.text || "{}");
            return json as AuditReport;
        } catch (e) {
            console.error("Audit failed", e);
            throw new Error("Failed to run campaign audit.");
        }
    }

    static async synthesizeProfile(description: string): Promise<Partial<ModelAttributes>> {
        const ai = getClient(true);
        const prompt = `
        ROLE: Character Design Lead.
        TASK: Convert the character description into a precise JSON biometric profile for a 3D model.
        
        USER DESCRIPTION: "${description}"
        
        INSTRUCTIONS:
        1. Infer the unsaid. If user says "Viking", set height high, build muscular, hair blonde/red, skin pale/weathered.
        2. "Realism" is paramount. Avoid cartoony proportions unless specified.
        3. Detect conflicting ethnicity/skin tones (e.g. "Albino African") and set accordingly.
        
        OUTPUT JSON SCHEMA (Strict):
        {
            "gender": "MALE" | "FEMALE",
            "name": "string (creative name fitting the persona)",
            "age": number,
            "ethnicity": "string (Bone structure origin)",
            "skinTone": "string (Pigmentation)",
            "eyeColor": "string",
            "hairColor": "string",
            "hairStyle": "string",
            "hairTexture": "string (Straight, Wavy, Curly, Coily)",
            "clothingStyle": "string",
            "glasses": "string",
            "facialHair": "string",
            "visualVibe": "string",
            "distinctiveFeatures": "string (scars, freckles, tattoos, etc)",
            "morphology": {
                "height": number (0-100),
                "bodyFat": number (0-100),
                "muscleMass": number (0-100),
                "boneStructure": number (0-100),
                "shoulderWidth": number (0-100),
                "neckThickness": number (0-100),
                "bustChest": number (0-100),
                "hipsWaistRatio": number (0-100),
                "faceShape": "OVAL" | "SQUARE" | "HEART" | "DIAMOND" | "ROUND",
                "foreheadHeight": number (0-100),
                "jawlineDefinition": number (0-100),
                "chinProminence": number (0-100),
                "cheekboneHeight": number (0-100),
                "noseStructure": number (0-100),
                "eyeSize": number (0-100),
                "eyeSpacing": number (0-100),
                "eyeTilt": number (0-100),
                "eyebrowArch": number (0-100),
                "lipFullness": number (0-100),
                "skinTexture": number (0-100),
                "skinSheen": number (0-100),
                "imperfections": number (0-100),
                "freckleDensity": number (0-100),
                "vascularity": number (0-100),
                "redness": number (0-100),
                "pores": number (0-100),
                "grayScale": number (0-100)
            }
        }
        `;
        try {
            const response = await ai.models.generateContent({ model: MODELS.TEXT, contents: prompt, config: { responseMimeType: "application/json" } });
            const json = JSON.parse(response.text || "{}");
            return { ...json, morphology: { ...DEFAULT_MORPHOLOGY, ...json.morphology } };
        } catch (e) {
            console.error("Identity Synthesis Failed", e);
            throw new Error("Failed to synthesize identity.");
        }
    }

    static generateRandomPersona(): string {
        const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        return `A ${pick(DIRECTOR_VARS.SUBJECTS)} from ${pick(DIRECTOR_VARS.SETTINGS)} with ${pick(DIRECTOR_VARS.MOODS)} mood.`;
    }

    static async enhanceDescription(input: string): Promise<string> {
        const ai = getClient(true);
        const prompt = `
        Role: Creative Writer.
        Task: Expand this short character concept into a vivid 1-sentence visual description.
        Input: "${input}"
        Rules: Focus on physical appearance, style, and vibe. Keep it under 40 words.
        Output: Just the description string.
        `;
        try {
            const response = await ai.models.generateContent({ model: MODELS.TEXT, contents: prompt, config: { maxOutputTokens: 100 } });
            return response.text?.trim() || input;
        } catch (e) {
            return input;
        }
    }

    static injectTrait(currentDescription: string, trait: string): string {
        const cleanDesc = currentDescription.trim();
        if (!cleanDesc) return trait;
        const lastChar = cleanDesc.slice(-1);
        const base = (lastChar === '.' || lastChar === ',') ? cleanDesc.slice(0, -1) : cleanDesc;
        if(base.toLowerCase().includes(trait.toLowerCase())) return cleanDesc;
        return `${base}, ${trait}.`;
    }

    static generateProceduralBrief(): string {
        const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        return `A ${pick(DIRECTOR_VARS.MOODS)} ${pick(DIRECTOR_VARS.GENRES)} campaign featuring ${pick(DIRECTOR_VARS.SUBJECTS)} ${pick(DIRECTOR_VARS.SETTINGS)}. Shot ${pick(DIRECTOR_VARS.CAMERAS)}. Lighting should be ${pick(DIRECTOR_VARS.LIGHTING)}.`;
    }
    
    static mapShotToSettings(shot: DirectorShot, baseVibe: string, intensity: number = 50, projectContext?: string): { settings: StudioSettings | InfluencerSettings, mode: AppMode } {
        let vibeModifier = baseVibe, lightingOverride = "", contrastOverride = "";
        if (intensity >= 80) {
            vibeModifier = `${baseVibe}, High Fashion, Edgy, Avant Garde, Provocative`;
            lightingOverride = "Hard Flash";
            contrastOverride = "High Contrast";
        } else if (intensity <= 30) {
            vibeModifier = `${baseVibe}, Candid, Natural, Soft, Authentic`;
            lightingOverride = "Natural Window";
            contrastOverride = "Soft";
        }

        if (shot.type === 'STUDIO') {
            const settings: StudioSettings = { ...INITIAL_STUDIO, productDescription: shot.description, background: shot.visualDetails, lightingSetup: lightingOverride || "Softbox", editorialVibe: vibeModifier, isHighFashion: intensity > 60, aspectRatio: "3:4", useMagicPrompt: true };
            return { settings, mode: AppMode.STUDIO };
        } else {
            const settings: InfluencerSettings = { ...INITIAL_INFLUENCER, action: shot.description, vibe: vibeModifier, location: shot.visualDetails, aspectRatio: "4:5", useMagicPrompt: true };
            return { settings, mode: AppMode.INFLUENCER };
        }
    }

    static async generateDirectorPlan(brief: string, castModel?: ModelAttributes): Promise<DirectorPlan> {
        const ai = getClient(false);
        const schema = {
            type: Type.OBJECT,
            properties: {
                campaignName: { type: Type.STRING },
                modelBrief: { 
                    type: Type.OBJECT, 
                    properties: {
                        name: { type: Type.STRING },
                        ethnicity: { type: Type.STRING },
                        age: { type: Type.NUMBER },
                        hairStyle: { type: Type.STRING },
                        hairColor: { type: Type.STRING },
                        clothingStyle: { type: Type.STRING },
                        vibe: { type: Type.STRING, description: "General aesthetic vibe" }
                    } 
                }, 
                shots: { 
                    type: Type.ARRAY, 
                    items: { 
                        type: Type.OBJECT, 
                        properties: {
                            type: { type: Type.STRING, enum: ["STUDIO", "INFLUENCER"] },
                            description: { type: Type.STRING, description: "The action or pose" },
                            visualDetails: { type: Type.STRING, description: "Lighting, background, and camera details" }
                        } 
                    } 
                } 
            },
            required: ["campaignName", "modelBrief", "shots"]
        };
        const context = castModel ? `CASTING REQUIREMENT: You MUST use the specific model "${castModel.name}".
           Model Specs: ${castModel.ethnicity}, ${castModel.age}yo, ${castModel.hairColor} ${castModel.hairStyle}.
           DO NOT invent a new person. Adapt the campaign vibe to fit THIS model.`
        : `1. Define a Model Persona that fits the brief.`;

        const prompt = `
        You are a World-Class Creative Director.
        User Brief: "${brief}"
        ${context}
        
        Task: Create a cohesive fashion/lifestyle campaign plan.
        1. Define the Model Persona (if casting, use provided specs).
        2. Create a Shot List of 4 distinct images (mix of Studio and Lifestyle) that tell a story.
        
        Output JSON only.
        `;
        try {
            const response = await ai.models.generateContent({ model: MODELS.TEXT, contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
            const json = JSON.parse(response.text || "{}");
            json.shots = json.shots.map((s: any, i: number) => ({ ...s, id: `shot-${Date.now()}-${i}`, status: 'PENDING' }));
            return json as DirectorPlan;
        } catch (e) {
            console.error("Director Plan Gen Error", e);
            throw new Error("Failed to generate campaign plan.");
        }
    }

    static async generateStudio(model: ModelAttributes, settings: StudioSettings, tier: GenerationTier, projectContext?: string, feedback?: string): Promise<GenerationResult> {
        const project = useProjectStore.getState().activeProject || { id: 'default', name: 'default', createdAt: 0, customInstructions: projectContext };
        const payload = await this.preparePayload(AppMode.STUDIO, tier, model, settings, project, feedback);
        return this.generate(payload);
    }
    static async generateInfluencer(model: ModelAttributes, settings: InfluencerSettings, tier: GenerationTier, projectContext?: string, feedback?: string): Promise<GenerationResult> {
        const project = useProjectStore.getState().activeProject || { id: 'default', name: 'default', createdAt: 0, customInstructions: projectContext };
        const payload = await this.preparePayload(AppMode.INFLUENCER, tier, model, settings, project, feedback);
        return this.generate(payload);
    }
    static async generateVideo(model: ModelAttributes, settings: MotionSettings, tier: GenerationTier, projectContext?: string): Promise<GenerationResult> {
        const project = useProjectStore.getState().activeProject || { id: 'default', name: 'default', createdAt: 0, customInstructions: projectContext };
        const payload = await this.preparePayload(AppMode.MOTION, tier, model, settings, project);
        return this.generate(payload);
    }
}
