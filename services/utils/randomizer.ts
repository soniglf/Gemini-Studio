
import { StudioSettings, InfluencerSettings, MotionSettings, Lighting, ShotType, TimeOfDay, Vibe } from '../../types';
import { INITIAL_STUDIO, INITIAL_INFLUENCER, INITIAL_MOTION } from '../../data/defaults';
import { OPTIONS } from '../../data/options';

export class RandomizerService {
    private static pick<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    private static randomBool(): boolean {
        return Math.random() > 0.5;
    }

    static randomizeStudio(current: StudioSettings): StudioSettings {
        return {
            ...current,
            lighting: this.pick(Object.values(Lighting)),
            shotType: this.pick(Object.values(ShotType)),
            cameraModel: this.pick(OPTIONS.cameraModel),
            lensFocalLength: this.pick(OPTIONS.lensFocal),
            aperture: this.pick(OPTIONS.aperture),
            colorGrading: this.pick(OPTIONS.colorGrading),
            lightingSetup: this.pick(OPTIONS.lightingSetup),
            background: `Studio ${this.pick(['Gray', 'White', 'Black', 'Colored'])} Backdrop`,
            isHighFashion: this.randomBool(),
            seed: Math.floor(Math.random() * 1000000)
        };
    }

    static randomizeInfluencer(current: InfluencerSettings): InfluencerSettings {
        return {
            ...current,
            timeOfDay: this.pick(Object.values(TimeOfDay)),
            vibe: this.pick(Object.values(Vibe)),
            cameraModel: this.pick(OPTIONS.cameraModel),
            lensFocalLength: this.pick(OPTIONS.lensFocal),
            aperture: this.pick(OPTIONS.aperture),
            colorGrading: this.pick(OPTIONS.colorGrading),
            lightingSetup: "Natural Light",
            location: this.pick(["Paris Cafe", "Tokyo Street", "NYC Rooftop", "Bali Beach", "London Underground", "Desert Highway"]),
            seed: Math.floor(Math.random() * 1000000)
        };
    }

    static randomizeMotion(current: MotionSettings): MotionSettings {
        return {
            ...current,
            fps: this.pick(OPTIONS.fps),
            shutterAngle: this.pick(OPTIONS.shutterAngle),
            stabilization: this.pick(OPTIONS.stabilization),
            vibe: this.pick(Object.values(Vibe)),
            location: this.pick(["Cyberpunk City", "Misty Forest", "Neon Club", "Underwater", "Space Station"]),
            movement: this.pick(["Slow Pan", "Dolly Zoom", "Tracking Shot", "Handheld"]),
            seed: Math.floor(Math.random() * 1000000)
        };
    }
}
