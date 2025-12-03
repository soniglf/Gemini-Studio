
import { ModelAttributes, StudioSettings, InfluencerSettings, MotionSettings, Lighting, ShotType, TimeOfDay, Vibe, ModelMorphology } from '../types';

export const DEFAULT_MORPHOLOGY: ModelMorphology = {
    height: 50, // 170cm / 5'7"
    bodyFat: 20, // Athletic/Lean
    muscleMass: 30, // Toned
    boneStructure: 50, // Medium frame
    
    // NEW: Body Proportions
    shoulderWidth: 50,
    legLength: 50,
    neckThickness: 50,

    bustChest: 50,
    hipsWaistRatio: 50,
    
    faceShape: 'OVAL',
    foreheadHeight: 50,
    jawlineDefinition: 50,
    chinProminence: 50,
    cheekboneHeight: 50,
    
    // Ocular
    eyeSize: 50,
    eyeSpacing: 50,
    eyeTilt: 50,
    eyebrowArch: 50,

    noseStructure: 50,
    lipFullness: 50,
    
    // Dermatology & Aging
    skinTexture: 70, // Realistic pores
    skinSheen: 50,   // Natural moisture
    imperfections: 30, // Natural asymmetry
    freckleDensity: 0, 
    aging: 24,
    grayScale: 0,
    vascularity: 10,
    redness: 20,
    pores: 50
};

export const DEFAULT_MODEL: ModelAttributes = {
  id: "default",
  version: 4, // Bump version
  name: "New Model",
  gender: "FEMALE",
  age: 24,
  ethnicity: "Latina",
  morphology: DEFAULT_MORPHOLOGY,
  
  hairStyle: "Long wavy",
  hairColor: "Brunette",
  hairTexture: "Wavy", // New
  eyebrowStyle: "Natural", // New
  
  eyeColor: "Hazel",
  clothingStyle: "Minimalist",
  
  glasses: "None",
  facialHair: "None",
  visualVibe: "Neutral",
  
  distinctiveFeatures: "",
  
  skinTone: "Tan",
  makeupStyle: "Natural Glow",

  referenceImage: null,
  referenceImages: [], 
  accessoriesImage: null,
  strictness: 65
};

export const INITIAL_PRO_SETTINGS = { 
    cameraModel: "", lensFocalLength: "", aperture: "", iso: "", shutterSpeed: "", 
    lightingSetup: "", colorGrading: "", resolution: "1K",
    seed: undefined, customNegative: "" 
};

export const INITIAL_STUDIO: StudioSettings = { ...INITIAL_PRO_SETTINGS, background: "Studio White", backgroundColor: "#FFFFFF", shotType: ShotType.WAIST, productDescription: "", outfitImage: null, productImage: null, propPriority: false, batchSize: 1, isHighFashion: false, poseStyle: "Power Stance", editorialVibe: "Vogue", lighting: Lighting.SOFTBOX, useMagicPrompt: true, aspectRatio: "3:4", selectedLocationPreview: null };
export const INITIAL_INFLUENCER: InfluencerSettings = { ...INITIAL_PRO_SETTINGS, action: "Walking", location: "Paris", timeOfDay: TimeOfDay.GOLDEN, cameraAngle: "Eye Level", clothingOverride: "", outfitImage: null, companions: "", vibe: Vibe.NATURAL, aspectRatio: "4:5", useMagicPrompt: true, selectedLocationPreview: null };
export const INITIAL_MOTION: MotionSettings = { ...INITIAL_INFLUENCER, fps: "24fps", shutterAngle: "180", stabilization: "Gimbal", cameraType: "", lensType: "", filmStock: "", movement: "", customPrompt: "", resolution: "720p", sourceImage: null };
