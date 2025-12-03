
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

export const OPTIONS = {
    ethnicity: ["Latina", "Caucasian", "East Asian", "South Asian", "African American", "Middle Eastern", "Nordic", "Mixed", "Slavic", "Pacific Islander"],
    faceShape: ["OVAL", "SQUARE", "HEART", "DIAMOND", "ROUND"],
    lighting: Object.values(Lighting),
    shotType: Object.values(ShotType),
    timeOfDay: Object.values(TimeOfDay),
    vibe: Object.values(Vibe),
    skinTone: ["Porcelain", "Fair", "Tan", "Olive", "Brown", "Dark Brown", "Deep Ebony", "Albino", "Vitiligo"],
    eyeShape: ["Almond", "Round", "Hooded", "Monolid", "Downturned"],
    noseShape: ["Straight", "Button", "Roman", "Upturned", "Nubian", "Hawk"],
    lipShape: ["Full", "Thin", "Bow-shaped", "Heavy Lower", "Heavy Upper"],
    makeup: ["No Makeup", "Natural Glow", "Soft Glam", "Heavy Glam", "Goth", "Avant Garde"],
    
    hairStyle: ["Long wavy", "Bob cut", "Pixie", "Straight", "Braids", "Ponytail", "Messy Bun", "Fade", "Buzz Cut", "Man Bun", "Side Part", "Bald", "Mullet"],
    hairColor: ["Brunette", "Blonde", "Platinum", "Redhead", "Black", "Pink Pastel", "Silver", "Grey", "Blue", "Green"],
    
    // NEW: Granular Styling
    hairTexture: ["Straight (Type 1)", "Wavy (Type 2)", "Curly (Type 3)", "Coily (Type 4)", "Afro-Textured"],
    eyebrowStyle: ["Natural", "Thick/Bushy", "Thin/90s", "Straight/K-Pop", "Arched", "Bleached", "Unibrow"],
    
    clothingStyle: ["Minimalist", "Streetwear", "Business Chic", "Bohemian", "High Fashion", "Cyberpunk", "Vintage", "Sporty", "Gothic", "Preppy"],
    cameraModel: ["Sony A7R V", "Canon R5", "Leica SL2", "Fujifilm GFX 100", "Hasselblad H6D"],
    lensFocal: ["16mm", "24mm", "35mm", "50mm", "85mm", "105mm", "200mm"],
    aperture: ["f/1.2", "f/1.4", "f/1.8", "f/2.8", "f/4.0", "f/5.6", "f/8.0", "f/11"],
    iso: ["50", "100", "200", "400", "800", "1600", "3200", "Grainy 6400"],
    shutterSpeed: ["1/8000", "1/4000", "1/1000", "1/250", "1/60", "1/30", "Long Exposure"],
    lightingSetup: ["Three-Point", "Butterfly", "Split", "Rembrandt", "Loop", "Broad", "Short"],
    colorGrading: ["Teal & Orange", "Bleach Bypass", "Vintage Sepia", "Black & White High Contrast"],
    fps: ["24fps", "30fps", "60fps (Slow-mo)", "120fps"],
    shutterAngle: ["180 deg", "90 deg (Skinny)", "360 deg (Dreamy)"],
    stabilization: ["Gimbal", "Handheld", "Tripod", "EasyRig"],
    resolutionVideo: ["720p", "1080p"],
    resolutionImage: ["1K", "2K"],
    voices: ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"],
    
    // NEW ATTRIBUTES - EXPANDED
    glasses: ["None", "Standard Glasses", "Reading Glasses", "Thick Rimmed", "Wire Frame", "Rimless", "Sunglasses", "Aviators", "Cat Eye", "Round", "Square", "Rectangle Glasses", "Round Glasses"],
    facialHair: ["None", "Clean Shaven", "Stubble", "Full Beard", "Goatee", "Mustache", "Chinstrap", "Mutton Chops"],
    visualVibe: ["Neutral", "Corporate", "Casual", "Edgy", "Vintage", "Minimalist", "Bohemian", "Sporty", "Gothic", "Preppy", "Streetwear", "Ethereal", "Gritty"]
};

export const MUSE_ARCHETYPES = [
    { label: "Cyberpunk", prompt: "A futuristic hacker with neon accents, tech-wear, and chrome implants." },
    { label: "Noir", prompt: "A mysterious detective in a 1940s trench coat, moody lighting, shadows." },
    { label: "Ethereal", prompt: "A glowing, angelic figure with porcelain skin and flowing silk robes." },
    { label: "Streetwear", prompt: "A hypebeast fashion icon in Tokyo, wearing oversized layers and sneakers." },
    { label: "Vintage", prompt: "A 70s bohemian artist with bell-bottoms, floral prints, and film grain." },
    { label: "High Fashion", prompt: "An avant-garde editorial model with sharp features and architectural clothing." },
    { label: "Athlete", prompt: "A peak performance sprinter with sweat, athletic gear, and intense focus." }
];

