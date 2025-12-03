
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ModelAttributes } from '../types';
import { db } from '../services/db';
import { DEFAULT_MODEL } from '../data/defaults';
import { useUIStore } from './uiStore';

const MODEL_STORE_VERSION = 4;

interface ModelState {
    version: number;
    model: ModelAttributes;
    savedModels: ModelAttributes[];
    historyStacks: Record<string, ModelAttributes[]>;
    historyPointers: Record<string, number>;
    
    loadModels: () => Promise<void>;
    setModel: (model: ModelAttributes, skipHistory?: boolean) => void;
    createProfile: () => Promise<void>;
    forkProfile: () => Promise<void>;
    deleteProfile: () => Promise<void>;
    updateReferenceImage: (url: string) => Promise<void>;
    undo: () => void;
    redo: () => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let historyTimeout: ReturnType<typeof setTimeout> | null = null;

export const useModelStore = create<ModelState>()(
    persist(
        (set, get) => ({
            version: MODEL_STORE_VERSION,
            model: DEFAULT_MODEL,
            savedModels: [DEFAULT_MODEL],
            historyStacks: { [DEFAULT_MODEL.id]: [DEFAULT_MODEL] },
            historyPointers: { [DEFAULT_MODEL.id]: 0 },

            loadModels: async () => {
                try {
                    const ms = await db.model.getAll();
                    if(ms && ms.length > 0) { 
                        const valid = ms.filter(m => m && m.id).map(m => ({ ...DEFAULT_MODEL, ...m }));
                        const initialModel = valid.length ? valid[0] : DEFAULT_MODEL;
                        
                        const currentStacks = get().historyStacks;
                        if (!currentStacks[initialModel.id]) {
                            currentStacks[initialModel.id] = [initialModel];
                        }
                        const currentPointers = get().historyPointers;
                        if (currentPointers[initialModel.id] === undefined) {
                             currentPointers[initialModel.id] = currentStacks[initialModel.id].length - 1;
                        }

                        set({ 
                            savedModels: valid.length ? valid : [DEFAULT_MODEL],
                            model: initialModel,
                            historyStacks: currentStacks,
                            historyPointers: currentPointers
                        });
                    }
                } catch(e) { console.error("Model Load Error", e); }
            },

            setModel: (model, skipHistory = false) => {
                if (skipHistory) {
                    const currentStacks = get().historyStacks;
                    if (!currentStacks[model.id]) {
                        currentStacks[model.id] = [model];
                    }
                    const currentPointers = get().historyPointers;
                    if (currentPointers[model.id] === undefined) {
                         currentPointers[model.id] = currentStacks[model.id].length - 1;
                    }

                    const latestInHistory = currentStacks[model.id][currentPointers[model.id]];
                    set({ model: latestInHistory, historyStacks: currentStacks, historyPointers: currentPointers });
                    return;
                }

                set(state => {
                    const idx = state.savedModels.findIndex(m => m.id === model.id);
                    const newSaved = [...state.savedModels];
                    if (idx > -1) newSaved[idx] = model;
                    
                    return { model, savedModels: newSaved };
                });

                if (historyTimeout) clearTimeout(historyTimeout);
                historyTimeout = setTimeout(() => {
                    set(state => {
                        const { historyStacks, historyPointers } = state;
                        const currentStack = historyStacks[model.id] || [];
                        const currentPointer = historyPointers[model.id] ?? currentStack.length - 1;

                        const newHistoryForModel = currentStack.slice(0, currentPointer + 1);
                        
                        const lastStateInHistory = newHistoryForModel[newHistoryForModel.length - 1];
                        if (lastStateInHistory && JSON.stringify(lastStateInHistory) === JSON.stringify(model)) {
                            return {};
                        }
                        
                        newHistoryForModel.push(model);
                        
                        return {
                            historyStacks: { ...historyStacks, [model.id]: newHistoryForModel },
                            historyPointers: { ...historyPointers, [model.id]: newHistoryForModel.length - 1 }
                        };
                    });
                }, 500);

                if (model.id !== 'default') {
                    if (saveTimeout) clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(() => { db.model.save(model); }, 500);
                }
            },

            createProfile: async () => {
                const nm = { ...DEFAULT_MODEL, id: Date.now().toString(), name: "New Model", referenceImages: [] };
                await db.model.save(nm);
                set(state => ({
                    model: nm,
                    savedModels: [...state.savedModels, nm],
                    historyStacks: { ...state.historyStacks, [nm.id]: [nm] },
                    historyPointers: { ...state.historyPointers, [nm.id]: 0 }
                }));
                useUIStore.getState().addToast("New profile created", 'success');
            },

            forkProfile: async () => { 
                const { model } = get();
                const nm = { ...model, id: Date.now().toString(), name: `${model.name} (Copy)` };
                await db.model.save(nm);
                set(state => ({
                    model: nm,
                    savedModels: [...state.savedModels, nm],
                    historyStacks: { ...state.historyStacks, [nm.id]: [nm] },
                    historyPointers: { ...state.historyPointers, [nm.id]: 0 }
                }));
                useUIStore.getState().addToast("Profile duplicated", 'success');
            },
            deleteProfile: async () => { 
                const { model, savedModels } = get();
                if(savedModels.length <= 1) return;
                
                await db.model.delete(model.id);
                const remaining = savedModels.filter(m => m.id !== model.id);
                
                set(state => ({
                    savedModels: remaining,
                    model: remaining[0],
                    // We don't necessarily need to clear history, but we can
                }));
                useUIStore.getState().addToast("Profile deleted", 'success');
            },
            updateReferenceImage: async (url) => { 
                const { model } = get();
                const updated = { ...model, referenceImage: url };
                get().setModel(updated);
            },
            
            undo: () => {
                set(state => {
                    const { model, historyStacks, historyPointers } = state;
                    const pointer = historyPointers[model.id] ?? 0;
                    if (pointer > 0) {
                        const newPointer = pointer - 1;
                        const newModel = historyStacks[model.id][newPointer];
                        return { 
                            historyPointers: { ...historyPointers, [model.id]: newPointer },
                            model: newModel 
                        };
                    }
                    return {};
                });
            },

            redo: () => {
                set(state => {
                    const { model, historyStacks, historyPointers } = state;
                    const stack = historyStacks[model.id] || [];
                    const pointer = historyPointers[model.id] ?? stack.length - 1;
                    if (pointer < stack.length - 1) {
                        const newPointer = pointer + 1;
                        const newModel = stack[newPointer];
                        return { 
                            historyPointers: { ...historyPointers, [model.id]: newPointer },
                            model: newModel 
                        };
                    }
                    return {};
                });
            }
        }),
        {
            name: 'gemini-model-store-v2', 
            storage: createJSONStorage(() => localStorage),
            version: MODEL_STORE_VERSION,
            onRehydrateStorage: (state) => {
                if (state?.version !== MODEL_STORE_VERSION) {
                    console.warn(`Model store version mismatch. Resetting.`);
                }
            },
            partialize: (state) => {
                const cleanStacks: Record<string, ModelAttributes[]> = {};
                for (const key in state.historyStacks) {
                    cleanStacks[key] = state.historyStacks[key].map(m => ({ ...m, referenceImage: null, referenceImages: [], accessoriesImage: null }));
                }

                return {
                    version: state.version,
                    historyStacks: cleanStacks,
                    historyPointers: state.historyPointers
                };
            }
        }
    )
);
