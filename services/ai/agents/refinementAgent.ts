
import { getClient, MODELS } from "../config";

export class RefinementAgent {
    static async refineSettings(currentSettings: any, instruction: string, mode: string): Promise<any> {
        const ai = getClient(true); // Can use free pool for logic
        
        const prompt = `
        ROLE: Expert Technical Assistant for a Generative AI Studio.
        TASK: Update the JSON configuration object based on the user's natural language instruction.
        
        CONTEXT:
        App Mode: ${mode}
        Current Settings JSON:
        ${JSON.stringify(currentSettings, null, 2)}
        
        USER INSTRUCTION: "${instruction}"
        
        RULES:
        1. Only modify fields relevant to the instruction.
        2. Keep all other fields exactly as they are (unless they conflict).
        3. If the instruction implies a specific lighting, camera, or vibe, update those fields using standard photography terms.
        4. Return ONLY the valid JSON object. No markdown, no explanations.
        `;

        try {
            const response = await ai.models.generateContent({
                model: MODELS.TEXT,
                contents: prompt,
                config: {
                    responseMimeType: "application/json"
                }
            });

            const text = response.text || "{}";
            return JSON.parse(text);
        } catch (e) {
            console.error("Refinement Agent Failed", e);
            throw new Error("Failed to interpret refinement instruction.");
        }
    }
}
