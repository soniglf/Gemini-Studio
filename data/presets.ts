import { ModelAttributes, ModelMorphology } from "../types";

export const MUSE_ARCHETYPES = [
    { label: "Streetwear", prompt: "A hypebeast fashion icon in Tokyo, wearing oversized layers and sneakers." },
    { label: "Noir", prompt: "A mysterious figure in a 1940s trench coat, moody lighting, shadows." },
    { label: "Minimalist", prompt: "A model wearing simple, architectural clothing in a clean studio." },
    { label: "Vintage", prompt: "A 70s bohemian artist with bell-bottoms, floral prints, and film grain." },
    { label: "High Fashion", prompt: "An avant-garde editorial model with sharp features and architectural clothing." },
    { label: "Athlete", prompt: "A peak performance sprinter with sweat, athletic gear, and intense focus." },
    { label: "Executive", prompt: "A confident CEO in a tailored suit, modern office setting." }
];

export const MUTATION_TRAITS = [
    { label: "Freckled", prompt: "with a dusting of natural freckles across the nose and cheeks" },
    { label: "Tattooed", prompt: "with artistic ink sleeves and geometric neck tattoos" },
    { label: "Glow", prompt: "bathed in soft, golden hour backlighting" },
    { label: "Grunge", prompt: "with smudged eyeliner, messy hair, and a rockstar attitude" },
    { label: "Elegant", prompt: "wearing subtle jewelry, perfect posture, and a haughty expression" },
    { label: "Noir", prompt: "shrouded in shadow, high contrast lighting, black and white aesthetic" },
    { label: "Neon", prompt: "lit by pink and blue city lights, wet skin, urban night vibe" },
    { label: "Sweat", prompt: "glistening with perspiration, intense workout vibe, raw texture" }
];

export const DIRECTOR_VARS = {
    GENRES: ["Film Noir", "Y2K Pop", "Minimalist Luxury", "Grunge", "Techwear", "Cottagecore", "Industrial", "Art Deco", "Street Style", "Vogue Editorial"],
    SUBJECTS: ["a pop star", "a detective", "a royal heir", "a chef", "an athlete", "a CEO", "a mechanic", "a pilot", "a dancer", "a diplomat", "a musician", "a model"],
    SETTINGS: ["in a luxury penthouse", "in a subway station", "in a desert oasis", "at a met gala", "on a yacht", "in a jazz club", "in a greenhouse", "in a photo studio", "on a rooftop", "in a cafe"],
    MOODS: ["melancholic", "euphoric", "mysterious", "aggressive", "romantic", "serene", "chaotic", "nostalgic", "ominous", "playful"],
    LIGHTING: ["harsh red neon", "soft moonlight", "strobe lights", "golden hour sun", "candlelight", "cinematic teal/orange", "rembrandt", "split lighting", "silhouette", "volumetric fog"],
    CAMERAS: ["on 35mm film", "with a fisheye lens", "on CCTV", "with a drone", "on polaroid", "cinematic widescreen", "macro lens"]
};


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
        // Tuned for new sensitivity: 80+ is extreme, 60+ is strong.
        morphology: { height: 90, bodyFat: 10, muscleMass: 20, boneStructure: 30, bustChest: 30, hipsWaistRatio: 35, faceShape: 'DIAMOND', cheekboneHeight: 85, legLength: 90, shoulderWidth: 45, neckThickness: 40 },
        museDescription: "A statuesque runway model with sharp, diamond-shaped features, towering height, and an ethereal, high-fashion gaze."
    },
    "Fitness Icon": { 
        ethnicity: "Latina", age: 26, hairStyle: "Ponytail", hairColor: "Black",
        morphology: { height: 60, bodyFat: 10, muscleMass: 75, boneStructure: 60, bustChest: 45, hipsWaistRatio: 65, faceShape: 'SQUARE', jawlineDefinition: 75, shoulderWidth: 65, vascularity: 50 },
        museDescription: "A peak-performance fitness influencer with defined abs, athletic build, glowing tan skin, and a high ponytail."
    },
    "Editorial Plus": { 
        ethnicity: "African American", age: 24, hairStyle: "Bald", hairColor: "Black",
        morphology: { height: 60, bodyFat: 80, muscleMass: 40, boneStructure: 70, bustChest: 85, hipsWaistRatio: 80, faceShape: 'ROUND', lipFullness: 85, cheekboneHeight: 70 },
        museDescription: "A striking plus-size editorial model with bold features, smooth dark skin, shaved head, and confident curves."
    },
    "Girl Next Door": { 
        ethnicity: "Caucasian", age: 22, hairStyle: "Messy Bun", hairColor: "Blonde",
        morphology: { height: 50, bodyFat: 45, muscleMass: 30, boneStructure: 50, bustChest: 50, hipsWaistRatio: 50, faceShape: 'HEART', noseStructure: 20, freckleDensity: 70 },
        museDescription: "A natural beauty with a friendly face, messy blonde bun, soft features, and freckles."
    },
    "Petite & Curvy": { 
        ethnicity: "East Asian", age: 23, hairStyle: "Bob cut", hairColor: "Pink Pastel",
        morphology: { height: 20, bodyFat: 35, muscleMass: 30, boneStructure: 30, bustChest: 75, hipsWaistRatio: 75, faceShape: 'OVAL', eyeSize: 75, legLength: 30 },
        museDescription: "A petite fashionista with a curvy hourglass figure, pastel pink bob cut, and large expressive eyes."
    },
};

