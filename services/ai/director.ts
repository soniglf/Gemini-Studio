
import { getClient, MODELS } from "./config";
import { DirectorPlan, AppMode, ModelAttributes } from "../../types";

export const generateDirectorPlan = async (brief: string, castModel?: ModelAttributes): Promise<DirectorPlan> => {
    // Director requires high intelligence, use PAID key for stability.
    const ai = getClient(false);
    
    // Schema definition for strictly structured output
    const schema = {
        type: "OBJECT",
        properties: {
            campaignName: { type: "STRING", description: "Catchy title for the ad campaign" },
            modelBrief: {
                type: "OBJECT",
                description: "Physical attributes of the model for this campaign",
                properties: {
                    name: { type: "STRING" },
                    ethnicity: { type: "STRING" },
                    age: { type: "NUMBER" },
                    hairStyle: { type: "STRING" },
                    hairColor: { type: "STRING" },
                    clothingStyle: { type: "STRING" },
                    vibe: { type: "STRING", description: "General aesthetic vibe" }
                }
            },
            shots: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        type: { type: "STRING", enum: ["STUDIO", "INFLUENCER"] },
                        description: { type: "STRING", description: "The action or pose" },
                        visualDetails: { type: "STRING", description: "Lighting, background, and camera details" }
                    }
                }
            }
        },
        required: ["campaignName", "modelBrief", "shots"]
    };

    const context = castModel 
        ? `CASTING REQUIREMENT: You MUST use the specific model "${castModel.name}".
           Model Specs: ${castModel.ethnicity}, ${castModel.age}yo, ${castModel.hairColor} ${castModel.hairStyle}.
           DO NOT invent a new person. Adapt the campaign vibe to fit THIS model.`
        : `1. Define a Model Persona that fits the brief.`;

    const prompt = `
    You are a World-Class Creative Director.
    User Brief: "${brief}"
    ${context}
    
    Task: Create a cohesive fashion/lifestyle campaign plan.
    1. Define the Model Persona (if casting, use provided specs).
    2. Create a Shot List of 4 distinct images (mix of Studio and Lifestyle) that tell a story.
    
    Output JSON only.
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODELS.TEXT,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                // @ts-ignore
                responseSchema: schema
            }
        });

        const text = response.text || "{}";
        const json = JSON.parse(text);
        
        // Hydrate with IDs
        json.shots = json.shots.map((s: any, i: number) => ({
            ...s,
            id: `shot-${Date.now()}-${i}`,
            status: 'PENDING'
        }));

        return json as DirectorPlan;
    } catch (e) {
        console.error("Director Plan Gen Error", e);
        throw new Error("Failed to generate campaign plan.");
    }
};
