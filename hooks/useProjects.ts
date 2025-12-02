

import { useState, useEffect } from 'react';
import { Project } from '../types';
import { db } from '../services/db';

const DEFAULT_PROJECT_ID = 'default-campaign';

export const useProjects = (addToast: (msg: string, type?: any) => void) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                let all = await db.projects.getAll();
                // Initialize default if empty
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
                // Sort newest first
                setProjects(all.sort((a,b) => b.createdAt - a.createdAt));
                setActiveProject(all[0]);
            } catch (e) {
                console.error("Failed to load projects", e);
                addToast("Failed to load campaigns", 'error');
            }
        };
        loadProjects();
    }, []);

    const createProject = async (name: string) => {
        const newProject: Project = {
            id: Date.now().toString(),
            name: name || "New Campaign",
            createdAt: Date.now()
        };
        await db.projects.add(newProject);
        setProjects(p => [newProject, ...p]);
        setActiveProject(newProject);
        addToast(`Campaign "${name}" created`, 'success');
    };

    const renameProject = async (id: string, newName: string) => {
        if (!newName.trim()) return;
        await db.projects.update(id, { name: newName });
        setProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
        if (activeProject?.id === id) {
            setActiveProject(prev => prev ? { ...prev, name: newName } : null);
        }
        addToast("Campaign renamed", 'success');
    };

    const deleteProject = async (id: string) => {
        if (projects.length <= 1) return addToast("Cannot delete last campaign", 'warning');
        await db.projects.delete(id);
        const remaining = projects.filter(p => p.id !== id);
        setProjects(remaining);
        if (activeProject?.id === id) setActiveProject(remaining[0]);
        addToast("Campaign deleted", 'success');
    };

    return { projects, activeProject, setActiveProject, createProject, deleteProject, renameProject };
};