export const FULL_PRESETS_MALE: Record<string, FullPreset> = {
    "Runway Male": { 
        ethnicity: "Nordic", age: 22, hairStyle: "Side Part", hairColor: "Blonde",
        morphology: { height: 95, bodyFat: 8, muscleMass: 45, boneStructure: 60, bustChest: 40, hipsWaistRatio: 80, faceShape: 'DIAMOND', jawlineDefinition: 95, shoulderWidth: 70 },
        museDescription: "A sharp-jawed Nordic male model with piercing eyes, tall lean frame, and platinum blonde hair."
    },
    "Bodybuilder": { 
        ethnicity: "African American", age: 30, hairStyle: "Bald", hairColor: "Black",
        morphology: { height: 55, bodyFat: 5, muscleMass: 95, boneStructure: 90, bustChest: 95, hipsWaistRatio: 90, faceShape: 'SQUARE', vascularity: 85, neckThickness: 90, shoulderWidth: 95 },
        museDescription: "A massive professional bodybuilder with hyper-defined muscles, vascularity, and an intimidating presence."
    },
    "Lean Swimmer": { 
        ethnicity: "Mixed", age: 24, hairStyle: "Messy Bun", hairColor: "Brunette",
        morphology: { height: 80, bodyFat: 12, muscleMass: 60, boneStructure: 70, bustChest: 60, hipsWaistRatio: 85, faceShape: 'OVAL', cheekboneHeight: 70, shoulderWidth: 80 },
        museDescription: "A lean and toned swimmer with broad shoulders, sun-kissed skin, and wet messy hair."
    },
    "Dad Bod": { 
        ethnicity: "Caucasian", age: 40, hairStyle: "Side Part", hairColor: "Grey",
        morphology: { height: 50, bodyFat: 65, muscleMass: 40, boneStructure: 60, bustChest: 50, hipsWaistRatio: 40, faceShape: 'ROUND', jawlineDefinition: 30, grayScale: 60 },
        museDescription: "A rugged middle-aged man with a comfortable build, salt-and-pepper hair, and a friendly, approachable vibe."
    },
    "Streetwear Icon": { 
        ethnicity: "East Asian", age: 20, hairStyle: "Mullet", hairColor: "Bleached",
        morphology: { height: 65, bodyFat: 20, muscleMass: 40, boneStructure: 50, bustChest: 40, hipsWaistRatio: 60, faceShape: 'HEART', noseStructure: 40, eyeTilt: 75 },
        museDescription: "A trendy streetwear icon with a bleached mullet, sharp facial features, and a cool, detached expression."
    },
};