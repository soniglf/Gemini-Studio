
import { ModelAttributes, ProPhotoSettings, ModelMorphology } from "../../types";

// SECURITY: Strip potential injection characters and limit length
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
    if (!input) return "";
    let clean = input.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    clean = clean.replace(/[<>]/g, "");
    return clean.slice(0, maxLength);
};

// --- HELPER: Morphology to Adjectives ---
const interpretMorphology = (m: ModelMorphology, gender: 'MALE' | 'FEMALE'): string => {
    const descriptors: string[] = [];

    // Height
    if (m.height < 30) descriptors.push("petite/short");
    else if (m.height > 80) descriptors.push("tall/statuesque");

    // Build/Weight
    if (m.weight < 20) descriptors.push("very thin/waif-like");
    else if (m.weight > 80) descriptors.push("plus-size/heavy");
    else if (m.weight > 60) descriptors.push("full-figured");

    // Muscle
    if (m.muscle > 80) descriptors.push("extremely ripped/bodybuilder");
    else if (m.muscle > 60) descriptors.push("athletic/toned");
    else if (m.muscle < 20) descriptors.push("soft physique");

    // Curves (Female) / Chest (Male)
    if (gender === 'FEMALE') {
        if (m.curves > 80) descriptors.push("hourglass figure, very curvy");
        else if (m.curves < 20) descriptors.push("straight/boyish figure");
        
        if (m.chest > 70) descriptors.push("busty");
        else if (m.chest < 30) descriptors.push("small bust");
    } else {
        if (m.chest > 70) descriptors.push("broad chest/barrel chested");
        if (m.chest < 30) descriptors.push("slim frame");
    }

    // Face
    if (m.jawLine > 80) descriptors.push("razor sharp jawline");
    else if (m.jawLine < 30) descriptors.push("soft round jaw");

    if (m.cheekbones > 80) descriptors.push("high chiseled cheekbones");

    if (m.lipFullness > 70) descriptors.push("full luscious lips");
    else if (m.lipFullness < 30) descriptors.push("thin lips");

    return descriptors.join(", ");
};

// --- MODULES ---

class SubjectModule {
    static build(model: ModelAttributes): string {
        const cleanName = sanitizeInput(model.name, 50);
        const cleanFeatures = sanitizeInput(model.distinctiveFeatures, 200);
        
        const { 
            age, ethnicity, 
            hairColor, hairStyle, eyeColor, 
            facialPiercings,
            morphology
        } = model;

        // Use Morphology if available, otherwise fall back to strings
        let bodyDesc = model.bodyType;
        let faceDetail = `Face: ${model.faceShape}, ${model.skinTone} skin.`;

        if (morphology) {
            bodyDesc = interpretMorphology(morphology, model.gender);
            
            // Override basic face detail with granular morphology
            faceDetail = `Face: ${model.faceShape}, ${model.skinTone} skin (MUST have texture/pores). `;
            if(morphology.noseSize > 70) faceDetail += "Prominent nose. ";
            if(morphology.noseSize < 30) faceDetail += "Small button nose. ";
            if(morphology.eyeSize > 70) faceDetail += "Large doe eyes. ";
            if(morphology.eyeSize < 30) faceDetail += "Small narrow eyes. ";
        }

        // Add granular details
        faceDetail += `Eyes: ${model.eyeShape}, ${eyeColor}. Brows: ${model.eyebrows}. Lips: ${model.lipShape}. Makeup: ${model.makeupStyle}.`;
        
        const physicalDesc = `Subject is a ${age}-year-old ${ethnicity} ${model.gender === 'FEMALE' ? 'woman' : 'man'} with a ${bodyDesc} physique. Hair: ${hairColor}, ${hairStyle} (allow flyaways/messy texture). ${faceDetail} Distinguishing marks: ${cleanFeatures}. Piercings: ${facialPiercings}.`;

        return `SUBJECT: ${cleanName}. ${physicalDesc}`;
    }
}

