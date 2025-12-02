

export enum AppMode {
  CREATOR = 'CREATOR',
  STUDIO = 'STUDIO',
  INFLUENCER = 'INFLUENCER',
  MOTION = 'MOTION',
  LIVE = 'LIVE',
  GALLERY = 'GALLERY',
  BILLING = 'BILLING',
  DIRECTOR = 'DIRECTOR'
}

export enum GenerationTier {
  SKETCH = 'SKETCH',
  RENDER = 'RENDER'
}

export type Language = 'EN' | 'ES';

export enum Gender { MALE = 'MALE', FEMALE = 'FEMALE' }
export enum Lighting { SOFTBOX = "Softbox", REMBRANDT = "Rembrandt", NEON = "Neon Cyberpunk", WINDOW = "Natural Window", FLASH = "Hard Flash", GOLDEN = "Golden Hour" }
export enum ShotType { CLOSE_UP = "Extreme Close-up", HEADSHOT = "Headshot", WAIST = "Waist Up", FULL = "Full Body", LOW_ANGLE = "Low Angle" }
export enum TimeOfDay { DAWN = "Dawn", NOON = "Noon", GOLDEN = "Golden Hour", BLUE = "Blue Hour", CITY = "City Lights" }
export enum Vibe { NATURAL = "Natural", CINEMATIC = "Cinematic", CYBERPUNK = "Cyberpunk", VINTAGE = "Vintage 90s", PORTRA = "Kodak Portra", MOODY = "Moody" }

export interface UsageStats {
  freeImages: number;
  paidImages: number;
  freeVideos: number;
  paidVideos: number;
  estimatedCost: number;
  totalTokens: number;
  storageUsage?: number; // Bytes
  storageQuota?: number; // Bytes
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  customInstructions?: string; // Brand Bible / Context
  budget?: number; // CFO's Firewall: Max spend in USD
  createdAt: number;
}

export interface Collection {
    id: string;
    projectId: string;
    name: string;
    createdAt: number;
    icon?: string;
}

export interface ModelMorphology {
    // Body (0-100)
    height: number;
    weight: number;
    muscle: number;
    curves: number;
    chest: number;
    
    // Face (0-100)
    faceWidth: number;
    jawLine: number;
    cheekbones: number;
    eyeSize: number;
    noseSize: number;
    lipFullness: number;
}

export interface ModelAttributes {
  id: string;
  version: number;
  name: string;
  gender: 'MALE' | 'FEMALE';
  age: number;
  ethnicity: string;
  
  // Legacy string fallbacks (can be derived from morphology in prompt builder)
  bodyType: string;
  faceShape: string;
  
  // Detailed Morphology
  morphology: ModelMorphology;

  skinTone: string;
  eyeShape: string;
  eyebrows: string;
  noseShape: string;
  lipShape: string;
  makeupStyle: string;
  
  // Hair
  hairStyle: string;
  hairColor: string;
  
  eyeColor: string;
  clothingStyle: string;
  distinctiveFeatures: string;
  facialPiercings: string;
  
  referenceImage: string | null; // Primary/Thumbnail
  referenceImages: string[]; // Reference Bank (Up to 8)
  accessoriesImage: string | null;
  strictness: number;
}

export interface ProPhotoSettings {
  cameraModel: string;
  lensFocalLength: string;
  aperture: string;
  iso: string;
  shutterSpeed: string;
  lightingSetup: string;
  colorGrading: string;
  resolution: string;
  seed?: number; // God Mode: RNG Control
  customNegative?: string; // God Mode: Override safety rails
}

export interface StudioSettings extends ProPhotoSettings {
  background: string;
  backgroundColor: string;
  shotType: string;
  aspectRatio: string;
  productDescription: string;
  outfitImage: string | null;
  productImage: string | null;
  propPriority: boolean;
  batchSize: number;
  useMagicPrompt: boolean;
  isHighFashion: boolean;
  poseStyle: string;
  editorialVibe: string;
  selectedLocationPreview: string | null;
  lighting: string;
}

export interface InfluencerSettings extends ProPhotoSettings {
  action: string;
  location: string;
  timeOfDay: string;
  cameraAngle: string;
  clothingOverride: string;
  outfitImage: string | null;
  companions: string;
  vibe: string;
  aspectRatio: string;
  useMagicPrompt: boolean;
  selectedLocationPreview: string | null;
}

export interface MotionSettings extends InfluencerSettings {
    fps: string;
    shutterAngle: string;
    stabilization: string;
    cameraType: string;
    lensType: string;
    filmStock: string;
    movement: string;
    customPrompt: string;
    sourceImage: string | null; // Added for Image-to-Video
}

export interface GeneratedAsset {
  id: string;
  projectId: string;
  collectionId?: string; // Studio Rack ID
  sessionId?: string; // Batch Grouping ID
  url: string;     
  blob?: Blob;     
  type: 'IMAGE' | 'VIDEO';
  prompt: string;
  timestamp: number;
  mode: AppMode;
  isMagic: boolean;
  modelId: string;
  usedModel: string;
  keyType: 'FREE' | 'PAID';
  tier: GenerationTier;
  cost: number;
  settings?: StudioSettings | InfluencerSettings | MotionSettings;
  tags?: string[]; // Taxonomy
  isCompressed?: boolean; // Smart Archival Flag
}

export interface GenerationResult {
    url: string;
    blob: Blob;
    finalPrompt: string;
    usedModel: string;
    keyType: 'FREE' | 'PAID';
    tier: GenerationTier;
    tags?: string[];
    sessionId?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface DirectorShot {
    id: string;
    type: 'STUDIO' | 'INFLUENCER';
    description: string;
    visualDetails: string;
    status: 'PENDING' | 'GENERATING' | 'DONE' | 'FAILED';
    resultAssetId?: string;
    feedback?: string; // Critique for regeneration
}

export interface DirectorPlan {
    campaignName: string;
    modelBrief: Partial<ModelAttributes> & { vibe?: string };
    shots: DirectorShot[];
}

export interface AuditReport {
    score: number;
    analysis: string;
    missingShots: string[];
    consistencyCheck: string;
}

export interface StorageStats {
    usage: number;
    quota: number;
}

export interface Preset {
    id: string;
    name: string;
    mode: 'STUDIO' | 'INFLUENCER' | 'MOTION';
    settings: Partial<StudioSettings | InfluencerSettings | MotionSettings>;
}

export interface ProjectExport {
    version: number;
    project: Project;
    models: ModelAttributes[];
    assets: (Omit<GeneratedAsset, 'blob' | 'url'> & { blobData: string | null })[];
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}