export const MUTATION_TRAITS = [
    { label: "Cybernetic", prompt: "with noticeable chrome cybernetic implants and glowing circuitry lines on skin" },
    { label: "Vampiric", prompt: "with pale translucent skin, sunken dark eyes, and an aura of ancient elegance" },
    { label: "Battle-Worn", prompt: "with grit, sweat, minor scars, and a look of intense determination" },
    { label: "Royal", prompt: "exuding aristocracy, wearing subtle jewelry, perfect posture, and a haughty expression" },
    { label: "Ethereal", prompt: "glowing with a soft inner light, pearlescent skin texture, and wind-blown hair" },
    { label: "Noir", prompt: "shrouded in shadow, high contrast lighting, smoking a cigarette, 1940s detective vibe" },
    { label: "Neon", prompt: "bathed in pink and blue neon lighting, wet skin, futuristic club atmosphere" },
    { label: "Zombie", prompt: "undead, decaying skin texture, clouded eyes, pale veins" }
];

// --- HELPER: Height Conversion ---
export const formatHeight = (val: number): string => {
    // Map 0-100 to 150cm - 200cm
    const cm = Math.round(150 + (val / 100) * 50);
    const feet = Math.floor(cm / 30.48);
    const inches = Math.round((cm % 30.48) / 2.54);
    return `${cm}cm / ${feet}'${inches}"`;
};

// --- HELPER: Full Body & Style Presets ---
type FullPreset = Omit<Partial<ModelAttributes>, 'morphology'> & { morphology: Partial<ModelMorphology> } & { museDescription?: string };

export const FULL_PRESETS_FEMALE: Record<string, FullPreset> = {
    "Runway Model": { 
        ethnicity: "Mixed", age: 21, hairStyle: "Straight", hairColor: "Brunette",
        morphology: { height: 85, bodyFat: 15, muscleMass: 25, boneStructure: 30, bustChest: 30, hipsWaistRatio: 40, faceShape: 'DIAMOND', cheekboneHeight: 80, legLength: 85, shoulderWidth: 40, neckThickness: 30 },
        museDescription: "A statuesque runway model with sharp, diamond-shaped features, towering height, and an ethereal, high-fashion gaze."
    },
    "Fitness Icon": { 
        ethnicity: "Latina", age: 26, hairStyle: "Ponytail", hairColor: "Black",
        morphology: { height: 60, bodyFat: 12, muscleMass: 70, boneStructure: 60, bustChest: 50, hipsWaistRatio: 70, faceShape: 'SQUARE', jawlineDefinition: 70, shoulderWidth: 60, vascularity: 40 },
        museDescription: "A peak-performance fitness influencer with defined abs, athletic build, glowing tan skin, and a high ponytail."
    },
    "Editorial Plus": { 
        ethnicity: "African American", age: 24, hairStyle: "Bald", hairColor: "Black",
        morphology: { height: 60, bodyFat: 75, muscleMass: 40, boneStructure: 70, bustChest: 80, hipsWaistRatio: 80, faceShape: 'ROUND', lipFullness: 80, cheekboneHeight: 70 },
        museDescription: "A striking plus-size editorial model with bold features, smooth dark skin, shaved head, and confident curves."
    },
    "Girl Next Door": { 
        ethnicity: "Caucasian", age: 22, hairStyle: "Messy Bun", hairColor: "Blonde",
        morphology: { height: 50, bodyFat: 40, muscleMass: 30, boneStructure: 50, bustChest: 50, hipsWaistRatio: 50, faceShape: 'HEART', noseStructure: 20, freckleDensity: 60 },
        museDescription: "A natural beauty with a friendly face, messy blonde bun, soft features, and freckles."
    },
    "Petite & Curvy": { 
        ethnicity: "East Asian", age: 23, hairStyle: "Bob cut", hairColor: "Pink Pastel",
        morphology: { height: 20, bodyFat: 30, muscleMass: 30, boneStructure: 30, bustChest: 70, hipsWaistRatio: 75, faceShape: 'OVAL', eyeSize: 70, legLength: 30 },
        museDescription: "A petite fashionista with a curvy hourglass figure, pastel pink bob cut, and large expressive eyes."
    },
};

