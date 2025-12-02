

import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { KeyVault } from "./keyVault";

export const MODELS = {
    IMAGE: {
        PRO: 'gemini-3-pro-image-preview',
        FAST: 'gemini-2.5-flash-image'
    },
    VIDEO: {
        PRO: 'veo-3.1-generate-preview',
        FAST: 'veo-3.1-fast-generate-preview'
    },
    TEXT: 'gemini-2.5-flash',
    LIVE: 'gemini-2.5-flash-native-audio-preview-09-2025'
};

export const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

/**
 * Creates a GenAI client.
 * Supports switching between FREE (Pool) and PAID (Pool or Gateway) keys.
 */
export const getClient = (useFreePool: boolean = false): GoogleGenAI => {
    let apiKey: string;
    
    try {
        apiKey = KeyVault.getKey(useFreePool ? 'FREE' : 'PAID');
    } catch (e) {
        console.error("Auth Error:", e);
        throw new Error(`Authentication Failed: ${e instanceof Error ? e.message : "Check Key Configuration"}`);
    }

    return new GoogleGenAI({ apiKey });
};