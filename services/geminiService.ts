import { GenerationService } from "./ai/generationService";

// This service is now a clean facade for the unified GenerationService.
export const {
    // Core Generation
    generate,
    preparePayload,
    // High-Level AI Tasks
    synthesizeProfile,
    generateDirectorPlan,
    generateRandomPersona,
    enhanceDescription,
    injectTrait,
    generateProceduralBrief,
    mapShotToSettings,
    // Utility Tasks
    edit,
    refine,
    audit,
    refineSettings,
    analyze,
} = GenerationService;

export { generateLocationPreviews } from "./ai/execution";
