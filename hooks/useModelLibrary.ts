
import { useState, useEffect, useRef } from 'react';
import { ModelAttributes } from '../types';
import { db } from '../services/db';
import { DEFAULT_MODEL } from '../data/constants';

export const useModelLibrary = (addToast: (msg: string, type?: any) => void) => {
    const [model, setModel] = useState<ModelAttributes>(DEFAULT_MODEL);
    const [savedModels, setSavedModels] = useState<ModelAttributes[]>([DEFAULT_MODEL]);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial Load
    useEffect(() => {
        const loadModels = async () => {
            try {
                const ms = await db.model.getAll();
                if(ms && ms.length) { 
                    const valid = ms.filter(m => m && m.id).map(m => ({ ...DEFAULT_MODEL, ...m }));
                    setSavedModels(valid.length ? valid : [DEFAULT_MODEL]);
                    setModel(valid.length ? valid[0] : DEFAULT_MODEL);
                }
            } catch(e) { console.error("Model Load Error", e); }
        };
        loadModels();
    }, []);

    // Sync UI instantly, Debounce DB Save
    useEffect(() => { 
        if(model?.id) {
            // 1. Instant UI Sync (Even for default profile)
            setSavedModels(prev => {
                const index = prev.findIndex(m => m.id === model.id);
                if (index > -1) {
                    const newArr = [...prev];
                    newArr[index] = model;
                    return newArr;
                }
                return prev;
            });

            // 2. Debounced DB Save (Skip for default)
            if (model.id !== 'default') {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    db.model.save(model);
                }, 500); // 500ms delay for DB writes
            }
        }
        return () => { if(timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, [model]);

    const createProfile = async () => {
        const nm = { ...DEFAULT_MODEL, id: Date.now().toString(), name: "New Model" };
        setModel(nm); 
        setSavedModels(p => [...p, nm]);
        await db.model.save(nm);
        addToast("New profile created", 'success');
    };

    const deleteProfile = async () => {
        if(savedModels.length <= 1) {
            addToast("Cannot delete last profile", 'warning');
            return;
        }
        await db.model.delete(model.id);
        const rem = savedModels.filter(m => m.id !== model.id);
        setSavedModels(rem); 
        setModel(rem[0]);
        addToast("Profile deleted", 'success');
    };

    return { model, setModel, savedModels, createProfile, deleteProfile };
};
