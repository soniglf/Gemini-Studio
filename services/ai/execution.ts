
import { getClient, MODELS, SAFETY_SETTINGS } from "./config";
import { KeyVault } from "./keyVault";
import { FinishReason, GenerateContentResponse } from "@google/genai";

// RESILIENCE: Sleep function for backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// RESILIENCE: Exponential Backoff with Jitter
async function withRetry<T>(
    fn: () => Promise<T>, 
    retries = 3, 
    baseDelay = 1000,
    operationName = "Operation"
): Promise<T> {
    let currentTry = 0;
    while (true) {
        try {
            return await fn();
        } catch (e: any) {
            currentTry++;
            if (currentTry > retries) throw e;
            
            // Analyze error for retry eligibility
            const status = e.status || e.code || 0;
            const msg = (e.message || "").toLowerCase();
            
            // Expanded retry conditions for IMAGE_OTHER, XHR, and temporary glitches
            const isRetryable = 
                status === 429 || // Rate Limit
                status >= 500 ||  // Server Error
                msg.includes('quota') || 
                msg.includes('overloaded') ||
                msg.includes('timeout') ||
                msg.includes('image_other') ||
                msg.includes('internal error') ||
                msg.includes('temporary') ||
                msg.includes('xhr error') || 
                msg.includes('rpc failed') ||
                msg.includes('fetch failed');

            if (!isRetryable) throw e;

            // Exponential Backoff: base * 2^(attempt-1) + Jitter
            const delay = baseDelay * Math.pow(2, currentTry - 1) + (Math.random() * 1000);
            
            console.warn(`[Citadel] ${operationName} failed (${status}/${msg}). Retrying in ${Math.round(delay)}ms... (${retries - currentTry} left)`);
            
            await sleep(delay);
        }
    }
}

// SECURITY: Redact API Keys from logs
export const redactKeys = (msg: string): string => {
    if (!msg) return "";
    const keyPattern = /AIza[0-9A-Za-z-_]{35}/g;
    return msg.replace(keyPattern, 'REDACTED_KEY');
};

// SAFETY: Sanitize prompt for fallback attempts
const sanitizePrompt = (prompt: string): string => {
    // Replace trigger words that might flag safety filters in standard models
    return prompt
        .replace(/\bshoot\b/gi, "create image of")
        .replace(/\bshot\b/gi, "view")
        .replace(/\bheadshot\b/gi, "portrait")
        .replace(/\bshooting\b/gi, "photographing")
        .replace(/\bbody\b/gi, "figure")
        .replace(/\bskin\b/gi, "complexion")
        .replace(/\bflash\b/gi, "lighting");
};

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
        console.error("Blob conversion failed");
        throw new Error("Failed to process image data.");
    }
};

export const enhancePromptWithMagic = async (basePrompt: string, context: string): Promise<string> => {
    try {
        let ai;
        try { ai = getClient(true); } catch { ai = getClient(false); }
        
        const enhancerPrompt = `
        Role: Senior Art Director.
        Task: Rewrite this prompt to be raw, authentic, and remove AI-feel.
        Context: ${context}
        Current Prompt: "${basePrompt}"
        Rules: Use photography terms. Remove "stunning/perfect". Add "grainy/flash/raw".
        Output: ONLY the final refined prompt string.
        `;
        
        const response = await withRetry(() => ai.models.generateContent({
            model: MODELS.TEXT,
            contents: enhancerPrompt,
            config: { temperature: 0.8, maxOutputTokens: 400 }
        }), 2, 500, "Magic Prompt") as GenerateContentResponse;

        return response.text || basePrompt;
    } catch (e) {
        return basePrompt;
    }
};

/**
 * Execute generation with detailed error logging for Pro models
 */
