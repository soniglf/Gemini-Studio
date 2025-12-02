

import { create } from 'zustand';
import { ModelAttributes } from '../types';
import { db } from '../services/db';
import { DEFAULT_MODEL } from '../data/constants';
import { useUIStore } from './uiStore';

interface ModelState {
    model: ModelAttributes;
    savedModels: ModelAttributes[];
    
    loadModels: () => Promise<void>;
    setModel: (model: ModelAttributes) => void;
    createProfile: () => Promise<void>;
    forkProfile: () => Promise<void>;
    deleteProfile: () => Promise<void>;
    updateReferenceImage: (url: string) => Promise<void>;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useModelStore = create<ModelState>((set, get) => ({
    model: DEFAULT_MODEL,
    savedModels: [DEFAULT_MODEL],

    loadModels: async () => {
        try {
            const ms = await db.model.getAll();
            if(ms && ms.length) { 
                // Ensure migration to array structure
                const valid = ms.filter(m => m && m.id).map(m => ({ 
                    ...DEFAULT_MODEL, 
                    ...m,
                    referenceImages: m.referenceImages || (m.referenceImage ? [m.referenceImage] : [])
                }));
                set({ 
                    savedModels: valid.length ? valid : [DEFAULT_MODEL],
                    model: valid.length ? valid[0] : DEFAULT_MODEL
                });
            }
        } catch(e) { console.error("Model Load Error", e); }
    },

    setModel: (model) => {
        set(state => {
            const idx = state.savedModels.findIndex(m => m.id === model.id);
            const newSaved = [...state.savedModels];
            if (idx > -1) newSaved[idx] = model;
            return { model, savedModels: newSaved };
        });

        if (model.id !== 'default') {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                db.model.save(model);
            }, 500);
        }
    },

    createProfile: async () => {
        const nm = { ...DEFAULT_MODEL, id: Date.now().toString(), name: "New Model", referenceImages: [] };
        await db.model.save(nm);
        set(state => ({
            model: nm,
            savedModels: [...state.savedModels, nm]
        }));
        useUIStore.getState().addToast("New profile created", 'success');
    },

    forkProfile: async () => {
        const { model, savedModels } = get();
        const forked: ModelAttributes = {
            ...model,
            id: Date.now().toString(),
            name: `${model.name} (Copy)`,
            version: 1
        };
        
        await db.model.save(forked);
        set({
            model: forked,
            savedModels: [...savedModels, forked]
        });
        useUIStore.getState().addToast("Model Identity Forked", 'success');
    },

    deleteProfile: async () => {
        const { savedModels, model } = get();
        if(savedModels.length <= 1) {
            useUIStore.getState().addToast("Cannot delete last profile", 'warning');
            return;
        }
        await db.model.delete(model.id);
        const rem = savedModels.filter(m => m.id !== model.id);
        set({ savedModels: rem, model: rem[0] });
        useUIStore.getState().addToast("Profile deleted", 'success');
    },

    updateReferenceImage: async (url) => {
        const { model, setModel } = get();
        if (model.id === 'default') {
            useUIStore.getState().addToast("Cannot update default profile. Create a new one.", 'error');
            return;
        }
        
        // Add to Face Bank (Limit 5)
        const currentImages = model.referenceImages || [];
        const newImages = [...currentImages, url].slice(0, 5);
        
        const updated = { ...model, referenceImages: newImages, referenceImage: url }; // Update legacy pointer too for thumbnails
        setModel(updated);
        useUIStore.getState().addToast("Model Face Bank Updated", 'success');
    }
}));
