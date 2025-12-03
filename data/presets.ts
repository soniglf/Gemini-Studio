
import { ModelAttributes, ModelMorphology } from "../types";

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

// FIX: Add DIRECTOR_VARS here so it can be used by the consolidated GenerationService
export const DIRECTOR_VARS = {
    GENRES: ["Cyberpunk", "Film Noir", "High Fantasy", "Y2K Pop", "Victorian Gothic", "Space Opera", "Western", "80s Synthwave", "Minimalist Luxury", "Grunge", "Baroque", "Techwear", "Cottagecore", "Industrial", "Vaporwave", "Afrofuturism", "Steampunk", "Art Deco"],
    SUBJECTS: ["an assassin", "a pop star", "a detective", "a royal heir", "a hacker", "an explorer", "a chef", "an athlete", "a CEO", "a mechanic", "a pilot", "a dancer", "a monk", "a sniper", "a diplomat", "a rogue AI"],
    SETTINGS: ["in a neon-lit rainstorm", "in an abandoned cathedral", "on a Mars colony", "in a luxury penthouse", "in a subway station", "in a desert oasis", "at a met gala", "in a snowy bunker", "in a bamboo forest", "in a server room", "on a yacht", "in a jazz club", "in a greenhouse"],
    MOODS: ["melancholic", "euphoric", "mysterious", "aggressive", "ethereal", "romantic", "uncanny", "serene", "chaotic", "nostalgic", "ominous", "playful"],
    LIGHTING: ["harsh red neon", "soft moonlight", "strobe lights", "golden hour sun", "bioluminescent glow", "candlelight", "cinematic teal/orange", "rembrandt", "split lighting", "silhouette", "volumetric fog"],
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
