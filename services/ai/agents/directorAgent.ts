
import { DirectorShot, StudioSettings, InfluencerSettings } from "../../../types";
import { INITIAL_STUDIO, INITIAL_INFLUENCER } from "../../../data/constants";

// Procedural Arrays - Exposed for Hook usage
export const DIRECTOR_VARS = {
    GENRES: ["Cyberpunk", "Film Noir", "High Fantasy", "Y2K Pop", "Victorian Gothic", "Space Opera", "Western", "80s Synthwave", "Minimalist Luxury", "Grunge", "Baroque", "Techwear", "Cottagecore", "Industrial", "Vaporwave", "Afrofuturism", "Steampunk", "Art Deco"],
    SUBJECTS: ["an assassin", "a pop star", "a detective", "a royal heir", "a hacker", "an explorer", "a chef", "an athlete", "a CEO", "a mechanic", "a pilot", "a dancer", "a monk", "a sniper", "a diplomat", "a rogue AI"],
    SETTINGS: ["in a neon-lit rainstorm", "in an abandoned cathedral", "on a Mars colony", "in a luxury penthouse", "in a subway station", "in a desert oasis", "at a met gala", "in a snowy bunker", "in a bamboo forest", "in a server room", "on a yacht", "in a jazz club", "in a greenhouse"],
    MOODS: ["melancholic", "euphoric", "mysterious", "aggressive", "ethereal", "romantic", "uncanny", "serene", "chaotic", "nostalgic", "ominous", "playful"],
    LIGHTING: ["harsh red neon", "soft moonlight", "strobe lights", "golden hour sun", "bioluminescent glow", "candlelight", "cinematic teal/orange", "rembrandt", "split lighting", "silhouette", "volumetric fog"],
    CAMERAS: ["on 35mm film", "with a fisheye lens", "on CCTV", "with a drone", "on polaroid", "cinematic widescreen", "macro lens"]
};

export class DirectorAgent {
    static generateProceduralBrief(): string {
        const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        
        const genre = pick(DIRECTOR_VARS.GENRES);
        const subject = pick(DIRECTOR_VARS.SUBJECTS);
        const setting = pick(DIRECTOR_VARS.SETTINGS);
        const mood = pick(DIRECTOR_VARS.MOODS);
        const light = pick(DIRECTOR_VARS.LIGHTING);
        const camera = pick(DIRECTOR_VARS.CAMERAS);
        
        return `A ${mood} ${genre} campaign featuring ${subject} ${setting}. Shot ${camera}. Lighting should be ${light}.`;
    }

    static mapShotToSettings(shot: DirectorShot, baseVibe: string, intensity: number = 50, projectContext?: string): { settings: StudioSettings | InfluencerSettings, mode: 'STUDIO' | 'INFLUENCER' } {
        // --- INTENSITY LOGIC ---
        // Dynamically adjust parameters based on the Drama Slider (0-100)
        let vibeModifier = baseVibe;
        let lightingOverride = "";
        let contrastOverride = "";
        
        if (intensity >= 80) {
            vibeModifier = `${baseVibe}, High Fashion, Edgy, Avant Garde, Provocative`;
            lightingOverride = "Hard Flash";
            contrastOverride = "High Contrast";
        } else if (intensity <= 30) {
            vibeModifier = `${baseVibe}, Candid, Natural, Soft, Authentic`;
            lightingOverride = "Natural Window";
            contrastOverride = "Soft";
        }

        if (shot.type === 'STUDIO') {
            const settings: StudioSettings = {
                ...INITIAL_STUDIO,
                productDescription: shot.description, 
                background: shot.visualDetails, 
                lightingSetup: lightingOverride || "Softbox", 
                editorialVibe: vibeModifier,
                isHighFashion: intensity > 60, // Auto-enable High Fashion mode
                aspectRatio: "3:4",
                useMagicPrompt: true
            };
            return { settings, mode: 'STUDIO' };
        } else {
            const settings: InfluencerSettings = {
                ...INITIAL_INFLUENCER,
                action: shot.description,
                vibe: vibeModifier,
                location: shot.visualDetails,
                aspectRatio: "4:5",
                useMagicPrompt: true
            };
            return { settings, mode: 'INFLUENCER' };
        }
    }
}
