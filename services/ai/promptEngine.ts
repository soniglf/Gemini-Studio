import { ModelAttributes, StudioSettings, InfluencerSettings, MotionSettings, ProPhotoSettings } from "../../types";

type PromptData = {
    model: ModelAttributes;
    settings?: Partial<StudioSettings | InfluencerSettings | MotionSettings>;
    projectContext?: string;
// FIX: Add optional feedback property for regenerative prompts.
    feedback?: string;
};

// Each section is a function that takes data and returns a string or null
type PromptSection = (data: PromptData) => string | null;

const SECTIONS: Record<string, PromptSection> = {
    SYSTEM_CONTEXT: () => `[SYSTEM CONTEXT: PROFESSIONAL CREATIVE STUDIO]
ROLE: High-End Fashion Photographer & CGI Artist.
TASK: Create artistic, photorealistic imagery for a professional campaign.
CONTEXT: Controlled studio or location environment with a fictional model.
INTERPRETATION RULES:
- "Shoot" / "Shot" = Photography Camera Angle.
- "Raw" = Uncompressed .RAW Image Format (High Fidelity).
- "Skin" = Dermatological Texture & Pores (Not Nudity).
- "Flash" = Studio Lighting Equipment.
SAFETY ADHERENCE: Generate strictly G/PG-13 content. If a prompt is ambiguous, prioritize the Safe, Artistic, and Professional interpretation.`,

    DNA_CONSTRAINTS: ({ model }) => {
        let constraints = "";
        if (model.strictness >= 100) {
            constraints += `[CLONE ENGINE: HOLISTIC MODE].
1. REFERENCE PRIORITY: Use the Reference Images as the TOTAL SOURCE OF TRUTH for subject appearance, physique, and general style.
2. MODIFIER LAYER: Apply the specific morphological traits below as ADJUSTMENTS to the reference.
3. UI PURGE: STRICTLY EXCLUDE all user interface elements, watermarks, social media icons, and text overlays found in the references.
`;
        } else if (model.strictness >= 80) {
            constraints += `[IDENTITY LOCK: HIGH]. Closely resemble the reference face and body structure. Allow outfit changes if specified. `;
        }
        if (model.glasses && model.glasses !== "None") constraints += `WEARING: ${model.glasses} (WEIGHT: 2.0, MANDATORY). `;
        else constraints += `EYES MUST BE VISIBLE. NO SUNGLASSES. REMOVE ANY GLASSES FROM REFERENCE IMAGE if "None" is selected. `;
        if (model.facialHair && model.facialHair !== "None") constraints += `FACIAL HAIR: ${model.facialHair} (WEIGHT: 2.0, MANDATORY). `;
        if (model.visualVibe && model.visualVibe !== "Neutral") constraints += `AESTHETIC VIBE: ${model.visualVibe}. `;
        return `[HARD CONSTRAINTS]\n${constraints}`;
    },

    DNA_FORENSIC: ({ model }) => model.syntheticDNA ? `[FORENSIC DNA]\n${model.syntheticDNA}\n(PRIORITY: HIGH)` : null,

    DNA_CORE: ({ model }) => {
        const { morphology: m, gender: g } = model;
        const heightMap = m.height > 80 ? "towering, statuesque" : m.height < 20 ? "petite, delicate" : "balanced";
        const buildMap = m.muscleMass > 75 ? "hyper-defined, muscular" : m.bodyFat > 60 ? "soft, voluptuous" : "athletic, toned";
        const frameMap = m.shoulderWidth > 70 ? "broad-shouldered" : m.shoulderWidth < 30 ? "slender-shouldered" : "proportional";

        let torsoDesc = "";
        if (g === 'FEMALE') {
            if (m.bustChest > 85) torsoDesc = ", extremely voluptuous heavy bust (MODIFY REFERENCE TO MATCH)"; else if (m.bustChest > 65) torsoDesc = ", full ample bust (MODIFY REFERENCE TO MATCH)"; else if (m.bustChest < 20) torsoDesc = ", flat athletic chest";
        } else {
            if (m.bustChest > 80) torsoDesc = ", massive barrel chest"; else if (m.bustChest > 60) torsoDesc = ", broad masculine chest";
        }
        let waistDesc = m.hipsWaistRatio > 80 ? (g === 'FEMALE' ? ", extreme hourglass figure" : ", heavy v-taper") : m.hipsWaistRatio < 30 ? ", straight blocky torso" : "";

        const bodyDesc = `Subject possesses a ${heightMap}, ${frameMap} frame with a ${buildMap} physique${torsoDesc}${waistDesc}.`;
        
        const nose = m.noseStructure > 70 ? "aquiline nose" : m.noseStructure < 30 ? "button nose" : "straight nose";
        const jaw = m.jawlineDefinition > 70 ? "razor-sharp jawline" : m.jawlineDefinition < 30 ? "soft jaw" : "defined jaw";
        const eyes = m.eyeSize > 70 ? "large doe-eyes" : "almond-shaped eyes";
        const tilt = m.eyeTilt > 70 ? "upturned cat-eyes" : m.eyeTilt < 30 ? "downturned eyes" : "neutral eye tilt";
        
        const faceDesc = `Facial structure is ${m.faceShape.toLowerCase()} with a ${jaw}, ${tilt}, ${nose}, and ${eyes}.`;
        
        return `[IDENTITY CORE]
Subject: ${model.name}, ${model.age}-year-old ${model.gender}.
Ethno-Genotype (Bone Structure): ${model.ethnicity}.
Phenotype (Pigmentation): ${model.skinTone} Skin.
${bodyDesc}
${faceDesc}
Features: ${model.distinctiveFeatures}.`;
    },

    DNA_STYLING: ({ model }) => {
        const { morphology: m } = model;
        const texture = model.hairTexture ? `, ${model.hairTexture.split('(')[0].trim()} texture` : '';
        const gray = m.grayScale > 20 ? ` with ${(m.grayScale)}% gray/white strands` : '';
        const brows = model.eyebrowStyle ? `, ${model.eyebrowStyle.toLowerCase()} eyebrows` : '';
        const grooming = `Hair: ${model.hairColor}, ${model.hairStyle}${texture}${gray}${brows}.`;
        
        return `[STYLING & GROOMING]\n${grooming}\nEyes: ${model.eyeColor}.\nStyle: ${model.clothingStyle}.`;
    },

    DNA_PHYSICS: ({ model }) => {
        const { morphology: m } = model;
        if (m.skinTexture < 30) return "[PHYSICS & TEXTURE]\nSkin is flawless, airbrushed studio perfection.";
        const imperfections = m.imperfections > 50 ? "visible natural asymmetry" : "minimal blemishes";
        const pores = m.pores > 50 ? "visible high-frequency pore texture" : "fine texture";
        const flush = m.redness > 40 ? "subsurface scattering and flush" : "even tone";
        const sheen = m.skinSheen > 60 ? "dewy skin sheen" : "matte skin finish";
        const freckles = m.freckleDensity > 30 ? "dusted with freckles" : "";
        return `[PHYSICS & TEXTURE]\nSkin renders with ${pores}, ${imperfections}, ${freckles}, and ${flush}. ${sheen}. Unretouched raw photography aesthetic.`;
    },
    
    PROJECT_CONTEXT: ({ projectContext }) => projectContext ? `[PROJECT GUIDELINES]\n${projectContext}` : null,

    // FIX: Implement missing prompt sections
    SCENE_STUDIO: ({ settings }) => {
        const s = settings as StudioSettings;
        if (!s) return null;
        let scene = `[SCENE: STUDIO]\n`;
        scene += `PHOTOGRAPHY STYLE: ${s.editorialVibe || 'Vogue editorial'}${s.isHighFashion ? ', high fashion' : ''}.\n`;
        scene += `SHOT: ${s.shotType}, ${s.poseStyle || 'power stance'}.\n`;
        scene += `BACKGROUND: ${s.background}. `;
        if (s.productDescription) scene += `INTERACTION: ${s.productDescription}.\n`;
        scene += `LIGHTING: ${s.lighting}.\n`;
        return scene;
    },
    SCENE_INFLUENCER: ({ settings }) => {
        const s = settings as InfluencerSettings;
        if (!s) return null;
        let scene = `[SCENE: LIFESTYLE]\n`;
        scene += `LOCATION: ${s.location}, ${s.timeOfDay}.\n`;
        scene += `ACTION: ${s.action}.\n`;
        scene += `VIBE: ${s.vibe}, candid social media photo aesthetic.\n`;
        if (s.companions) scene += `COMPANIONS: ${s.companions}.\n`;
        return scene;
    },
    SCENE_MOTION: ({ settings }) => {
        const s = settings as MotionSettings;
        if (!s) return null;
        let scene = `[SCENE: CINEMATIC]\n`;
        scene += `LOCATION: ${s.location}, ${s.timeOfDay}.\n`;
        scene += `ACTION & MOVEMENT: ${s.action}, camera movement is ${s.movement || 'a steady tracking shot'}.\n`;
        scene += `VIBE & STYLE: ${s.vibe}, cinematic film still, ${s.filmStock || 'Kodak Portra 400'} emulation.\n`;
        if (s.customPrompt) scene += `DIRECTOR'S NOTE: ${s.customPrompt}.\n`;
        return scene;
    },
    TECH_SPECS: ({ settings }) => {
        const s = settings as Partial<StudioSettings | InfluencerSettings | MotionSettings>;
        if (!s) return null;
        const parts = [];
        if (s.cameraModel) parts.push(s.cameraModel);
        if (s.lensFocalLength) parts.push(`${s.lensFocalLength} lens`);
        if (s.aperture) parts.push(s.aperture);
        if (s.shutterSpeed) parts.push(s.shutterSpeed);
        if (s.iso) parts.push(`ISO ${s.iso}`);
        if (s.colorGrading) parts.push(`${s.colorGrading} color grade`);
        if (s.lightingSetup) parts.push(s.lightingSetup);
        
        // Motion specific
        if ('fps' in s && s.fps) parts.push(s.fps);
        if ('stabilization' in s && s.stabilization) parts.push(s.stabilization);

        if (parts.length === 0) return null;
        return `[TECHNICAL SPECS]\nShot on ${parts.join(', ')}.`;
    },
    NEGATIVE_PROMPT: ({ settings }) => {
        const s = settings as Partial<ProPhotoSettings>; // ProPhotoSettings is part of all of them
        const baseNegative = "text, watermark, UI, blurry, jpeg artifacts, noise, grain, deformed, mutilated, amateur, poorly drawn";
        const custom = s?.customNegative;
        const combined = custom ? `${baseNegative}, ${custom}` : baseNegative;
        return `[NEGATIVE PROMPT]\n${combined}`;
    },
    LAYOUT_TURNAROUND: ({ model }) => {
        return `[LAYOUT & COMPOSITION]
    Generate a character sheet with 3 views of the same person:
    1. Full body shot, facing camera, neutral expression.
    2. Waist-up profile shot (side view).
    3. Extreme close-up of the face, detailed, looking at camera.
    All shots must be on a plain light gray studio background. All shots must feature the EXACT same person.`;
    },
// FIX: Add a section for regeneration feedback.
    FEEDBACK: ({ feedback }) => feedback ? `[DIRECTOR FEEDBACK FOR REGENERATION]\n${feedback}` : null,
};

