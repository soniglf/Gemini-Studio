
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StudioSettings } from '../types';
import { INITIAL_STUDIO } from '../data/defaults';

const STUDIO_SETTINGS_VERSION = 1;

interface StudioSettingsState {
    version: number;
    settings: StudioSettings;
    setSettings: (s: StudioSettings) => void;
}

export const useStudioSettingsStore = create<StudioSettingsState>()(
    persist(
        (set) => ({
            version: STUDIO_SETTINGS_VERSION,
            settings: INITIAL_STUDIO,
            setSettings: (settings) => set({ settings }),
        }),
        {
            name: 'gemini-studio-settings-store-v2', 
            storage: createJSONStorage(() => localStorage),
            version: STUDIO_SETTINGS_VERSION,
            onRehydrateStorage: (state) => {
                 if (state?.version !== STUDIO_SETTINGS_VERSION) {
                    console.warn(`Studio settings version mismatch. Resetting.`);
                    return; 
                }
            },
            partialize: (state) => ({ 
                version: state.version,
                settings: { ...state.settings, outfitImage: null, productImage: null, selectedLocationPreview: null },
            })
        }
    )
);
