
import { create } from 'zustand';
import { GeneratedAsset, Collection } from '../types';
import { db } from '../services/db';
import { useProjectStore } from './projectStore';

interface GalleryState {
    assets: GeneratedAsset[];
    collections: Collection[];
    activeCollectionId: string | null;
    hasMore: boolean;
    isLoadingMore: boolean;
    activeTags: string[];
    
    loadAssets: (projectId: string) => Promise<void>;
    loadMore: () => Promise<void>;
    addAsset: (asset: GeneratedAsset) => Promise<void>;
    deleteAsset: (id: string) => Promise<void>;
    
    // Collections
    loadCollections: (projectId: string) => Promise<void>;
    createCollection: (name: string) => Promise<void>;
    deleteCollection: (id: string) => Promise<void>;
    setActiveCollection: (id: string | null) => void;
    moveAssetsToCollection: (assetIds: string[], collectionId: string | null) => Promise<void>;

    toggleTag: (tag: string) => void;
    getFilteredAssets: () => GeneratedAsset[];
    getAvailableTags: () => string[];
}

// Global set to track blob URLs across all store instances/reloads
const activeUrls = new Set<string>();

const PAGE_SIZE = 50;

export const useGalleryStore = create<GalleryState>((set, get) => ({
    assets: [],
    collections: [],
    activeCollectionId: null,
    hasMore: true,
    isLoadingMore: false,
    activeTags: [],

    loadAssets: async (projectId) => {
        try {
            // MEMORY CLEANUP: Revoke all previous URLs before loading new ones
            // This prevents memory bloat when switching projects
            activeUrls.forEach(url => URL.revokeObjectURL(url));
            activeUrls.clear();

            // Load assets
            const rawAssets = await db.assets.getByProject(projectId, PAGE_SIZE);
            const hydratedAssets = rawAssets.map(a => {
                if (a.blob && !a.url) {
                    const url = URL.createObjectURL(a.blob);
                    activeUrls.add(url);
                    return { ...a, url };
                }
                // If it already has a blob URL stored (rare/legacy), track it too
                if (a.url?.startsWith('blob:')) activeUrls.add(a.url);
                return a;
            });
            
            // Load Collections
            const cols = await db.collections.getByProject(projectId);

            set({ 
                assets: hydratedAssets,
                collections: cols,
                hasMore: rawAssets.length === PAGE_SIZE,
                activeTags: [],
                activeCollectionId: null
            });
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

            const hydratedBatch = nextBatch.map(a => {
                 if (a.blob && !a.url) {
                    const url = URL.createObjectURL(a.blob);
                    activeUrls.add(url);
                    return { ...a, url };
                }
                return a;
            });

            set(state => ({
                assets: [...state.assets, ...hydratedBatch],
                hasMore: nextBatch.length === PAGE_SIZE,
                isLoadingMore: false
            }));

        } catch(e) {
            console.error("Pagination Error", e);
            set({ isLoadingMore: false });
        }
    },

    loadCollections: async (projectId) => {
        const cols = await db.collections.getByProject(projectId);
        set({ collections: cols });
    },

    createCollection: async (name) => {
        const { activeProject } = useProjectStore.getState();
        if (!activeProject) return;
        
        const newCol: Collection = {
            id: `col-${Date.now()}`,
            projectId: activeProject.id,
            name,
            createdAt: Date.now()
        };
        await db.collections.add(newCol);
        set(state => ({ collections: [...state.collections, newCol] }));
    },

    deleteCollection: async (id) => {
        await db.collections.delete(id);
        set(state => ({ 
            collections: state.collections.filter(c => c.id !== id),
            activeCollectionId: state.activeCollectionId === id ? null : state.activeCollectionId
        }));
    },

    setActiveCollection: (id) => set({ activeCollectionId: id }),

    moveAssetsToCollection: async (assetIds, collectionId) => {
        const { assets } = get();
        // Update DB
        for (const id of assetIds) {
            const asset = assets.find(a => a.id === id);
            if (asset) {
                const update = { collectionId: collectionId || undefined };
                // @ts-ignore
                await db.assets.update(id, update);
            }
        }
        // Update Local State
        set(state => ({
            assets: state.assets.map(a => assetIds.includes(a.id) ? { ...a, collectionId: collectionId || undefined } : a)
        }));
    },

    addAsset: async (asset) => {
        if(asset.url?.startsWith('blob:')) activeUrls.add(asset.url);
        await db.assets.add(asset);
        
        // Only update state if it belongs to current project
        const { activeProject } = useProjectStore.getState();
        if (asset.projectId === activeProject?.id) {
            set(state => ({ assets: [asset, ...state.assets] }));
        }
    },

    deleteAsset: async (id) => {
        const asset = get().assets.find(a => a.id === id);
        
        // Immediate Cleanup
        if (asset?.url && activeUrls.has(asset.url)) {
            URL.revokeObjectURL(asset.url);
            activeUrls.delete(asset.url);
        }
        
        await db.assets.delete(id);
        set(state => ({ assets: state.assets.filter(a => a.id !== id) }));
    },

    toggleTag: (tag) => set(state => {
        if (state.activeTags.includes(tag)) {
            return { activeTags: state.activeTags.filter(t => t !== tag) };
        }
        return { activeTags: [...state.activeTags, tag] };
    }),

    getFilteredAssets: () => {
        const { assets, activeTags, activeCollectionId } = get();
        let filtered = assets;

        if (activeCollectionId) {
            filtered = filtered.filter(a => a.collectionId === activeCollectionId);
        }

        if (activeTags.length > 0) {
            filtered = filtered.filter(asset => {
                if (!asset.tags) return false;
                return activeTags.every(tag => asset.tags?.includes(tag));
            });
        }

        return filtered;
    },

    getAvailableTags: () => {
        const { assets } = get();
        const tagCounts = new Map<string, number>();
        
        assets.forEach(asset => {
            asset.tags?.forEach(tag => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });

        return Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([tag]) => tag);
    }
}));