class TechModule {
    static build(settings: ProPhotoSettings | any, isVideo: boolean, context: 'STUDIO' | 'LIFESTYLE'): string {
        const isDefault = !settings.cameraModel && !settings.aperture;

        if (isDefault) {
             if (isVideo) {
                return "Shot on Arri Alexa Mini LF, vintage Cooke lenses, organic film grain, handheld stabilization, naturalistic color grading, raw footage feel.";
            }
            if (context === 'STUDIO') {
                return "Shot on Mamiya RZ67, Portra 400 film. Soft natural studio window light, slight grain, authentic skin texture (pores visible), non-retouched aesthetic, 8k scan.";
            } else {
                return "Shot on Canon AE-1, 35mm film, Kodak Gold 200. Flash photography style, candid, unposed, slight motion blur, raw street photography, imperfections, authentic social media snapshot.";
            }
        }

        const parts: string[] = [];
        if (settings.cameraModel) parts.push(`Camera: ${settings.cameraModel}`);
        if (settings.lensFocalLength) parts.push(`Lens: ${settings.lensFocalLength}`);
        if (settings.aperture) parts.push(`Aperture: ${settings.aperture}`);
        if (settings.shutterSpeed) parts.push(`Shutter: ${settings.shutterSpeed}`);
        if (settings.iso) parts.push(`ISO: ${settings.iso}`);
        if (settings.lightingSetup) parts.push(`Lighting Setup: ${settings.lightingSetup}`);
        if (settings.colorGrading) parts.push(`Color Grade: ${settings.colorGrading}`);
        
        if (isVideo) {
             if (settings.fps) parts.push(`Frame Rate: ${settings.fps}`);
             if (settings.shutterAngle) parts.push(`Shutter Angle: ${settings.shutterAngle}`);
             if (settings.stabilization) parts.push(`Stabilization: ${settings.stabilization}`);
        }

        parts.push("raw photo", "unedited", "visible skin texture", "pores", "vellus hair", "slight asymmetry", "natural lighting falloff", "chromatic aberration", "film grain");
        
        return `[TECHNICAL SPECS: ${parts.join(', ')}]`;
    }
}

class StyleModule {
    static build(modeType: 'STUDIO' | 'INFLUENCER' | 'MOTION' | 'DIRECTOR'): string {
        let aestheticInstruction = "";
        if (modeType === 'INFLUENCER') {
            aestheticInstruction = "VIBE: Candid, raw, social media style. [STRICT ADHERENCE: Follow the SCENE description for action and location].";
        } else if (modeType === 'STUDIO') {
            aestheticInstruction = "VIBE: High-end editorial, emotional, textured. [STRICT ADHERENCE: Follow the SCENE description for background and lighting].";
        } else {
            aestheticInstruction = "VIBE: Cinematic, atmospheric.";
        }
        return `[AESTHETIC]\n${aestheticInstruction}`;
    }
}

// --- BUILDER ---

export class PromptBuilder {
    private parts: string[] = [];
    private customNegative: string | undefined;

    constructor() {
        // Core System instructions
        this.parts.push(`
    [SYSTEM: PHOTOREALISM IMPERATIVE]
    1. REALISM OVER PERFECTION: The image must look like a RAW photo. Add imperfections, flyaway hairs, skin texture, pores.
    2. ANTI-AI: Do not create 'perfect' faces. Ensure slight asymmetry. Lighting should be natural.
    3. TEXTURE: Skin must look like human skin, not plastic.
        `);
    }

    withModel(model: ModelAttributes): PromptBuilder {
        this.parts.push(`[SUBJECT DEFINITION]\n${SubjectModule.build(model)}`);
        return this;
    }

    withScene(sceneDescription: string): PromptBuilder {
        const cleanScene = sanitizeInput(sceneDescription, 500);
        this.parts.push(`[SCENE & ACTION]\nSCENE: ${cleanScene}`);
        return this;
    }

    withTechSpecs(settings: ProPhotoSettings | any, context: 'STUDIO' | 'LIFESTYLE', isVideo: boolean = false): PromptBuilder {
        this.parts.push(TechModule.build(settings, isVideo, context));
        return this;
    }

    withStyle(modeType: 'STUDIO' | 'INFLUENCER' | 'MOTION' | 'DIRECTOR'): PromptBuilder {
        this.parts.push(StyleModule.build(modeType));
        return this;
    }

    withProjectContext(context?: string): PromptBuilder {
        if (context && context.trim().length > 0) {
            const cleanContext = sanitizeInput(context, 500);
            this.parts.push(`
            [CAMPAIGN BRAND GUIDELINES]
            IMPORTANT: The following directives are absolute brand requirements.
            ${cleanContext}
            `);
        }
        return this;
    }

    withCritique(feedback?: string): PromptBuilder {
        if (feedback && feedback.trim().length > 0) {
            this.parts.push(`
            [DIRECTOR'S FEEDBACK - URGENT]
            The previous shot was rejected.
            CRITIQUE: "${feedback}"
            INSTRUCTION: Regenerate the image addressing this critique specifically. Improve upon the previous attempt.
            `);
        }
        return this;
    }

    withNegativePrompt(negative?: string): PromptBuilder {
        this.customNegative = negative;
        return this;
    }

    build(): string {
        const defaultNegative = "Plastic skin, airbrushed, cartoon, 3d render, perfect symmetry, glowing skin, unnatural lighting, stiff pose, robotic eyes.";
        const finalNegative = this.customNegative && this.customNegative.trim().length > 0 ? this.customNegative : defaultNegative;
        
        return this.parts.join('\n\n') + `\n\nNEGATIVE PROMPT: ${finalNegative}`;
    }
}