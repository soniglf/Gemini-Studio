
import { MODELS } from "../config";
import { attemptImageGeneration } from "../execution";
import { GenerationResult, GenerationTier } from "../../../types";

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export class EditAgent {
    static async edit(original: Blob, mask: Blob, instruction: string): Promise<GenerationResult> {
        const modelName = MODELS.IMAGE.FAST;
        const keyType = 'PAID';

        const originalB64 = await blobToBase64(original);
        const maskB64 = await blobToBase64(mask);

        const prompt = `
        TASK: Edit the ORIGINAL IMAGE based on the MASK and INSTRUCTION.
        INSTRUCTION: ${instruction}
        
        [IMPORTANT]
        1. The white area in the MASK is the region to edit.
        2. Keep the unmasked area EXACTLY identical to the original.
        3. Maintain photorealism and lighting consistency.
        `;

        const images = {
            'original': originalB64,
            'mask': maskB64
        };

        const blob = await attemptImageGeneration(modelName, prompt, images, "1:1", "1K", keyType);
        
        if (!blob) throw new Error("Edit failed.");
        
        const url = URL.createObjectURL(blob);
        return { url, blob, finalPrompt: instruction, usedModel: modelName, keyType, tier: GenerationTier.RENDER, tags: ["Edit"] };
    }

    static async refine(original: Blob, originalPrompt: string): Promise<GenerationResult> {
        const modelName = MODELS.IMAGE.PRO; 
        const keyType = 'PAID';

        const originalB64 = await blobToBase64(original);
        
        const prompt = `
        TASK: Upscale and Refine the provided image.
        CONTEXT: The image was generated with this prompt: "${originalPrompt}"
        
        INSTRUCTIONS:
        1. OUTPUT RESOLUTION: 2048x2048 (2K) or higher.
        2. DETAIL: Add realistic skin texture, pore details, fabric weave, and environmental micro-details.
        3. COMPOSITION: Keep the EXACT same composition, pose, and color palette. Do not change the subject's face identity.
        4. QUALITY: Denoise, sharpen, and fix any AI artifacts.
        `;

        const images = { 'image': originalB64 };
        
        const blob = await attemptImageGeneration(modelName, prompt, images, "1:1", "High", keyType);

        if (!blob) throw new Error("Refinement failed.");

        const url = URL.createObjectURL(blob);
        return { url, blob, finalPrompt: "Refined: " + originalPrompt, usedModel: modelName, keyType, tier: GenerationTier.RENDER, tags: ["Refined"] };
    }
}
