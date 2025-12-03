
import { getClient, MODELS, SAFETY_SETTINGS } from "./config";
import { KeyVault } from "./keyVault";
import { FinishReason } from "@google/genai";

// RESILIENCE: Sleep function for backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// PERF: Optimized Base64 to Blob conversion (Byte Array)
const base64ToBlob = (base64Data: string, contentType: string = 'image/png'): Blob => {
    try {
        const sliceSize = 512;
        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    } catch (e) {
        console.error("Blob conversion failed", e);
        throw new Error("Failed to process image data.");
    }
};

export const enhancePromptWithMagic = async (basePrompt: string, context: string): Promise<string> => {
    try {
        const ai = getClient(true);
        const enhancerPrompt = `
        Role: Senior Art Director.
        Task: Rewrite this prompt to be raw, authentic, and remove AI-feel.
        Context: ${context}
        Current Prompt: "${basePrompt}"
        Rules: Use photography terms. Remove "stunning/perfect". Add "grainy/flash/raw".
        Output: ONLY the final refined prompt string.
        `;
        const response = await ai.models.generateContent({
            model: MODELS.TEXT,
            contents: enhancerPrompt,
            config: { temperature: 0.8, maxOutputTokens: 400 }
        });
        return response.text || basePrompt;
    } catch (e) {
        return basePrompt;
    }
};

async function executeWithCascade(
    primaryFn: () => Promise<Blob | null>,
    fallbackFn?: () => Promise<Blob | null>
): Promise<Blob | null> {
    try {
        return await primaryFn();
    } catch (error: any) {
        if (error.message && (error.message.includes('Safety') || error.message.includes('Refused'))) {
            throw error;
        }

        // Only cascade on transient errors or quotas, not on Safety or Bad Request
        const isTransient = error.status === 429 || error.status >= 500 || 
                            error.message?.includes('Quota') || 
                            error.message?.includes('Resource has been exhausted');

        if (fallbackFn && isTransient) {
            console.warn("Primary model failed (Transient). Executing fallback cascade...", error);
            return await fallbackFn();
        }
        throw error;
    }
}

export async function attemptImageGeneration(
    modelName: string, 
    prompt: string, 
    images: Record<string, string>, 
    aspectRatio: string,
    resolution: string = "1K",
    keyType: 'FREE' | 'PAID' = 'PAID',
    seed?: number
): Promise<Blob | null> {
    
    const generate = async (targetModel: string): Promise<Blob | null> => {
        const ai = getClient(keyType === 'FREE');
        const parts: any[] = [{ text: prompt }];

        Object.entries(images).forEach(([key, base64]) => {
            if(!base64) return;
            try {
                let data = base64.includes(',') ? base64.split(',')[1] : base64;
                let mime = base64.match(/:(.*?);/)?.[1] || 'image/png';
                parts.push({ inlineData: { mimeType: mime, data } });
            } catch (e) {
                console.warn(`Skipping invalid image input for key: ${key}`);
            }
        });

        const isPro = targetModel.includes('pro');
        const config: any = { 
            imageConfig: { aspectRatio: aspectRatio as any },
            safetySettings: SAFETY_SETTINGS
        };

        if (isPro) {
            let imageSize = "1K";
            if (resolution.includes("2K") || resolution.includes("High")) imageSize = "2K";
            config.imageConfig.imageSize = imageSize as any;
        }

        if (seed !== undefined) {
            config.seed = seed;
        }

        const response = await ai.models.generateContent({
            model: targetModel,
            contents: { parts },
            config: config
        });

        const candidate = response.candidates?.[0];
        if (!candidate) throw new Error("API returned no candidates.");
        
        // Robust Finish Reason Check
        const reason = candidate.finishReason;
        if (reason === FinishReason.SAFETY) {
             throw new Error("Generation blocked by Safety Filters. Please adjust your prompt.");
        }

        // Check for Image Data
        const part = candidate.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData) {
            return base64ToBlob(part.inlineData.data, part.inlineData.mimeType);
        }

        // Check for Text Refusal (Common with image models)
        const textPart = candidate.content?.parts?.find(p => p.text);
        if (textPart?.text) {
            console.warn("Model Refusal:", textPart.text);
            const msg = textPart.text.length > 100 ? textPart.text.substring(0, 100) + "..." : textPart.text;
            throw new Error(`Generation Refused: ${msg}`);
        }

        // If we get here, we have a candidate but no image and no text. 
        throw new Error(`Generation failed. Finish Reason: ${reason || 'UNKNOWN'}`);
    };

    try {
        return await executeWithCascade(
            () => generate(modelName),
            undefined 
        );
    } catch (e: any) {
        // Auto-downgrade logic for 403 Permission Denied and other model access errors
        const errString = (JSON.stringify(e) + (e.message || '')).toLowerCase();
        
        const isModelError = 
            errString.includes('404') || 
            errString.includes('not found') || 
            errString.includes('model') || 
            errString.includes('permission') || 
            errString.includes('denied') ||
            errString.includes('403');
            
        const isProRequest = modelName.includes('pro') || modelName.includes('preview');
        
        // If the PRO model fails with a permission/403 error, fallback to Flash
        if (isProRequest && (isModelError || keyType === 'FREE')) {
            console.warn(`[Auto-Downgrade] Pro model ${modelName} failed. Retrying with Flash model.`, e);
            try {
                return await generate(MODELS.IMAGE.FAST);
            } catch (fallbackError: any) {
                // If fallback also fails, likely a broader issue (Safety or Key invalid for all)
                if (fallbackError.message?.includes('Safety') || fallbackError.message?.includes('Refused')) throw fallbackError;
                
                // If original was permission denied, rethrow that to let user know, 
                // UNLESS fallback succeeded (which we return above).
                throw e; 
            }
        }
        throw e;
    }
}

