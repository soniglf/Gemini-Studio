import { ModelAttributes, StudioSettings, InfluencerSettings, MotionSettings, ModelMorphology } from "../../types";

type PromptData = {
    model: ModelAttributes;
    settings?: Partial<StudioSettings | InfluencerSettings | MotionSettings>;
    projectContext?: string;
    feedback?: string;
    isPro?: boolean;
};

// --- BIOMETRIC TRANSLATION ENGINE ---
// Converts numeric slider values (0-100) into semantic anatomical descriptors with 20% granularity.
const mapMorphologyToPrompt = (m: ModelMorphology): string => {
    const descriptors: string[] = [];

    // HELPER: 5-Step Sensitivity
    // 0-20: Extreme Low
    // 20-40: Low
    // 40-60: Average/Balanced (Implicit)
    // 60-80: High
    // 80-100: Extreme High
    
    // Body Composition
    if (m.bodyFat < 20) descriptors.push("extremely lean, shredded definition, zero body fat");
    else if (m.bodyFat < 40) descriptors.push("lean, athletic build");
    else if (m.bodyFat > 80) descriptors.push("heavy-set, full-figured physique, soft curves");
    else if (m.bodyFat > 60) descriptors.push("soft, curvy physique");
    // 40-60 is omitted (Natural)

    if (m.muscleMass > 80) descriptors.push("hyper-muscular, bodybuilder physique, vascularity");
    else if (m.muscleMass > 60) descriptors.push("muscular, toned, defined muscles");
    else if (m.muscleMass < 20) descriptors.push("slender, delicate frame, no muscle definition");
    else if (m.muscleMass < 40) descriptors.push("slim, slight build");

    // Facial Structure
    if (m.jawlineDefinition > 80) descriptors.push("razor-sharp, chiseled, aggressive jawline");
    else if (m.jawlineDefinition > 60) descriptors.push("defined, strong jawline");
    else if (m.jawlineDefinition < 20) descriptors.push("soft, round jawline, no definition");
    else if (m.jawlineDefinition < 40) descriptors.push("soft features, gentle jawline");

    if (m.cheekboneHeight > 80) descriptors.push("extremely high, model-like cheekbones");
    else if (m.cheekboneHeight > 60) descriptors.push("high, prominent cheekbones");
    
    if (m.chinProminence > 80) descriptors.push("strong, jutting chin");
    else if (m.chinProminence < 20) descriptors.push("recessed, weak chin");

    // Ocular (Eyes)
    if (m.eyeSpacing < 20) descriptors.push("very close-set eyes");
    else if (m.eyeSpacing < 40) descriptors.push("slightly close-set eyes");
    else if (m.eyeSpacing > 80) descriptors.push("very wide-set eyes, alien-like");
    else if (m.eyeSpacing > 60) descriptors.push("wide-set eyes");
    
    if (m.eyeTilt > 80) descriptors.push("extreme positive canthal tilt, feline eyes");
    else if (m.eyeTilt > 60) descriptors.push("positive canthal tilt, almond eyes");
    else if (m.eyeTilt < 20) descriptors.push("negative canthal tilt, downturned eyes");

    // Nasal
    if (m.noseStructure > 80) descriptors.push("strong, large aquiline nose");
    else if (m.noseStructure > 60) descriptors.push("prominent nose bridge");
    else if (m.noseStructure < 20) descriptors.push("very small, button nose");
    else if (m.noseStructure < 40) descriptors.push("dainty, small nose");

    // Mouth
    if (m.lipFullness > 80) descriptors.push("extremely full, pillowy lips, injection look");
    else if (m.lipFullness > 60) descriptors.push("full, luscious lips");
    else if (m.lipFullness < 20) descriptors.push("very thin, straight lips");
    else if (m.lipFullness < 40) descriptors.push("thin lips");

    // Bust/Chest (Gender Neutral Mapping)
    if (m.bustChest > 80) descriptors.push("large, broad chest/bust");
    else if (m.bustChest > 60) descriptors.push("full chest/bust");
    else if (m.bustChest < 20) descriptors.push("flat chest");

    // CONTINUOUS TEXTURE MAPPING (Realism Enforcement)
    const texture = m.skinTexture || 50;
    if (texture > 80) descriptors.push("hyper-realistic skin texture, micro-details, raw dermal finish, visible pores everywhere");
    else if (texture > 60) descriptors.push("high fidelity skin, visible pores, natural skin texture");
    else if (texture < 30) descriptors.push("smooth complexion, soft focus skin");
    else if (texture < 10) descriptors.push("airbrushed, plastic perfection");

    const imperfections = m.imperfections || 30;
    if (imperfections > 80) descriptors.push("acne scars, marked skin, heavy texture, raw");
    else if (imperfections > 60) descriptors.push("visible skin irregularities, moles, asymmetry");
    else if (imperfections < 20) descriptors.push("flawless skin");

    // Dermatology Extras
    if (m.freckleDensity > 60) descriptors.push(`heavy freckles across face and body`);
    else if (m.freckleDensity > 30) descriptors.push(`light dusting of freckles`);
    
    if (m.aging > 60) descriptors.push("visible signs of age, fine lines, character face");
    if (m.vascularity > 60) descriptors.push("visible veins, vascular skin");

    return descriptors.join(", ");
};

