
export enum AppMode {
  CREATOR = 'CREATOR',
  STUDIO = 'STUDIO',
  INFLUENCER = 'INFLUENCER',
  MOTION = 'MOTION',
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

export enum ShotType { 
  EXTREME_CLOSE_UP = "Extreme Close-Up", 
  CLOSE_UP = "Close-Up", 
  MEDIUM_CLOSE_UP = "Medium Close-Up", 
  MEDIUM_SHOT = "Medium Shot", 
  COWBOY_SHOT = "Cowboy Shot", 
  FULL_BODY = "Full Body", 
  WIDE_SHOT = "Wide Shot", 
  LOW_ANGLE = "Low Angle", 
  HIGH_ANGLE = "High Angle", 
  OVERHEAD = "Overhead" 
}

export enum TimeOfDay { DAWN = "Dawn", NOON = "Noon", GOLDEN = "Golden Hour", BLUE = "Blue Hour", CITY = "City Lights" }
export enum Vibe { NATURAL = "Natural", CINEMATIC = "Cinematic", CYBERPUNK = "Cyberpunk", VINTAGE = "Vintage 90s", PORTRA = "Kodak Portra", MOODY = "Moody" }

export interface UsageStats {
  freeImages: number;
  paidImages: number;
  freeVideos: number;
  paidVideos: number;
  estimatedCost: number;
  totalTokens: number;
  storageUsage: number;
  storageQuota: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  customInstructions?: string;
  budget?: number;
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
    height: number;
    bodyFat: number;
    muscleMass: number;
    boneStructure: number;
    shoulderWidth: number;
    legLength: number;
    neckThickness: number;
    bustChest: number;
    hipsWaistRatio: number;
    faceShape: 'OVAL' | 'SQUARE' | 'HEART' | 'DIAMOND' | 'ROUND';
    foreheadHeight: number;
    jawlineDefinition: number;
    chinProminence: number;
    cheekboneHeight: number;
    eyeSize: number;
    eyeSpacing: number;
    eyeTilt: number;
    eyebrowArch: number;
    noseStructure: number;
    lipFullness: number;
    skinTexture: number;
    skinSheen: number;
    imperfections: number;
    freckleDensity: number;
    aging: number;
    grayScale: number;
    vascularity: number;
    redness: number;
    pores: number;
}

export interface ModelAttributes {
  id: string;
  version: number;
  name: string;
  gender: 'MALE' | 'FEMALE';
  age: number;
  ethnicity: string;
  morphology: ModelMorphology;
  skinTone: string;
  eyeColor: string;
  hairStyle: string;
  hairColor: string;
  hairTexture: string;
  eyebrowStyle: string;
  makeupStyle: string;
  clothingStyle: string;
  glasses: string;
  facialHair: string;
  visualVibe: string;
  distinctiveFeatures: string;
  referenceImage: string | null;
  referenceImages: string[];
  accessoriesImage: string | null;
  strictness: number;
  syntheticDNA?: string;
  bodyType?: string;
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
  seed?: number;
  customNegative?: string;
}

export interface StudioSettings extends ProPhotoSettings {
  background: string;
  setDesign: string;
  props: string;
  backgroundColor: string;
  studioVibe: string;
  interactionPreset: string;
  shotType: string;
  aspectRatio: string;
  productDescription: string;
  outfitImage: string | null;
  productImage: string | null;
  propPriority: boolean;
  focusPriority: 'FACE' | 'OUTFIT' | 'PRODUCT';
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
  shotFocus: string;
  prop: string;
  batchSize: number;
  socialContext: string;
  candidness: number;
  livedIn: boolean;
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
    sourceImage: string | null;
}

export interface GeneratedAsset {
  id: string;
  projectId: string;
  collectionId?: string;
  sessionId?: string;
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
  settings?: StudioSettings | InfluencerSettings | MotionSettings | {};
  tags?: string[];
  isCompressed?: boolean;
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
    feedback?: string;
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

export interface Preset {
    id: string;
    name: string;
    mode: 'STUDIO' | 'INFLUENCER' | 'MOTION';
    settings: Partial<StudioSettings | InfluencerSettings | MotionSettings>;
}

// --- SYNAPSE II NODE TYPES ---

export enum NodeType {
    ASSET = 'ASSET',
    MODIFIER = 'MODIFIER',
    PENDING = 'PENDING'
}

export enum ModifierType {
    CLOTHING = 'CLOTHING',
    STYLE = 'STYLE',
    POSE = 'POSE'
}

export interface ModifierData {
    prompt: string;
    referenceImage: string | null;
}

export interface CanvasItemState {
    id: string;
    nodeType: NodeType;
    assetId?: string; // For ASSET type
    
    // Grid Physics
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    rotation?: number;

    // Modifier Logic
    modifierType?: ModifierType;
    modifierData?: ModifierData;
}

export interface CanvasView {
    x: number;
    y: number;
    scale: number;
}

export interface CanvasLink {
    id: string;
    fromId: string;
    toId: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
