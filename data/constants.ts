

import { ModelAttributes, StudioSettings, InfluencerSettings, MotionSettings, Lighting, ShotType, TimeOfDay, Vibe } from '../types';

export const DEFAULT_MORPHOLOGY = {
    height: 175, // cm
    weight: 60,  // kg
    muscle: 25,  // % (Lean definition)
    curves: 40,  // % (Natural)
    chest: 40,   // %
    faceWidth: 50,
    jawLine: 40,
    cheekbones: 40,
    eyeSize: 50,
    noseSize: 40,
    lipFullness: 40
};

export const DEFAULT_MODEL: ModelAttributes = {
  id: "default",
  version: 2, 
  name: "New Model",
  gender: "FEMALE",
  age: 24,
  ethnicity: "Latina",
  morphology: DEFAULT_MORPHOLOGY,
  
  // Legacy fields kept for compatibility or generated description fallback
  bodyType: "Fit",
  faceShape: "Oval",
  
  hairStyle: "Long wavy",
  hairColor: "Brunette",
  eyeColor: "Hazel",
  clothingStyle: "Streetwear",
  distinctiveFeatures: "",
  facialPiercings: "",
  
  skinTone: "Tan",
  eyeShape: "Almond",
  eyebrows: "Natural",
  noseShape: "Straight",
  lipShape: "Full",
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

export const PRESET_MODELS: any = {
    FEMALE: {
        CYBER: {
            description: "Futuristic, neon-lit aesthetic.",
            data: { 
                name: "Neon", gender: "FEMALE", ethnicity: "East Asian", 
                hairColor: "Silver/Blue Ombre", hairStyle: "Sharp Bob", 
                clothingStyle: "Techwear/Cyberpunk", makeupStyle: "Graphic Liner", 
                morphology: { ...DEFAULT_MORPHOLOGY, height: 170, weight: 55, muscle: 40, cheekbones: 80, jawLine: 70 } 
            }
        },
        EDITORIAL: {
            description: "High-fashion Vogue style.",
            data: { 
                name: "Lux", gender: "FEMALE", ethnicity: "Nordic", 
                hairColor: "Platinum Blonde", hairStyle: "Sleek Bun", 
                clothingStyle: "High Fashion Avant-Garde", makeupStyle: "Clean Girl", 
                morphology: { ...DEFAULT_MORPHOLOGY, height: 180, weight: 52, muscle: 20, cheekbones: 90, jawLine: 80, noseSize: 20 } 
            }
        },
        INFLUENCER: {
            description: "Modern Instagram Baddie aesthetic.",
            data: { 
                name: "Kylie", gender: "FEMALE", ethnicity: "Latina", 
                hairColor: "Brunette", hairStyle: "Long wavy", 
                clothingStyle: "Streetwear/Luxury", makeupStyle: "Heavy Glam", 
                morphology: { ...DEFAULT_MORPHOLOGY, height: 165, weight: 65, curves: 90, lipFullness: 90, chest: 70 }
            }
        },
        RETRO: {
            description: "Classic 50s Hollywood glamour.",
            data: { 
                name: "Marilyn", gender: "FEMALE", ethnicity: "Caucasian", 
                hairColor: "Platinum", hairStyle: "Short Waves", 
                clothingStyle: "Vintage", makeupStyle: "Red Lip Classic", 
                morphology: { ...DEFAULT_MORPHOLOGY, height: 168, weight: 58, curves: 80, eyeSize: 70 }
            }
        }
    },
    MALE: {
        EXECUTIVE: {
            description: "Sharp corporate look.",
            data: { 
                name: "James", gender: "MALE", ethnicity: "Caucasian", age: 35, 
                hairColor: "Dark Brown", hairStyle: "Side Part", 
                clothingStyle: "Business Suit", 
                morphology: { ...DEFAULT_MORPHOLOGY, height: 185, weight: 80, muscle: 50, jawLine: 90 }
            }
        },
        STREETWEAR: {
            description: "Modern hypebeast aesthetic.",
            data: { 
                name: "Kai", gender: "MALE", ethnicity: "East Asian", age: 22, 
                hairColor: "Black", hairStyle: "Messy Texture", 
                clothingStyle: "Oversized Streetwear", 
                morphology: { ...DEFAULT_MORPHOLOGY, height: 175, weight: 65, muscle: 30 }
            }
        },
        ATHLETE: {
            description: "Peak physical fitness.",
            data: { 
                name: "Marcus", gender: "MALE", ethnicity: "African American", age: 26, 
                hairColor: "Black", hairStyle: "Fade", 
                clothingStyle: "Sportswear", 
                morphology: { ...DEFAULT_MORPHOLOGY, height: 190, weight: 95, muscle: 95, jawLine: 80 }
            }
        },
        RUGGED: {
            description: "Outdoorsy, bearded look.",
            data: { 
                name: "Jack", gender: "MALE", ethnicity: "Caucasian", age: 32, 
                hairColor: "Brown", hairStyle: "Man Bun", 
                clothingStyle: "Flannel/Workwear", distinctiveFeatures: "Beard", 
                morphology: { ...DEFAULT_MORPHOLOGY, height: 182, weight: 85, muscle: 70, chest: 70 }
            }
        }
    }
};

export const OPTIONS = {
    ethnicity: ["Latina", "Caucasian", "East Asian", "South Asian", "African American", "Middle Eastern", "Nordic", "Mixed"],
    physique: ["Slim Model", "Athletic", "Curvy", "Plus Size", "Petite", "Hourglass", "Muscular", "Dad Bod"],
    lighting: Object.values(Lighting),
    shotType: Object.values(ShotType),
    timeOfDay: Object.values(TimeOfDay),
    vibe: Object.values(Vibe),
    faceShape: ["Oval", "Square", "Heart", "Diamond", "Round", "Long"],
    skinTone: ["Porcelain", "Fair", "Tan", "Olive", "Brown", "Dark Brown", "Deep Ebony"],
    eyeShape: ["Almond", "Round", "Hooded", "Monolid", "Downturned"],
    noseShape: ["Straight", "Button", "Roman", "Upturned", "Nubian", "Hawk"],
    lipShape: ["Full", "Thin", "Bow-shaped", "Heavy Lower", "Heavy Upper"],
    makeup: ["No Makeup", "Natural Glow", "Soft Glam", "Heavy Glam", "Goth", "Avant Garde"],
    cheekbones: ["High", "Defined", "Round", "Soft", "Hollow"],
    jawline: ["Sharp", "Square", "Soft", "Round", "Pointed"],
    eyebrows: ["Thick", "Thin", "Arched", "Straight", "Bushy", "Bleached"],
    hairStyle: ["Long wavy", "Bob cut", "Pixie", "Straight", "Braids", "Ponytail", "Messy Bun", "Fade", "Buzz Cut", "Man Bun", "Side Part", "Bald", "Mullet"],
    hairColor: ["Brunette", "Blonde", "Platinum", "Redhead", "Black", "Pink Pastel", "Silver", "Grey", "Blue", "Green"],
    clothingStyle: ["Streetwear", "Business Chic", "Bohemian", "Minimalist", "High Fashion", "Cyberpunk", "Vintage", "Sporty", "Gothic", "Preppy"],
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
    voices: ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"]
};