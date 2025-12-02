
import { getClient, MODELS } from "../config";
import { ModelAttributes, ModelMorphology, Gender } from "../../../types";
import { DEFAULT_MORPHOLOGY } from "../../../data/constants";

export class AnalysisAgent {
    
    /**
     * Analyzes a set of images to determine the subject's physical attributes.
     * Returns a partial ModelAttributes object to merge.
     */
    static async analyzeReferenceImages(images: string[]): Promise<Partial<ModelAttributes>> {
        const ai = getClient(true); // Can use free pool for analysis
        
        // Convert Base64 images to parts
        const parts: any[] = [];
        for (const img of images) {
            const data = img.split(',')[1];
            const mime = img.match(/:(.*?);/)?.[1] || 'image/png';
            parts.push({ inlineData: { mimeType: mime, data } });
        }

        const prompt = `
        ROLE: Expert Biometric Analyst and Fashion Stylist.
        TASK: Analyze the person in these reference images and construct a digital profile.
        
        OUTPUT JSON Schema:
        {
            "gender": "MALE" | "FEMALE",
            "ethnicity": "string (e.g. Latina, East Asian, Nordic)",
            "age": number (estimate),
            "hairColor": "string",
            "hairStyle": "string",
            "eyeColor": "string",
            "morphology": {
                "height": number (0-100, where 50 is average),
                "weight": number (0-100, where 50 is average),
                "muscle": number (0-100, where 0 is soft, 100 is bodybuilder),
                "curves": number (0-100, female curviness / male chest width),
                "chest": number (0-100),
                "faceWidth": number (0-100),
                "jawLine": number (0-100, where 100 is very sharp/square),
                "cheekbones": number (0-100),
                "eyeSize": number (0-100),
                "noseSize": number (0-100),
                "lipFullness": number (0-100)
            },
            "clothingStyle": "string (inferred from images)",
            "distinctiveFeatures": "string (e.g. freckles, beard, glasses)"
        }
        
        INSTRUCTIONS:
        1. Be precise with morphology sliders.
        2. Infer style from clothing.
        3. If multiple people, focus on the most prominent subject.
        `;

        parts.push({ text: prompt });

        try {
            const response = await ai.models.generateContent({
                model: MODELS.IMAGE.FAST, // Use Gemini Flash for Vision
                contents: { parts },
                config: { responseMimeType: "application/json" }
            });

            const text = response.text || "{}";
            const json = JSON.parse(text);
            
            // Validate and sanitize return
            return {
                gender: json.gender === 'MALE' ? 'MALE' : 'FEMALE',
                ethnicity: json.ethnicity || "Unknown",
                age: json.age || 25,
                hairColor: json.hairColor || "Brunette",
                hairStyle: json.hairStyle || "Straight",
                eyeColor: json.eyeColor || "Brown",
                clothingStyle: json.clothingStyle || "Casual",
                distinctiveFeatures: json.distinctiveFeatures || "",
                morphology: { ...DEFAULT_MORPHOLOGY, ...json.morphology }
            };

        } catch (e) {
            console.error("Reference Analysis Failed", e);
            throw new Error("Failed to analyze reference images.");
        }
    }
}