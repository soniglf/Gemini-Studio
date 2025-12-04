
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { InfluencerSettings } from '../types';
import { INITIAL_INFLUENCER } from '../data/defaults';

const INFLUENCER_SETTINGS_VERSION = 3; // Bumped version for Phase 3

interface InfluencerSettingsState {
    version: number;
    settings: InfluencerSettings;
    setSettings: (s: InfluencerSettings) => void;
}

export const useInfluencerSettingsStore = create<InfluencerSettingsState>()(
    persist(
        (set) => ({
            version: INFLUENCER_SETTINGS_VERSION,
            settings: INITIAL_INFLUENCER,
            setSettings: (settings) => set({ settings }),
        }),
        {
            name: 'gemini-influencer-settings-store-v2',
            storage: createJSONStorage(() => localStorage),
            version: INFLUENCER_SETTINGS_VERSION,
             onRehydrateStorage: (state) => {
                 if (state?.version !== INFLUENCER_SETTINGS_VERSION) {
                    console.warn(`Influencer settings version mismatch. Resetting.`);
                    return; 
                }
            },
            partialize: (state) => ({ 
                version: state.version,
                settings: { ...state.settings, outfitImage: null, selectedLocationPreview: null },
            })
        }
    )
);