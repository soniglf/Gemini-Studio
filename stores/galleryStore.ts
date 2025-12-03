
import { create } from 'zustand';
import { GeneratedAsset, Collection } from '../types';
import { db } from '../services/db';
import { useProjectStore } from './projectStore';
import { useGenerationStore } from './generationStore';

interface GalleryState {
    assets: GeneratedAsset[];
    pendingAssets: GeneratedAsset[]; // [Project Mirage] Optimistic Assets
    collections: Collection[];
    activeCollectionId: string | null;
    hasMore: boolean;
    isLoadingMore: boolean;
    activeTags: string[];
    historyPointer: number;
    
    loadAssets: (projectId: string) => Promise<void>;
    loadMore: () => Promise<void>;
    addAsset: (asset: GeneratedAsset) => Promise<void>;
    addPendingAsset: (asset: GeneratedAsset) => void; // [Project Mirage]
    removePendingAsset: (id: string) => void; // [Project Mirage]
    deleteAsset: (id: string) => Promise<void>;
    undo: () => void;
    redo: () => void;
    loadCollections: (projectId: string) => Promise<void>;
    createCollection: (name: string) => Promise<void>;
    deleteCollection: (id: string) => Promise<void>;
    setActiveCollection: (id: string | null) => void;
    moveAssetsToCollection: (assetIds: string[], collectionId: string | null) => Promise<void>;
    toggleTag: (tag: string) => void;
    getFilteredAssets: () => GeneratedAsset[];
    getAvailableTags: () => string[];
}

const PAGE_SIZE = 50;

export const useGalleryStore = create<GalleryState>((set, get) => ({
    assets: [],
    pendingAssets: [],
    collections: [],
    activeCollectionId: null,
    hasMore: true,
    isLoadingMore: false,
    activeTags: [],
    historyPointer: 0,

    loadAssets: async (projectId) => {
        try {
            const rawAssets = await db.assets.getByProject(projectId, PAGE_SIZE);
            const cols = await db.collections.getByProject(projectId);

            set({ 
                assets: rawAssets,
                collections: cols,
                hasMore: rawAssets.length === PAGE_SIZE,
                activeTags: [],
                activeCollectionId: null,
                historyPointer: 0,
                pendingAssets: [] // Clear pending on reload
            });
            
            if(rawAssets[0]) {
                 useGenerationStore.getState().setLastGenerated(rawAssets[0]);
            }

        } catch(e) { console.error("Asset Load Error", e); }
    },

    loadMore: async () => {
        const { assets, isLoadingMore } = get();
        const { activeProject } = useProjectStore.getState();
        if(!activeProject || isLoadingMore) return;

        set({ isLoadingMore: true });
        try {
            const lastAsset = assets[assets.length - 1];
            if(!lastAsset) return;

            const nextBatch = await db.assets.getByProject(activeProject.id, PAGE_SIZE, lastAsset.timestamp);
            
            if(nextBatch.length === 0) {
                set({ hasMore: false, isLoadingMore: false });
                return;
            }

            set(state => ({
                assets: [...state.assets, ...nextBatch],
                hasMore: nextBatch.length === PAGE_SIZE,
                isLoadingMore: false
            }));

        } catch(e) {
            console.error("Pagination Error", e);
            set({ isLoadingMore: false });
        }
    },

    addAsset: async (asset) => {
        await db.assets.add(asset);
        
        const { activeProject } = useProjectStore.getState();
        if (asset.projectId === activeProject?.id) {
            set(state => ({ 
                assets: [asset, ...state.assets],
                historyPointer: 0
            }));
        }
    },

    // [Project Mirage] Optimistic Actions
    addPendingAsset: (asset) => set(state => ({ pendingAssets: [asset, ...state.pendingAssets] })),
    removePendingAsset: (id) => set(state => ({ pendingAssets: state.pendingAssets.filter(a => a.id !== id) })),

    deleteAsset: async (id) => {
        await db.assets.delete(id);
        set(state => ({ 
            assets: state.assets.filter(a => a.id !== id),
            historyPointer: Math.min(state.historyPointer, state.assets.length - 2)
        }));
    },
    
    undo: () => {
        const { historyPointer, assets } = get();
        if (historyPointer < assets.length - 1) {
            const newPointer = historyPointer + 1;
            set({ historyPointer: newPointer });
            useGenerationStore.getState().setLastGenerated(assets[newPointer]);
        }
    },
    redo: () => {
        const { historyPointer, assets } = get();
        if (historyPointer > 0) {
            const newPointer = historyPointer - 1;
            set({ historyPointer: newPointer });
            useGenerationStore.getState().setLastGenerated(assets[newPointer]);
        }
    },

    loadCollections: async (projectId) => {
        const cols = await db.collections.getByProject(projectId);
        set({ collections: cols });
    },

    createCollection: async (name) => {
        const { activeProject } = useProjectStore.getState();
        if (!activeProject) return;
        const newCol: Collection = { id: `col-${Date.now()}`, projectId: activeProject.id, name, createdAt: Date.now() };
        await db.collections.add(newCol);
        set(state => ({ collections: [...state.collections, newCol] }));
    },

    deleteCollection: async (id) => {
        await db.collections.delete(id);
        set(state => ({ collections: state.collections.filter(c => c.id !== id), activeCollectionId: state.activeCollectionId === id ? null : state.activeCollectionId }));
    },

    setActiveCollection: (id) => set({ activeCollectionId: id, historyPointer: 0 }),

    moveAssetsToCollection: async (assetIds, collectionId) => {
        const { assets } = get();
        for (const id of assetIds) {
            // @ts-ignore
            await db.assets.update(id, { collectionId: collectionId || undefined });
        }
        set(state => ({ assets: state.assets.map(a => assetIds.includes(a.id) ? { ...a, collectionId: collectionId || undefined } : a) }));
    },

    toggleTag: (tag) => set(state => {
        if (state.activeTags.includes(tag)) return { activeTags: state.activeTags.filter(t => t !== tag) };
        return { activeTags: [...state.activeTags, tag] };
    }),

    getFilteredAssets: () => {
        const { assets, pendingAssets, activeTags, activeCollectionId } = get();
        // [Project Mirage] Include pending assets in view
        let filtered = [...pendingAssets, ...assets];
        if (activeCollectionId) filtered = filtered.filter(a => a.collectionId === activeCollectionId || a.id.startsWith('pending-'));
        if (activeTags.length > 0) filtered = filtered.filter(asset => asset.tags && activeTags.every(tag => asset.tags?.includes(tag)));
        return filtered;
    },

    getAvailableTags: () => {
        const { assets } = get();
        const tagCounts = new Map<string, number>();
        assets.forEach(asset => { asset.tags?.forEach(tag => { tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1); }); });
        return Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
    }
}));
