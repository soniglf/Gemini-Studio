

import { ImageAgent } from "./ai/agents/imageAgent";
import { VideoAgent } from "./ai/agents/videoAgent";
import { EditAgent } from "./ai/agents/editAgent";
import { AuditAgent } from "./ai/agents/auditAgent";
import { RefinementAgent } from "./ai/agents/refinementAgent";
import { AnalysisAgent } from "./ai/agents/analysisAgent";

export { generateLocationPreviews } from "./ai/execution";

// FACADE EXPORTS
export const generateStudioImage = ImageAgent.generateStudio;
export const generateInfluencerImage = ImageAgent.generateInfluencer;
export const generateVideo = VideoAgent.generate;
export const editImage = EditAgent.edit;
export const refineImage = EditAgent.refine;
export const auditCampaign = AuditAgent.auditCampaign;
export const refineSettings = RefinementAgent.refineSettings;
export const analyzeReferences = AnalysisAgent.analyzeReferenceImages;

// EXPOSE BUILDERS FOR GLASS BOX INTERCEPTOR
export const buildStudioPrompt = ImageAgent.buildStudioPrompt;
export const buildInfluencerPrompt = ImageAgent.buildInfluencerPrompt;
export const buildVideoPrompt = VideoAgent.buildVideoPrompt;