export async function attemptVideoGeneration(
    modelName: string,
    prompt: string,
    aspectRatio: string,
    resolution: string = "720p",
    keyType: 'FREE' | 'PAID' = 'PAID',
    sourceImage: string | null = null
): Promise<Blob | null> {
    const ai = getClient(keyType === 'FREE');
    let apiResolution = '720p';
    if (resolution.includes('1080') && !modelName.includes('fast')) apiResolution = '1080p';

    const config: any = {
        numberOfVideos: 1,
        aspectRatio: aspectRatio as any, 
        resolution: apiResolution as any,
        safetySettings: SAFETY_SETTINGS
    };
    
    const request: any = {
        model: modelName,
        prompt: prompt,
        config: config
    };

    if (sourceImage) {
        const data = sourceImage.includes(',') ? sourceImage.split(',')[1] : sourceImage;
        const mime = sourceImage.match(/:(.*?);/)?.[1] || 'image/png';
        request.image = {
            imageBytes: data,
            mimeType: mime
        };
    }

    let operation = await ai.models.generateVideos(request);

    // Poll for completion
    while (!operation.done) {
        await sleep(5000); // 5s Interval
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) throw new Error((operation.error.message as string) || "Video generation failed");

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation succeeded but returned no URI.");

    // SECURE DOWNLOAD
    const apiKey = KeyVault.getKey(keyType);
    if (!apiKey) throw new Error("Authentication Error: Missing API Key for download.");
    
    try {
        const response = await fetch(`${videoUri}&key=${apiKey}`);
        
        if (!response.ok) {
            // Check for specific Google Storage errors
            if (response.status === 403) throw new Error("Access Denied: The video link may have expired or the key is invalid.");
            if (response.status === 404) throw new Error("Video file not found.");
            
            throw new Error(`Failed to download video. Status: ${response.status}`);
        }

        return await response.blob();
    } catch (e: any) {
        // Redact API key from error messages
        const cleanMsg = e.message.replace(apiKey, 'REDACTED_KEY');
        console.error("Video Download Error:", cleanMsg);
        throw new Error(cleanMsg);
    }
}

export const generateLocationPreviews = async (locationName: string): Promise<string[]> => {
    try {
        const ai = getClient(true);
        const prompt = `Location photography: ${locationName}, wide angle, raw photo, cloudy day. Photorealistic, 4k, no people.`;
        const response = await ai.models.generateContent({
            model: MODELS.IMAGE.FAST,
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: '1:1' } } 
        });
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        // Use the optimized conversion even for previews
        return part?.inlineData ? [URL.createObjectURL(base64ToBlob(part.inlineData.data, part.inlineData.mimeType))] : [];
    } catch (e: any) { 
        console.debug("Location preview generation failed (non-critical):", e);
        return [];
    }
};
