
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Preset, StudioSettings, InfluencerSettings, MotionSettings } from '../types';

interface PresetState {
    presets: Preset[];
    savePreset: (name: string, mode: 'STUDIO'|'INFLUENCER'|'MOTION', settings: any) => void;
    deletePreset: (id: string) => void;
    loadPreset: (id: string) => Preset | undefined;
    importPreset: (preset: Preset) => void;
    exportPreset: (id: string) => void;
}

export const usePresetStore = create<PresetState>()(
    persist(
        (set, get) => ({
            presets: [],
            
            savePreset: (name, mode, settings) => {
                const newPreset: Preset = {
                    id: `preset-${Date.now()}`,
                    name,
                    mode,
                    settings
                };
                set(state => ({ presets: [...state.presets, newPreset] }));
            },

            deletePreset: (id) => set(state => ({ 
                presets: state.presets.filter(p => p.id !== id) 
            })),

            loadPreset: (id) => get().presets.find(p => p.id === id),

            importPreset: (preset) => {
                // Ensure ID uniqueness
                const safePreset = { ...preset, id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
                set(state => ({ presets: [...state.presets, safePreset] }));
            },

            exportPreset: (id) => {
                const preset = get().presets.find(p => p.id === id);
                if (!preset) return;
                
                const blob = new Blob([JSON.stringify(preset, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${preset.name.replace(/\s+/g, '_')}.style`;
                a.click();
                URL.revokeObjectURL(url);
            }
        }),
        {
            name: 'gemini-presets',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