type TemplateName = 'CREATOR_SHEET' | 'STUDIO_PHOTO' | 'INFLUENCER_LIFESTYLE' | 'MOTION_LIFESTYLE';

const TEMPLATES: Record<TemplateName, (keyof typeof SECTIONS)[]> = {
    CREATOR_SHEET: ['SYSTEM_CONTEXT', 'DNA_CONSTRAINTS', 'DNA_FORENSIC', 'DNA_CORE', 'DNA_STYLING', 'DNA_PHYSICS', 'LAYOUT_TURNAROUND', 'NEGATIVE_PROMPT'],
// FIX: Add feedback to relevant templates.
    STUDIO_PHOTO: ['SYSTEM_CONTEXT', 'DNA_CONSTRAINTS', 'DNA_FORENSIC', 'DNA_CORE', 'DNA_STYLING', 'DNA_PHYSICS', 'PROJECT_CONTEXT', 'SCENE_STUDIO', 'TECH_SPECS', 'NEGATIVE_PROMPT', 'FEEDBACK'],
    INFLUENCER_LIFESTYLE: ['SYSTEM_CONTEXT', 'DNA_CONSTRAINTS', 'DNA_FORENSIC', 'DNA_CORE', 'DNA_STYLING', 'DNA_PHYSICS', 'PROJECT_CONTEXT', 'SCENE_INFLUENCER', 'TECH_SPECS', 'NEGATIVE_PROMPT', 'FEEDBACK'],
    MOTION_LIFESTYLE: ['SYSTEM_CONTEXT', 'DNA_CONSTRAINTS', 'DNA_FORENSIC', 'DNA_CORE', 'DNA_STYLING', 'DNA_PHYSICS', 'PROJECT_CONTEXT', 'SCENE_MOTION', 'TECH_SPECS', 'NEGATIVE_PROMPT'],
};

export class PromptEngine {
    static build(templateName: TemplateName, data: PromptData): string {
        const template = TEMPLATES[templateName];
        if (!template) throw new Error(`Prompt template "${templateName}" not found.`);

        return template
            .map(sectionName => SECTIONS[sectionName](data))
            .filter(Boolean) // Remove null/empty sections
            .join('\n\n');
    }
}