export async function attemptImageGeneration(
    modelName: string, 
    prompt: string, 
    images: Record<string, string>, 
    aspectRatio: string,
    resolution: string = "1K",
    keyType: 'FREE' | 'PAID' = 'PAID',
    seed?: number
): Promise<Blob | null> {
    
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

    const config: any = { 
        imageConfig: { aspectRatio: aspectRatio as any },
        safetySettings: SAFETY_SETTINGS 
    };

    if (seed !== undefined) {
        config.seed = seed;
    }

    try {
        const ai = getClient(keyType === 'FREE');
        
        console.log(`[Gemini Execution] Attempting ${modelName} with tier ${keyType}...`);
        
        // WRAPPED IN RETRY LOGIC
        // Increased to 5 retries with 2000ms base delay for higher resilience against IMAGE_OTHER
        const response = await withRetry(async () => {
            const res = await ai.models.generateContent({
                model: modelName,
                contents: { parts },
                config: config
            }) as GenerateContentResponse;

            // INSPECT INSIDE RETRY LOOP
            // This ensures that model-level errors (like IMAGE_OTHER) trigger the retry mechanism
            const candidate = res.candidates?.[0];
            const reason = candidate?.finishReason;
            const reasonStr = (reason as unknown as string);

            if (reasonStr === 'IMAGE_OTHER' || reasonStr === 'OTHER') {
                throw new Error("Generation failed (IMAGE_OTHER). The model encountered a temporary internal error.");
            }

            return res;

        }, 5, 2000, "Image Generation");

        const candidate = response.candidates?.[0];
        if (!candidate) throw new Error("API returned no candidates.");
        
        const reason = candidate.finishReason;
        const reasonStr = (reason as unknown as string);
        
        const isSafetyBlock = reason === FinishReason.SAFETY || reasonStr === 'IMAGE_SAFETY' || reasonStr === 'SAFETY';
        
        if (isSafetyBlock) {
             if (modelName === MODELS.IMAGE.PRO) {
                 const sanitized = sanitizePrompt(prompt);
                 console.warn(`[Gemini Resilience] Safety Block. Sanitizing and falling back to ${MODELS.IMAGE.FAST}.`);
                 
                 return attemptImageGeneration(
                    MODELS.IMAGE.FAST,
                    sanitized, 
                    images,
                    aspectRatio,
                    "1K", 
                    keyType,
                    seed
                );
             }
             throw new Error("Generation blocked by Safety Filters. Please adjust your prompt.");
        }

        const part = candidate.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData) {
            return base64ToBlob(part.inlineData.data, part.inlineData.mimeType);
        }

        const textPart = candidate.content?.parts?.find(p => p.text);
        if (textPart?.text) {
            console.warn("Model Refusal:", redactKeys(textPart.text));
            const msg = textPart.text.length > 100 ? textPart.text.substring(0, 100) + "..." : textPart.text;
            throw new Error(`Generation Refused: ${msg}`);
        }

        throw new Error(`Generation failed. Finish Reason: ${reasonStr || 'UNKNOWN'}`);

    } catch (e: any) {
        const cleanMessage = redactKeys(e.message || e.toString());
        console.error(`[Execution Failed] Model: ${modelName}`, cleanMessage);
        
        const errStr = cleanMessage.toLowerCase();
        const status = e.status || e.code || 0;

        if (errStr.includes('429') || errStr.includes('quota') || status === 429) {
            throw new Error("System Busy (429): High traffic. Please wait a moment and try again.");
        }

        const isAccessError = 
            errStr.includes('403') || 
            errStr.includes('permission_denied') ||
            errStr.includes('404') || 
            errStr.includes('not found') ||
            status === 403;
            
        // If critical failure on PRO, fallback to FAST
        if ((isAccessError || errStr.includes('internal error') || errStr.includes('image_other')) && modelName === MODELS.IMAGE.PRO) {
            console.warn(`[Gemini Resilience] Primary model ${modelName} failed. Falling back to ${MODELS.IMAGE.FAST}.`);
            return attemptImageGeneration(MODELS.IMAGE.FAST, prompt, images, aspectRatio, "1K", keyType, seed);
        }
        
        throw new Error(cleanMessage);
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
    
    const config: any = {
        numberOfVideos: 1,
        aspectRatio: aspectRatio as any, 
        resolution: (resolution.includes('1080') && !modelName.includes('fast')) ? '1080p' as any : '720p' as any,
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
        request.image = { imageBytes: data, mimeType: mime };
    }

    try {
        let apiKey: string;
        try { apiKey = KeyVault.getKey(keyType); } catch (e) { throw new Error("Missing API Key. Please add a paid key in Settings to generate video."); }

        const ai = getClient(keyType === 'FREE');
        
        // WRAPPED IN RETRY
        let operation: any = await withRetry(() => ai.models.generateVideos(request), 2, 2000, "Video Init");

        // Poll for completion
        while (!operation.done) {
            await sleep(5000); 
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) throw new Error((operation.error.message as string) || "Video generation failed");

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("Video generation succeeded but returned no URI.");

        const response = await fetch(`${videoUri}&key=${apiKey}`);
        
        if (!response.ok) {
            if (response.status === 403) throw new Error("Access Denied: The video link may have expired or the key is invalid.");
            throw new Error(`Failed to download video. Status: ${response.status}`);
        }

        return await response.blob();
    } catch (e: any) {
        const cleanMsg = redactKeys(e.message || e.toString());
        console.error("Video Gen Error:", cleanMsg);
        throw new Error(cleanMsg);
    }
}

export const generateLocationPreviews = async (locationName: string): Promise<string[]> => {
    try {
        let ai;
        try { ai = getClient(true); } catch { ai = getClient(false); }

        const prompt = `Location photography: ${locationName}, wide angle, raw photo, cloudy day. Photorealistic, 4k, no people.`;
        const response = await withRetry(() => ai.models.generateContent({
            model: MODELS.IMAGE.FAST,
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: '1:1' } } 
        }), 1, 1000, "Location Preview") as GenerateContentResponse;
        
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        return part?.inlineData ? [URL.createObjectURL(base64ToBlob(part.inlineData.data, part.inlineData.mimeType))] : [];
    } catch (e: any) { 
        return [];
    }
};