export const FULL_PRESETS_MALE: Record<string, FullPreset> = {
    "Runway Male": { 
        ethnicity: "Nordic", age: 22, hairStyle: "Side Part", hairColor: "Blonde",
        morphology: { height: 90, bodyFat: 10, muscleMass: 40, boneStructure: 60, bustChest: 40, hipsWaistRatio: 80, faceShape: 'DIAMOND', jawlineDefinition: 90, shoulderWidth: 70 },
        museDescription: "A sharp-jawed Nordic male model with piercing eyes, tall lean frame, and platinum blonde hair."
    },
    "Bodybuilder": { 
        ethnicity: "African American", age: 30, hairStyle: "Bald", hairColor: "Black",
        morphology: { height: 55, bodyFat: 5, muscleMass: 95, boneStructure: 90, bustChest: 90, hipsWaistRatio: 90, faceShape: 'SQUARE', vascularity: 80, neckThickness: 90, shoulderWidth: 95 },
        museDescription: "A massive professional bodybuilder with hyper-defined muscles, vascularity, and an intimidating presence."
    },
    "Lean Swimmer": { 
        ethnicity: "Mixed", age: 24, hairStyle: "Messy Bun", hairColor: "Brunette",
        morphology: { height: 80, bodyFat: 12, muscleMass: 60, boneStructure: 70, bustChest: 60, hipsWaistRatio: 85, faceShape: 'OVAL', cheekboneHeight: 70, shoulderWidth: 80 },
        museDescription: "A lean and toned swimmer with broad shoulders, sun-kissed skin, and wet messy hair."
    },
    "Dad Bod": { 
        ethnicity: "Caucasian", age: 40, hairStyle: "Side Part", hairColor: "Grey",
        morphology: { height: 50, bodyFat: 60, muscleMass: 40, boneStructure: 60, bustChest: 50, hipsWaistRatio: 40, faceShape: 'ROUND', jawlineDefinition: 30, grayScale: 50 },
        museDescription: "A rugged middle-aged man with a comfortable build, salt-and-pepper hair, and a friendly, approachable vibe."
    },
    "Streetwear Icon": { 
        ethnicity: "East Asian", age: 20, hairStyle: "Mullet", hairColor: "Bleached",
        morphology: { height: 65, bodyFat: 20, muscleMass: 40, boneStructure: 50, bustChest: 40, hipsWaistRatio: 60, faceShape: 'HEART', noseStructure: 40, eyeTilt: 70 },
        museDescription: "A trendy streetwear icon with a bleached mullet, sharp facial features, and a cool, detached expression."
    },
};

export const SLIDER_LABELS: Record<string, [string, string]> = {
    height: ["Short", "Tall"],
    bodyFat: ["Shredded", "Soft"],
    muscleMass: ["Lean", "Voluminous"],
    boneStructure: ["Petite", "Broad"],
    shoulderWidth: ["Narrow", "Broad"],
    legLength: ["Short Legs", "Long Legs"],
    neckThickness: ["Thin", "Thick"],
    
    // Dimorphic (Defaults)
    bustChest: ["Flat", "Large"], 
    hipsWaistRatio: ["Straight", "Curvy"], 
    
    // Cranial
    jawlineDefinition: ["Soft", "Sharp"],
    chinProminence: ["Recessed", "Jutting"],
    foreheadHeight: ["Low", "High"],
    cheekboneHeight: ["Low", "High"],
    
    // Eyes
    eyeSize: ["Narrow", "Doe"],
    eyeSpacing: ["Close-Set", "Wide-Set"],
    eyeTilt: ["Downturned", "Cat-Eye"],
    eyebrowArch: ["Flat", "Arched"],
    
    noseStructure: ["Button", "Aquiline"],
    lipFullness: ["Thin", "Full"],
    
    // Dermatology
    skinTexture: ["Airbrushed", "Raw"],
    skinSheen: ["Matte", "Dewy"],
    imperfections: ["Perfect", "Character"],
    freckleDensity: ["Clear", "Freckled"],
    aging: ["Youth", "Mature"],
    grayScale: ["Pigmented", "Gray/White"],
    vascularity: ["Smooth", "Veiny"],
    redness: ["Pale", "Flushed"],
    pores: ["Smooth", "Porous"]
};

// Gender Specific Overrides
export const GENDER_CONFIG = {
    MALE: {
        bustChest: { label: "Chest Breadth", minLabel: "Flat", maxLabel: "Barrel" },
        hipsWaistRatio: { label: "Torso V-Taper", minLabel: "Blocky", maxLabel: "V-Shape" },
        muscleMass: { label: "Musculature", minLabel: "Slight", maxLabel: "Mass Monster" }
    },
    FEMALE: {
        bustChest: { label: "Bust Size", minLabel: "Petite", maxLabel: "Voluptuous" },
        hipsWaistRatio: { label: "Hourglass Curve", minLabel: "Straight", maxLabel: "Curvy" },
        muscleMass: { label: "Muscle Tone", minLabel: "Soft", maxLabel: "Amazonian" }
    }
};
