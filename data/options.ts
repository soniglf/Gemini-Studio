
import { Lighting, ShotType, TimeOfDay, Vibe } from '../types';

export const GENDER_SPECIFIC = {
    MALE: {
        ethnicity: ["Latino", "Caucasian", "East Asian", "South Asian", "African American", "Middle Eastern", "Nordic", "Mixed", "Slavic", "Pacific Islander"],
        hairStyle: [
            "Fade", "Crew Cut", "Buzz Cut", "Undercut", "Pompadour", "Quiff", "Slicked Back", 
            "Side Part", "Textured Fringe", "Man Bun", "Long Flow", "Surfer Curtains", 
            "Dreadlocks", "Afro", "Bald", "Mullet"
        ],
        facialHair: [
            "Clean Shaven", "5 O'Clock Shadow", "Light Stubble", "Heavy Stubble", 
            "Full Beard", "Short Boxed Beard", "Ducktail Beard", "Goatee", 
            "Mustache", "Chevron Mustache", "Van Dyke", "Mutton Chops"
        ]
    },
    FEMALE: {
        ethnicity: ["Latina", "Caucasian", "East Asian", "South Asian", "African American", "Middle Eastern", "Nordic", "Mixed", "Slavic", "Pacific Islander"],
        hairStyle: [
            "Beach Waves", "Sleek Straight", "Bob Cut", "Pixie", "High Ponytail", 
            "Messy Bun", "Box Braids", "Curtain Bangs", "Layered Volume", 
            "Wolf Cut", "Afro", "Dreadlocks", "Bald", "Long Wavy"
        ],
        facialHair: ["None"]
    }
};

export const OPTIONS = {
    ethnicity: Array.from(new Set([...GENDER_SPECIFIC.MALE.ethnicity, ...GENDER_SPECIFIC.FEMALE.ethnicity])),
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
    
    // Master Lists (Union)
    hairStyle: Array.from(new Set([...GENDER_SPECIFIC.MALE.hairStyle, ...GENDER_SPECIFIC.FEMALE.hairStyle])),
    hairColor: ["Brunette", "Blonde", "Platinum", "Redhead", "Black", "Pink Pastel", "Silver", "Grey", "Salt & Pepper", "Blue", "Green", "Bleached"],
    
    hairTexture: ["Straight (Type 1)", "Wavy (Type 2)", "Curly (Type 3)", "Coily (Type 4)", "Afro-Textured"],
    eyebrowStyle: ["Natural", "Thick/Bushy", "Thin/90s", "Straight/K-Pop", "Arched", "Bleached", "Unibrow", "Groomed"],
    
    clothingStyle: [
        "Minimalist", "Streetwear", "Business Chic", "Bohemian", "High Fashion", "Cyberpunk", "Vintage", 
        "Sporty", "Gothic", "Preppy", "Techwear", "Old Money / Dapper", "Rugged / Workwear", "Tactical", "Suited"
    ],

    identityOutfits: [
        "Black Underwear",
        "Casual",
        "Corporate",
        "High Fashion",
        "Sport",
        "Comfy"
    ],
    
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
    
    glasses: ["None", "Standard Glasses", "Reading Glasses", "Thick Rimmed", "Wire Frame", "Rimless", "Sunglasses", "Aviators", "Cat Eye", "Round", "Square", "Rectangle Glasses", "Round Glasses"],
    
    facialHair: Array.from(new Set([...GENDER_SPECIFIC.MALE.facialHair, ...GENDER_SPECIFIC.FEMALE.facialHair])),
    
    visualVibe: ["Neutral", "Corporate", "Casual", "Edgy", "Vintage", "Minimalist", "Bohemian", "Sporty", "Gothic", "Preppy", "Streetwear", "Ethereal", "Gritty"],
    
    shotFocus: ["Full Fit", "Portrait", "Details", "Candid", "Social Selfie"],

    socialContexts: [
        "Instagram Feed", 
        "Instagram Story (Raw)", 
        "LinkedIn Professional", 
        "TikTok Cover", 
        "Paparazzi / Spy", 
        "Tinder / Dating"
    ],

    studioSetDesigns: [
        "Seamless Paper Only",
        "Minimalist White Plinth", 
        "Industrial Concrete Wall", 
        "Lush Tropical Plants", 
        "Neon Geometric Shapes", 
        "Vintage Velvet Curtains", 
        "Abstract Shadow Play", 
        "Floating Silk Fabric", 
        "Mirror & Glass Reflections"
    ],
    
    studioProps: [
        "None",
        "Wooden Stool",
        "Apple Box",
        "C-Stand",
        "Vintage Camera",
        "Fresh Flowers",
        "Geometric Cube",
        "Giant Mirror",
        "Ladder",
        "Sheer Fabric",
        "Disco Ball"
    ],
    
    studioInteractions: [
        "Standing Confidently",
        "Sitting on Stool",
        "Walking Towards Camera",
        "Holding Product",
        "Touching Face",
        "Leaning on Wall",
        "Dynamic Jump",
        "Reclining on Floor",
        "Crossed Arms",
        "Hands in Pockets"
    ],

    studioVibes: [
        "High Fashion",
        "Candid",
        "Portrait",
        "Editorial",
        "Commercial Catalog",
        "Moody / Noir",
        "Ethereal / Dreamy",
        "Grunge / Edgy",
        "Minimalist / Clean"
    ],
    
    influencerProps: [
        "None",
        "Iced Coffee",
        "Matcha Latte",
        "Smartphone",
        "Designer Handbag",
        "Film Camera",
        "Bouquet of Flowers",
        "Pizza Slice",
        "Passport & Ticket",
        "Yoga Mat",
        "Laptop",
        "Sunglasses"
    ],

    cameraMovements: [
        "Static Tripod",
        "Slow Pan Left",
        "Slow Pan Right",
        "Dolly Zoom (Vertigo)",
        "Tracking Shot (Forward)",
        "Tracking Shot (Backward)",
        "Handheld (Shaky)",
        "Orbit / Arc Shot",
        "Low Angle Tracking"
    ],
    
    filmStocks: [
        "Digital Clean (Standard)",
        "Kodak Portra 400 (Warm)",
        "Fujifilm Eterna (Cinematic)",
        "Ilford B&W (Noir)",
        "Bleach Bypass (Gritty)",
        "Kodachrome (Vintage)",
        "VHS Glitch (Retro)"
    ]
};

export const SLIDER_LABELS: Record<string, [string, string]> = {
    height: ["Short", "Tall"],
    bodyFat: ["Shredded", "Soft"],
    muscleMass: ["Lean", "Voluminous"],
    boneStructure: ["Petite", "Broad"],
    shoulderWidth: ["Narrow", "Broad"],
    legLength: ["Short Legs", "Long Legs"],
    neckThickness: ["Thin", "Thick"],
    
    bustChest: ["Flat", "Large"], 
    hipsWaistRatio: ["Straight", "Curvy"], 
    
    jawlineDefinition: ["Soft", "Sharp"],
    chinProminence: ["Recessed", "Jutting"],
    foreheadHeight: ["Low", "High"],
    cheekboneHeight: ["Low", "High"],
    
    eyeSize: ["Narrow", "Doe"],
    eyeSpacing: ["Close-Set", "Wide-Set"],
    eyeTilt: ["Downturned", "Cat-Eye"],
    eyebrowArch: ["Flat", "Arched"],
    
    noseStructure: ["Button", "Aquiline"],
    lipFullness: ["Thin", "Full"],
    
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