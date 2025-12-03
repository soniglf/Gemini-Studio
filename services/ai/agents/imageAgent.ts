
import { MODELS } from "../config";
import { PromptBuilder } from "../prompts";
import { attemptImageGeneration, enhancePromptWithMagic } from "../execution";
import { ModelAttributes, StudioSettings, InfluencerSettings, GenerationResult, GenerationTier } from "../../../types";

export class ImageAgent {
    
    // --- BUILDER METHODS ---

    static async buildCreatorPrompt(model: ModelAttributes): Promise<string> {
        // This is the "Source of Truth" generator
        return new PromptBuilder()
            .withModel(model)
            .withTurnaroundSheet()
            .withTechSpecs({}, 'STUDIO', false) // Default neutral tech specs
            .build();
    }
    
    static async buildStudioPrompt(model: ModelAttributes, settings: StudioSettings, projectContext?: string): Promise<string> {
        const isComplexBackground = settings.background.length > 20 || settings.background.includes(' ');
        const bgPrompt = settings.selectedLocationPreview 
            ? "Background: Reference location." 
            : isComplexBackground ? `Setting: ${settings.background}` : `Background: ${settings.background} (${settings.backgroundColor})`;
        
        const actionPrompt = settings.productDescription ? `ACTION/SUBJECT: ${settings.productDescription}` : `Shot: ${settings.shotType}`;
        const scene = `Studio Photography. ${actionPrompt}. ${bgPrompt}. ${settings.isHighFashion ? `VIBE: ${settings.editorialVibe}` : ''}`;
        
        const fullPrompt = new PromptBuilder()
            .withModel(model)
            .withProjectContext(projectContext)
            .withScene(scene)
            .withTechSpecs(settings, 'STUDIO', false)
            .withStyle('STUDIO')
            .withNegativePrompt(settings.customNegative)
            .build();

        if (settings.useMagicPrompt) return await enhancePromptWithMagic(fullPrompt, "High-End Studio Photography");
        return fullPrompt;
    }

    static async buildInfluencerPrompt(model: ModelAttributes, settings: InfluencerSettings, projectContext?: string): Promise<string> {
        const scene = `Candid Lifestyle. ACTION: ${settings.action}. LOCATION: ${settings.location}. VIBE: ${settings.vibe}.`;
        
        const fullPrompt = new PromptBuilder()
            .withModel(model)
            .withProjectContext(projectContext)
            .withScene(scene)
            .withTechSpecs(settings, 'LIFESTYLE', false)
            .withStyle('INFLUENCER')
            .withNegativePrompt(settings.customNegative)
            .build();

        if (settings.useMagicPrompt) return await enhancePromptWithMagic(fullPrompt, "Candid Social Media Shot");
        return fullPrompt;
    }

    // --- EXECUTION METHODS ---

    static async generateStudio(
        model: ModelAttributes, 
        settings: StudioSettings, 
        tier: GenerationTier, 
        projectContext?: string, 
        feedback?: string
    ): Promise<GenerationResult> {
        const finalPrompt = await ImageAgent.buildStudioPrompt(model, settings, projectContext);
        
        const images: Record<string, string> = {};
        
        // Strictness Logic: If strictness > 0, we pass the face references.
        // If strictness is very high (100%), we pass up to 5 images for maximum fidelity.
        if (model.strictness > 0) {
            if (model.referenceImages && model.referenceImages.length > 0) {
                 const refLimit = model.strictness >= 100 ? 5 : 3;
                 model.referenceImages.slice(0, refLimit).forEach((ref, i) => images[`ref_${i}`] = ref);
            } else if (model.referenceImage) {
                images['face'] = model.referenceImage;
            }
        }
        
        if (settings.outfitImage) images['outfit'] = settings.outfitImage;
        if (settings.productImage) images['product'] = settings.productImage;
        if (settings.selectedLocationPreview) images['background_ref'] = settings.selectedLocationPreview;

        const modelName = tier === GenerationTier.RENDER ? MODELS.IMAGE.PRO : MODELS.IMAGE.FAST;
        const keyType = tier === GenerationTier.SKETCH ? 'FREE' : 'PAID';
        
        const blob = await attemptImageGeneration(modelName, finalPrompt, images, settings.aspectRatio, settings.resolution, keyType, settings.seed);
        if (!blob) throw new Error("No image data returned.");
        
        const url = URL.createObjectURL(blob);
        const tags = ["Studio", settings.shotType, settings.lighting];
        if(settings.isHighFashion) tags.push("Fashion");

        return { url, blob, finalPrompt, usedModel: modelName, keyType, tier, tags };
    }

    static async generateInfluencer(
        model: ModelAttributes, 
        settings: InfluencerSettings, 
        tier: GenerationTier, 
        projectContext?: string, 
        feedback?: string
    ): Promise<GenerationResult> {
        const finalPrompt = await ImageAgent.buildInfluencerPrompt(model, settings, projectContext);

        const images: Record<string, string> = {};
        
        // Strictness Logic
        if (model.strictness > 0) {
            if (model.referenceImages && model.referenceImages.length > 0) {
                const refLimit = model.strictness >= 100 ? 5 : 3;
                model.referenceImages.slice(0, refLimit).forEach((ref, i) => images[`ref_${i}`] = ref);
            } else if (model.referenceImage) {
                images['face'] = model.referenceImage;
            }
        }
        
        if (settings.outfitImage) images['outfit'] = settings.outfitImage;
        if (settings.selectedLocationPreview) images['location_ref'] = settings.selectedLocationPreview;

        const modelName = tier === GenerationTier.RENDER ? MODELS.IMAGE.PRO : MODELS.IMAGE.FAST;
        const keyType = tier === GenerationTier.SKETCH ? 'FREE' : 'PAID';

        const blob = await attemptImageGeneration(modelName, finalPrompt, images, settings.aspectRatio, settings.resolution, keyType, settings.seed);
        if (!blob) throw new Error("No image data returned.");
        
        const url = URL.createObjectURL(blob);
        const tags = ["Influencer", settings.vibe, settings.timeOfDay];

        return { url, blob, finalPrompt, usedModel: modelName, keyType, tier, tags };
    }
}
