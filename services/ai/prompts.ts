
import { ModelAttributes, StudioSettings, InfluencerSettings, MotionSettings } from "../../types";
import { IdentityAgent } from "./agents/identityAgent";

export class PromptBuilder {
    private parts: string[] = [];
    private identityAnchor: string = "";

    withModel(model: ModelAttributes): PromptBuilder {
        // Use the new Narrative DNA engine for richer descriptions
        const narrative = IdentityAgent.buildNarrativeDNA(model);
        
        // Extract key visual anchors to repeat for consistency
        this.identityAnchor = `${model.ethnicity} ${model.gender}, ${model.hairColor} ${model.hairStyle}, ${model.eyeColor} eyes`;

        this.parts.push(`[SUBJECT DNA]\n${narrative}`);
        
        // Identity Strictness Logic - Enhanced for "Clone Engine" behavior
        if (model.strictness >= 100) {
             this.parts.push(`[VISUAL SOURCE: HOLISTIC CLONE]
             CRITICAL: The Reference Images are the MASTER BLUEPRINT.
             1. REPLICATE the subject's entire appearance (Face, Body, Style) from the references.
             2. ADAPT only where the text prompt explicitly requests a change (e.g. specific clothing or action).
             3. SCRUB: You must REMOVE any UI overlays, phone interfaces, or social media buttons seen in the references.
             `);
        } else if (model.strictness > 80) {
             this.parts.push(`[IDENTITY LOCK: EXTREME]
             YOU MUST CLONE THE SUBJECT FROM THE REFERENCE IMAGE EXACTLY.
             Match facial structure, eye spacing, and nose shape 1:1.
             Keep styling consistent with text prompt, not reference image.
             `);
        } else if (model.strictness > 40) {
             this.parts.push(`[IDENTITY GUIDANCE]
             Resemble the reference image closely in terms of bone structure and key features.
             `);
        }
        
        return this;
    }

    withTurnaroundSheet(): PromptBuilder {
        this.parts.push(`
        [LAYOUT: SQUARE 2x2 GRID REFERENCE SHEET]
        GENERATE A SPLIT-SCREEN IMAGE WITH 4 DISTINCT PANELS ARRANGED IN A 2x2 GRID.
        ALL PANELS MUST FEATURE THE EXACT SAME PERSON (${this.identityAnchor}).
        
        1. TOP-LEFT: Front View (Full Body, Standing Neutral, Hands at sides).
        2. TOP-RIGHT: Side Profile (Full Body, Facing Right).
        3. BOTTOM-LEFT: Back View (Full Body).
        4. BOTTOM-RIGHT: Extreme Face Close-up (Detailed skin texture, emotive, direct eye contact).
        
        [STYLING RULES]
        - Attire: Simple matte black minimalist underwear/swimwear. NO LOGOS.
        - Makeup: None/Natural.
        - Lighting: Soft, clinical studio lighting (Octabox).
        - Background: Neutral Infinite White Cyclorama.
        - Quality: 8k, Raw Photography, Hasselblad X2D, Unretouched.
        `);
        return this;
    }

    withScene(scene: string): PromptBuilder {
        this.parts.push(`[SCENE & ACTION]\n${scene}`);
        return this;
    }
    
    withTechSpecs(settings: Partial<StudioSettings | InfluencerSettings | MotionSettings>, type: 'STUDIO' | 'LIFESTYLE', isVideo: boolean): PromptBuilder {
        if (type === 'STUDIO') {
            const s = settings as StudioSettings;
            if (s.cameraModel) this.parts.push(`Camera: ${s.cameraModel}`);
            if (s.lightingSetup) this.parts.push(`Lighting: ${s.lightingSetup}`);
            if (s.lensFocalLength) this.parts.push(`Lens: ${s.lensFocalLength}`);
            this.parts.push(`Film Stock: Kodak Portra 400 (Simulated)`);
        } else {
            this.parts.push(`Style: Candid, High-End Social Media, Raw`);
        }
        return this;
    }

    withStyle(style: string): PromptBuilder {
         this.parts.push(`[AESTHETIC: ${style}]`);
         return this;
    }

    withNegativePrompt(negative?: string): PromptBuilder {
        // Strong suppression of UI artifacts and social media overlays
        const standardNegative = "UI, Interface, Instagram, Watermark, Text, Icons, Overlay, HUD, Buttons, Menu, App Interface, Split Screen, Low Quality, Blurry, Cartoon, Username, Social Media Interface, Screen Recording, TikTok Overlay, Emoji, Hearts, Notification Badge, Distorted, Ugly, Deformed";
        this.parts.push(`[NEGATIVE PROMPT: ${standardNegative}${negative ? ', ' + negative : ''}]`);
        return this;
    }

    withProjectContext(context?: string): PromptBuilder {
        if (context) this.parts.push(`[PROJECT GUIDELINES]\n${context}`);
        return this;
    }

    build(): string {
        return this.parts.join('\n\n');
    }
}