// --- IDENTITY PROTOCOL V2 (UNBREAKABLE) ---
const IDENTITY_PROTOCOL = {
    HEADER: `[SYSTEM: BIOMETRIC IDENTITY ENGINE]
TASK: Generate a technical character reference sheet (Turnaround).
LAYOUT: 2x2 Grid Contact Sheet.
BACKGROUND: Neutral White Studio Background (Infinite).`,

    PRO_TEXTURE: `[RENDER PHYSICS: HIGH FIDELITY]
- Skin Texture: Raw, unretouched, dermatological realism.
- Subsurface Scattering: Enabled.
- Camera: 85mm Portrait Lens, f/1.8.
- Micro-Details: Visible pores, vellus hair, skin irregularities, slight asymmetry.
- Lighting: Neutral, even studio lighting (No heavy shadows).`,

    FAST_TEXTURE: `[RENDER PHYSICS: STANDARD]
- Style: Photorealistic documentary photography.
- Focus: Sharp, high contrast.
- Look: Digital SLR photography.`,

    COMPOSITION: `[GRID LAYOUT SPECIFICATION - MANDATORY]
1. Top-Left: FULL BODY FRONT VIEW (Standing neutral, hands at sides).
2. Top-Right: FULL BODY SIDE VIEW (Profile from left, standing neutral).
3. Bottom-Left: FULL BODY BACK VIEW (Standing neutral).
4. Bottom-Right: EXTREME CLOSE-UP FACE (Front facing, neutral expression).

**CRITICAL**: All 4 panels must depict the EXACT SAME PERSON. 
- Maintain absolute consistency in body proportions, facial features, and clothing.
- Do not crop heads in the full body shots.
- Seamless neutral white background across all panels.`,

    // SPECIAL INSTRUCTION FOR FLASH MODEL TO ENFORCE GRID
    FAST_LAYOUT: `[STRICT LAYOUT ENFORCEMENT]
Create a 2x2 GRID IMAGE. 
- Top Left: Full Body Front.
- Top Right: Full Body Side.
- Bottom Left: Full Body Back.
- Bottom Right: Face Close-up.
DO NOT merge panels. Keep white space between them.`,

    NEGATIVE: `[NEGATIVE CONSTRAINTS]
makeup (unless specified), airbrush, smoothing, beauty filter, cartoon, illustration, 3d render, painting, distorted face, asymmetry, text, watermark, changing clothes between panels, cropped body, tinted background, plastic skin, doll-like, extra limbs, bad anatomy, collage, messy layout.`
};

