
import { MODELS } from "../config";
import { getClient } from "../config";
import { AuditReport, Project } from "../../../types";

export class AuditAgent {
    static async auditCampaign(project: Project, taxonomyTags: string[]): Promise<AuditReport> {
        const ai = getClient(false); // Use Paid Key for High IQ Analysis
        
        const uniqueTags = Array.from(new Set(taxonomyTags)).join(", ");
        const context = project.customInstructions || "No specific brand guidelines provided.";

        const prompt = `
        ROLE: Expert Creative Director & Brand Strategist.
        TASK: Audit the current campaign assets against the Brand Bible and Standard Industry Practices.
        
        CAMPAIGN CONTEXT (Brand Bible):
        "${context}"
        
        EXISTING ASSETS (Taxonomy Tags):
        [${uniqueTags}]
        
        INSTRUCTIONS:
        1. Analyze consistency: Do the tags match the Brand Bible?
        2. Identify Gaps: What essential shots are missing? (e.g. "We have close-ups but no wide shots", "Missing product detail shots").
        3. Score: Rate the campaign completeness (0-100).
        
        OUTPUT JSON:
        {
            "score": number,
            "analysis": "Brief qualitative analysis...",
            "consistencyCheck": "Pass/Fail/Warn - explanation...",
            "missingShots": ["Shot description 1", "Shot description 2", "Shot description 3"]
        }
        `;

        try {
            const response = await ai.models.generateContent({
                model: MODELS.TEXT,
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const text = response.text || "{}";
            return JSON.parse(text) as AuditReport;
        } catch (e) {
            console.error("Audit Failed", e);
            throw new Error("Failed to audit campaign.");
        }
    }
}
