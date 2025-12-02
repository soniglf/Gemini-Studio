


import { MODELS } from "../config";
import { PromptBuilder } from "../prompts";
import { attemptVideoGeneration } from "../execution";
import { ModelAttributes, MotionSettings, GenerationResult, GenerationTier } from "../../../types";

export class VideoAgent {
    static async buildVideoPrompt(model: ModelAttributes, settings: MotionSettings, projectContext?: string): Promise<string> {
        const scene = `Cinematic. Action: ${settings.action}. Location: ${settings.location}.`;
        
        return new PromptBuilder()
            .withModel(model)
            .withProjectContext(projectContext)
            .withScene(scene)
            .withTechSpecs(settings, 'LIFESTYLE', true)
            .withStyle('MOTION')
            .build();
    }

    static async generate(
        model: ModelAttributes, 
        settings: MotionSettings, 
        tier: GenerationTier, 
        projectContext?: string
    ): Promise<GenerationResult> {
        const fullPrompt = await VideoAgent.buildVideoPrompt(model, settings, projectContext);
        
        const modelName = tier === GenerationTier.SKETCH ? MODELS.VIDEO.FAST : MODELS.VIDEO.PRO;
        const keyType = 'PAID'; 
        
        const blob = await attemptVideoGeneration(
            modelName, 
            fullPrompt, 
            settings.aspectRatio, 
            settings.resolution, 
            keyType,
            settings.sourceImage
        );
        
        if (!blob) throw new Error("No video data returned.");
        
        const url = URL.createObjectURL(blob);
        const tags = ["Motion", settings.vibe, "Video"];

        return { url, blob, finalPrompt: fullPrompt, usedModel: modelName, keyType, tier, tags };
    }
}