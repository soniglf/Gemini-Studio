import { create } from 'zustand';
import { Project } from '../types';
import { db } from '../services/db';
import { useUIStore } from './uiStore';
import { useGalleryStore } from './galleryStore';

interface ProjectState {
    projects: Project[];
    activeProject: Project | null;
    
    loadProjects: () => Promise<void>;
    setActiveProject: (project: Project) => void;
    createProject: (name: string) => Promise<void>;
    renameProject: (id: string, name: string) => Promise<void>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
}

const DEFAULT_PROJECT_ID = 'default-campaign';

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    activeProject: null,

    loadProjects: async () => {
        try {
            let all = await db.projects.getAll();
            if (!all || all.length === 0) {
                const def: Project = { 
                    id: DEFAULT_PROJECT_ID, 
                    name: 'First Campaign', 
                    description: 'My first collection of AI assets', 
                    createdAt: Date.now() 
                };
                await db.projects.add(def);
                all = [def];
            }
            const sorted = all.sort((a,b) => b.createdAt - a.createdAt);
            set({ 
                projects: sorted,
                activeProject: sorted[0] 
            });
            // Initial load trigger
            if (sorted[0]) {
                 useGalleryStore.getState().loadAssets(sorted[0].id);
            }
        } catch (e) {
            console.error(e);
            useUIStore.getState().addToast("Failed to load campaigns", 'error');
        }
    },

    setActiveProject: (project) => set({ activeProject: project }),

    createProject: async (name) => {
        const newProject: Project = {
            id: Date.now().toString(),
            name: name || "New Campaign",
            createdAt: Date.now()
        };
        await db.projects.add(newProject);
        set(state => ({ 
            projects: [newProject, ...state.projects],
            activeProject: newProject
        }));
        useUIStore.getState().addToast(`Campaign "${name}" created`, 'success');
    },

    renameProject: async (id, newName) => {
        if (!newName.trim()) return;
        await db.projects.update(id, { name: newName });
        set(state => ({
            projects: state.projects.map(p => p.id === id ? { ...p, name: newName } : p),
            activeProject: state.activeProject?.id === id ? { ...state.activeProject, name: newName } : state.activeProject
        }));
        useUIStore.getState().addToast("Campaign renamed", 'success');
    },

    updateProject: async (id, updates) => {
        await db.projects.update(id, updates);
        set(state => ({
            projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
            activeProject: state.activeProject?.id === id ? { ...state.activeProject, ...updates } : state.activeProject
        }));
        if(updates.customInstructions !== undefined) {
             useUIStore.getState().addToast("Brand guidelines saved", 'success');
        }
    },

    deleteProject: async (id) => {
        const { projects } = get();
        if (projects.length <= 1) {
            useUIStore.getState().addToast("Cannot delete last campaign", 'warning');
            return;
        }
        await db.projects.delete(id);
        const remaining = projects.filter(p => p.id !== id);
        set(state => ({
            projects: remaining,
            activeProject: state.activeProject?.id === id ? remaining[0] : state.activeProject
        }));
        useUIStore.getState().addToast("Campaign deleted", 'success');
    }
}));

// --- REACTIVE ORCHESTRATION (Project Synapse 2.0) ---
// This listener automatically loads assets when the active project changes.
useProjectStore.subscribe(
    (current, previous) => {
        if (current.activeProject && current.activeProject.id !== previous.activeProject?.id) {
            console.log(`[Synapse 2.0] Project changed to "${current.activeProject.name}". Hydrating gallery...`);
            useGalleryStore.getState().loadAssets(current.activeProject.id);
        }
    }
);