const SECTIONS: Record<string, (data: PromptData) => string | null> = {
    SYSTEM_CONTEXT: () => `[SYSTEM CONTEXT: HYPER-REALISTIC PHOTOGRAPHY ENGINE]
ROLE: World-Class Portrait Photographer.
TASK: Generate indistinguishable-from-reality photography.`,

    IDENTITY_V2_MASTER: ({ model, isPro }) => {
        const textureBlock = isPro ? IDENTITY_PROTOCOL.PRO_TEXTURE : IDENTITY_PROTOCOL.FAST_TEXTURE;
        const biometrics = mapMorphologyToPrompt(model.morphology);
        const layoutBlock = isPro ? IDENTITY_PROTOCOL.COMPOSITION : `${IDENTITY_PROTOCOL.COMPOSITION}\n${IDENTITY_PROTOCOL.FAST_LAYOUT}`;
        
        // INJECT SYNTHETIC DNA IF AVAILABLE
        const dnaBlock = model.syntheticDNA ? `[SYNTHETIC DNA / VISUAL PHENOTYPE]\n${model.syntheticDNA}` : "";

        let constraints = "";
        // SUPERCHARGE: When Strictness is 100%, we enable forensic mode
        if (model.strictness >= 95) {
            constraints = `[FORENSIC IDENTITY LOCK: ACTIVE]
WARNING: Deviation from reference is strictly prohibited.
- This is a digital twin reconstruction. 
- Ignore aesthetic improvements if they alter bone structure.
- Maintain exact facial landmarks across all 4 angles.`;
        } else if (model.strictness >= 80) {
            constraints = `[STRICT IDENTITY LOCK]
Adhere to facial features with high precision. Ensure character consistency across grid.`;
        }

        return `${IDENTITY_PROTOCOL.HEADER}

[SUBJECT BIOMETRICS]
- Gender: ${model.gender}
- Age: ${model.age} years old
- Ethnicity: ${model.ethnicity} (${model.skinTone} skin tone)
- Anatomy: ${biometrics}
- Physiognomy: ${model.morphology.faceShape} face shape.
- Hair: ${model.hairColor}, ${model.hairStyle}, ${model.hairTexture} texture.
- Eyes: ${model.eyeColor}.
- Glasses: ${model.glasses || "None"}.
- Features: ${model.distinctiveFeatures || "None"}.
- Styling: ${model.clothingStyle}.

${dnaBlock}

${textureBlock}

${layoutBlock}

${constraints}

${IDENTITY_PROTOCOL.NEGATIVE}`;
    },

    PROJECT_CONTEXT: ({ projectContext }) => projectContext ? `[BRAND CONTEXT]\n${projectContext}` : null,
    
    SCENE_STUDIO: ({ settings }) => {
        const s = settings as StudioSettings;
        return `[STUDIO SETUP]\nShot: ${s.shotType}\nLighting: ${s.lighting}\nSet: ${s.setDesign}\nVibe: ${s.studioVibe}`;
    },
    
    SCENE_INFLUENCER: ({ settings }) => {
        const s = settings as InfluencerSettings;
        return `[LIFESTYLE SCENE]\nLocation: ${s.location}\nAction: ${s.action}\nTime: ${s.timeOfDay}\nVibe: ${s.vibe}\nContext: ${s.socialContext}`;
    },

    SCENE_MOTION: ({ settings }) => {
        const s = settings as MotionSettings;
        return `[CINEMATOGRAPHY]\nMovement: ${s.movement}\nFilm Stock: ${s.filmStock}\nFPS: ${s.fps}`;
    },

    MODIFIER_INSTRUCTION: ({ settings }) => {
        const s = settings as any;
        return `[MODIFIER APPLICATION]
        TASK: Apply modification while maintaining IDENTITY LOCK.
        TYPE: ${s.vibe}
        INSTRUCTION: ${s.action}`;
    },

    STANDARD_NEGATIVE: () => `[NEGATIVE]\ntext, watermark, blur, low quality, distortion, bad anatomy, extra limbs, plastic skin.`
};

type TemplateName = 'CREATOR_SHEET' | 'STUDIO_PHOTO' | 'INFLUENCER_LIFESTYLE' | 'MOTION_LIFESTYLE' | 'MODIFIER_APPLICATION';

export class PromptEngine {
    static build(templateName: TemplateName, data: PromptData): string {
        // --- FIREWALL: IDENTITY PROTOCOL ---
        if (templateName === 'CREATOR_SHEET') {
            return SECTIONS.IDENTITY_V2_MASTER(data) || "";
        }

        // --- STANDARD PIPELINE ---
        const templates: Record<string, (keyof typeof SECTIONS)[]> = {
            STUDIO_PHOTO: ['SYSTEM_CONTEXT', 'PROJECT_CONTEXT', 'SCENE_STUDIO', 'STANDARD_NEGATIVE'],
            INFLUENCER_LIFESTYLE: ['SYSTEM_CONTEXT', 'PROJECT_CONTEXT', 'SCENE_INFLUENCER', 'STANDARD_NEGATIVE'],
            MOTION_LIFESTYLE: ['SYSTEM_CONTEXT', 'PROJECT_CONTEXT', 'SCENE_MOTION', 'STANDARD_NEGATIVE'],
            MODIFIER_APPLICATION: ['SYSTEM_CONTEXT', 'MODIFIER_INSTRUCTION', 'STANDARD_NEGATIVE']
        };

        const template = templates[templateName];
        if (!template) throw new Error(`Template ${templateName} not found`);

        let prompt = template
            .map(key => SECTIONS[key] ? SECTIONS[key](data) : "")
            .filter(Boolean)
            .join('\n\n');

        // Inject Core Identity for non-creator modes
        if (templateName !== 'MODIFIER_APPLICATION') {
            const biometrics = mapMorphologyToPrompt(data.model.morphology);
            // Include Synthetic DNA in standard prompts too
            const dnaBlock = data.model.syntheticDNA ? `[DNA]: ${data.model.syntheticDNA}` : "";
            
            const identityBlock = `[SUBJECT]\n${data.model.gender}, ${data.model.age}, ${data.model.ethnicity}. ${data.model.hairColor} ${data.model.hairStyle}. ${biometrics}. ${dnaBlock}`;
            prompt = identityBlock + "\n\n" + prompt;
        }

        return prompt;
    }
}