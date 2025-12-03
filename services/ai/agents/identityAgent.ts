
import { getClient, MODELS } from "../config";
import { ModelAttributes, Gender } from "../../../types";
import { DEFAULT_MORPHOLOGY, DEFAULT_MODEL } from "../../../data/constants";

const PROCEDURAL_ROLES = ["Assassin", "Hacker", "Royal Heir", "Detective", "Pilot", "Chef", "Artist", "Soldier", "Scientist", "Monk", "Influencer", "CEO", "Vampire Hunter"];
const PROCEDURAL_ORIGINS = ["Neo-Tokyo", "Paris", "Mars Colony", "Abandoned Bunker", "Luxury Penthouse", "Ancient Forest", "Cyber Slum", "High-Tech Lab", "Victorian London"];
const PROCEDURAL_TRAITS = ["Cybernetic Eye", "Scarred Face", "Glowing Tattoos", "Porcelain Skin", "Gold Teeth", "Bionic Arm", "Heterochromia", "Full Body Suit", "Vintage Tuxedo", "Ragged Cloak"];

export class IdentityAgent {
    
    /**
     * Translates a natural language description into a precise ModelAttributes configuration.
     */
    static async synthesizeProfile(description: string): Promise<Partial<ModelAttributes>> {
        const ai = getClient(true); // Use Free/Logic pool
        
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
            const response = await ai.models.generateContent({
                model: MODELS.TEXT,
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const text = response.text || "{}";
            const json = JSON.parse(text);
            
            // Merge with defaults to ensure safety and type integrity
            return {
                ...json,
                morphology: { ...DEFAULT_MORPHOLOGY, ...json.morphology }
            };

        } catch (e) {
            console.error("Identity Synthesis Failed", e);
            throw new Error("Failed to synthesize identity.");
        }
    }

    /**
     * Generates a random, creative persona description procedurally.
     */
    static generateRandomPersona(): string {
        const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        return `A ${pick(PROCEDURAL_ROLES)} from ${pick(PROCEDURAL_ORIGINS)} with ${pick(PROCEDURAL_TRAITS)}.`;
    }

    /**
     * Expands a short description into a rich, detailed visual profile using AI.
     */
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
            const response = await ai.models.generateContent({
                model: MODELS.TEXT,
                contents: prompt,
                config: { maxOutputTokens: 100 }
            });
            return response.text?.trim() || input;
        } catch (e) {
            return input; // Fallback
        }
    }

    /**
     * Smartly appends a trait to an existing description.
     */
    static injectTrait(currentDescription: string, trait: string): string {
        const cleanDesc = currentDescription.trim();
        if (!cleanDesc) return trait;
        
        // Ensure prompt logic is additive without breaking sentence flow
        const lastChar = cleanDesc.slice(-1);
        const base = (lastChar === '.' || lastChar === ',') ? cleanDesc.slice(0, -1) : cleanDesc;
        
        // Avoid duplicates if trait is just a word
        if(base.toLowerCase().includes(trait.toLowerCase())) return cleanDesc;

        return `${base}, ${trait}.`;
    }

    /**
     * Converts numerical biometric data into a "Physics-Based" narrative.
     * This injects "Soul" into the generation by describing light interaction and micro-texture.
     */
    static buildNarrativeDNA(model: ModelAttributes): string {
        const m = model.morphology;
        const g = model.gender;
        
        // --- 1. DETAILS & HARD CONSTRAINTS (HOISTED TO TOP) ---
        // Placing these first ensures the Diffusion Model prioritizes them.
        let constraints = "";
        
        // BODY STRUCTURAL LOCK (If High Strictness)
        if (model.strictness >= 100) {
            constraints += `[CLONE ENGINE: HOLISTIC MODE].
            1. REFERENCE PRIORITY: Use the Reference Images as the TOTAL SOURCE OF TRUTH for subject appearance, physique, and general style.
            2. MODIFIER LAYER: Apply the specific morphological traits below (like Bust Size or Muscle) as ADJUSTMENTS to the reference.
            3. UI PURGE: STRICTLY EXCLUDE all user interface elements, watermarks, social media icons, and text overlays found in the references. The subject exists in reality, not on a screen.
            `;
        } else if (model.strictness >= 80) {
            constraints += `[IDENTITY LOCK: HIGH]. Closely resemble the reference face and body structure. Allow outfit changes if specified. `;
        }

        // ACCESSORIES LOCK & OVERRIDE
        if (model.glasses && model.glasses !== "None") {
            constraints += `WEARING: ${model.glasses} (WEIGHT: 2.0, MANDATORY). `;
        } else {
            // Explicitly forbid sunglasses if None/Standard is not selected, to override reference leakage
            constraints += `EYES MUST BE VISIBLE. NO SUNGLASSES. REMOVE ANY GLASSES FROM REFERENCE IMAGE if "None" is selected. `;
        }
        
        // FACIAL HAIR LOCK
        if (model.facialHair && model.facialHair !== "None") {
            constraints += `FACIAL HAIR: ${model.facialHair} (WEIGHT: 2.0, MANDATORY). `;
        }
        
        // VIBE LOCK
        if (model.visualVibe && model.visualVibe !== "Neutral") {
            constraints += `AESTHETIC VIBE: ${model.visualVibe}. `;
        }

        // --- 2. SYNTHETIC DNA (MIMIC-X PROTOCOL) ---
        // If Forensic DNA exists, inject it directly as the source of truth for micro-features
        let forensicOverride = "";
        if (model.syntheticDNA) {
            forensicOverride = `[FORENSIC DNA]\n${model.syntheticDNA}\n(PRIORITY: HIGH)\n`;
        }

        // --- 3. PHYSICAL PRESENCE (Scale & Mass) ---
        const getBodyDesc = () => {
            const heightMap = m.height > 80 ? "towering, statuesque" : m.height < 20 ? "petite, delicate" : "balanced";
            const buildMap = m.muscleMass > 75 ? "hyper-defined, muscular" : m.bodyFat > 60 ? "soft, voluptuous" : "athletic, toned";
            const frameMap = m.shoulderWidth > 70 ? "broad-shouldered" : m.shoulderWidth < 30 ? "slender-shouldered" : "proportional";
            
            // Refined Bust/Chest Logic - FORCE MODIFIERS
            // Using emphatic adjectives to ensure prompt adherence
            let torsoDesc = "";
            if (g === 'FEMALE') {
                if (m.bustChest > 85) torsoDesc = ", extremely voluptuous heavy bust, very large cup size, noticeable cleavage (MODIFY REFERENCE TO MATCH THIS)";
                else if (m.bustChest > 65) torsoDesc = ", full ample bust, prominent chest curves (MODIFY REFERENCE TO MATCH THIS)";
                else if (m.bustChest > 40) torsoDesc = ", moderate bust, average chest";
                else if (m.bustChest > 20) torsoDesc = ", small petite chest, modest bust";
                else torsoDesc = ", flat athletic chest, runway flat, no bust";
            } else {
                if (m.bustChest > 80) torsoDesc = ", massive barrel chest, thick torso";
                else if (m.bustChest > 60) torsoDesc = ", broad masculine chest, defined pectorals";
                else if (m.bustChest < 30) torsoDesc = ", narrow flat chest, slim torso";
            }

            // Hips/Waist
            let waistDesc = "";
            if (m.hipsWaistRatio > 80) waistDesc = g === 'FEMALE' ? ", extreme hourglass figure, wide hips, tiny waist" : ", heavy v-taper";
            else if (m.hipsWaistRatio > 60) waistDesc = g === 'FEMALE' ? ", curvy hips, defined waist" : ", athletic v-taper";
            else if (m.hipsWaistRatio < 30) waistDesc = ", straight blocky torso, no curves";

            return `Subject possesses a ${heightMap}, ${frameMap} frame with a ${buildMap} physique${torsoDesc}${waistDesc}.`;
        };

        // --- 4. FACIAL GEOMETRY (The "Identity Anchor") ---
        const getFaceDesc = () => {
            const nose = m.noseStructure > 70 ? "prominent, aquiline nose" : m.noseStructure < 30 ? "soft, button nose" : "straight bridge nose";
            const jaw = m.jawlineDefinition > 70 ? "razor-sharp jawline" : m.jawlineDefinition < 30 ? "soft, recessive jaw" : "defined jaw";
            const eyes = m.eyeSize > 70 ? "large, expressive doe-eyes" : "piercing, almond-shaped eyes";
            const spacing = m.eyeSpacing > 70 ? "wide-set eyes" : m.eyeSpacing < 30 ? "close-set eyes" : "balanced eye spacing";
            const tilt = m.eyeTilt > 70 ? "upturned cat-eyes" : m.eyeTilt < 30 ? "downturned eyes" : "neutral eye tilt";
            const forehead = m.foreheadHeight > 70 ? "high, intellectual forehead" : "low hairline";
            
            return `Facial structure is ${model.morphology.faceShape.toLowerCase()} with a ${jaw}, ${forehead}, ${spacing}, ${tilt}, ${nose}, and ${eyes}.`;
        };

        // --- 5. DERMATOLOGY ENGINE (The "Realism Layer") ---
        const getSkinPhysics = () => {
            if (m.skinTexture < 30) return "Skin is flawless, airbrushed studio perfection.";
            
            const imperfections = m.imperfections > 50 ? "visible natural asymmetry and beauty marks" : "minimal blemishes";
            const pores = m.pores > 50 ? "visible high-frequency pore texture" : "fine texture";
            const flush = m.redness > 40 ? "subtle subsurface scattering and flush" : "even tone";
            const sheen = m.skinSheen > 60 ? "dewy, hydrated skin sheen" : "matte skin finish";
            const freckles = m.freckleDensity > 30 ? "dusted with natural freckles" : "";
            const veins = m.vascularity > 40 ? "subtle visible vascularity under skin" : "";
            
            return `Skin renders with ${pores}, ${imperfections}, ${freckles}, ${veins}, and ${flush}. ${sheen}. Realistic vellus hair visibility on close-ups. Unretouched raw photography aesthetic.`;
        };
        
        // --- 6. GROOMING (Hair & Brows) ---
        const getGrooming = () => {
            const texture = model.hairTexture ? `, ${model.hairTexture.split('(')[0].trim()} texture` : '';
            const gray = m.grayScale > 20 ? ` with ${(m.grayScale)}% gray/white strands` : '';
            const brows = model.eyebrowStyle ? `, ${model.eyebrowStyle.toLowerCase()} eyebrows` : '';
            return `Hair: ${model.hairColor}, ${model.hairStyle}${texture}${gray}${brows}.`;
        };

        return `
        [HARD CONSTRAINTS]
        ${constraints}
        
        ${forensicOverride}

        [IDENTITY CORE]
        Subject: ${model.name}, ${model.age}-year-old ${model.gender}.
        Ethno-Genotype (Bone Structure): ${model.ethnicity}.
        Phenotype (Pigmentation): ${model.skinTone} Skin.
        ${getBodyDesc()}
        ${getFaceDesc()}
        Features: ${model.distinctiveFeatures}.
        
        [STYLING & GROOMING]
        ${getGrooming()}
        Eyes: ${model.eyeColor}.
        Style: ${model.clothingStyle}.
        
        [PHYSICS & TEXTURE]
        ${getSkinPhysics()}
        `;
    }
}
