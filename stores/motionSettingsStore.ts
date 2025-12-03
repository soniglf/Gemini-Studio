
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MotionSettings } from '../types';
import { INITIAL_MOTION } from '../data/defaults';

const MOTION_SETTINGS_VERSION = 1;

interface MotionSettingsState {
    version: number;
    settings: MotionSettings;
    setSettings: (s: MotionSettings) => void;
}

export const useMotionSettingsStore = create<MotionSettingsState>()(
    persist(
        (set) => ({
            version: MOTION_SETTINGS_VERSION,
            settings: INITIAL_MOTION,
            setSettings: (settings) => set({ settings }),
        }),
        {
            name: 'gemini-motion-settings-store-v2',
            storage: createJSONStorage(() => localStorage),
            version: MOTION_SETTINGS_VERSION,
            onRehydrateStorage: (state) => {
                 if (state?.version !== MOTION_SETTINGS_VERSION) {
                    console.warn(`Motion settings version mismatch. Resetting.`);
                    return; 
                }
            },
            partialize: (state) => ({ 
                version: state.version,
                settings: { ...state.settings, sourceImage: null, selectedLocationPreview: null },
            })
        }
    )
);
