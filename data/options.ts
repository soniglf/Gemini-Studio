
import { Lighting, ShotType, TimeOfDay, Vibe } from '../types';

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
